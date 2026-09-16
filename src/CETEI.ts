import defaultBehaviors from './defaultBehaviors.js';
import * as utilities from './utilities.js';
import {addBehaviors, addBehavior, removeBehavior} from './behaviors.js';
import {learnElementNames, learnCustomElementNames} from './dom.js';
import type {
  BehaviorsMap,
  BehaviorDefinition,
  BehaviorDefinitionMap,
  BehaviorFunction,
  BehaviorRule,
  CETEIInstance,
  CETEIOptions,
  HandlerFunction,
  NamespaceMap,
  PerElementCallback,
  PrefixDefsStore,
  UtilitiesAPI,
} from './types.js';

type ProcessingCallback = (dom: DocumentFragment, cet: CETEIInstance) => void;

let ceteiceanLoad: Event | null = null;
const ELEMENT_NODE = 1;
const PROCESSING_INSTRUCTION_NODE = 7;
const COMMENT_NODE = 8;

class CETEI implements CETEIInstance {
  document!: Document;
  options: CETEIOptions;
  base = "";
  dom: DocumentFragment | null = null;
  XML_dom?: Document;
  els: Set<string>;
  namespaces: NamespaceMap;
  behaviors: Record<string, BehaviorDefinition>;
  hasStyle = false;
  prefixDefs: PrefixDefsStore;
  debug = false;
  discardContent = false;
  utilities: UtilitiesAPI;
  addBehaviors: (map: BehaviorsMap) => void;
  addBehavior: (ns: string | Record<string, string>, element: string, behavior: BehaviorDefinition) => void;
  removeBehavior: (ns: string | Record<string, string>, element: string) => void;
  done = false;
  noteIndex?: number;

  constructor(options?: CETEIOptions) {
    this.options = options ?? {};

    // Determine the document in this order of preference: options, window, global
    const envDoc = this.options.documentObject
      ?? (typeof window !== 'undefined' && window.document ? window.document : undefined)
      ?? (typeof globalThis !== 'undefined' && (globalThis as typeof globalThis & { document?: Document }).document);
    if (!envDoc) {
      throw new Error('CETEI requires a Document object. Provide one via options.documentObject when running outside the browser.');
    }
    this.document = envDoc;

    // Bind methods
    this.addBehaviors = addBehaviors.bind(this);
    this.addBehavior = addBehavior.bind(this);
    this.removeBehavior = removeBehavior.bind(this);

    // Bind selected utilities
    this.utilities = { dom: null } as UtilitiesAPI;
    const utilitiesBag = this.utilities as Record<string, unknown>;
    for (const u of Object.keys(utilities) as Array<keyof typeof utilities>) {
      const utility = utilities[u];
      if (typeof utility === 'function' && ["getPrefixDef", "rw", "resolveURI"].includes(u as string)) {
        utilitiesBag[u as string] = utility.bind(this);
      } else {
        utilitiesBag[u as string] = utility;
      }
    }

    // Set properties
    this.els = new Set<string>();
    this.namespaces = new Map<string | null, string>();
    this.behaviors = {};
    this.hasStyle = false;
    this.prefixDefs = [] as PrefixDefsStore;
    this.debug = this.options.debug === true;
    this.discardContent = this.options.discardContent === true;

    if (this.options.base) {
      this.base = this.options.base;
    } else if (typeof window !== 'undefined' && window.location) {
      this.base = window.location.href.replace(/\/[^/]*$/, "/");
    }
    if (!this.options.omitDefaultBehaviors) {
      this.addBehaviors(defaultBehaviors);
    }
    if (this.options.ignoreFragmentId && typeof window !== 'undefined') {
      window.removeEventListener("ceteiceanload", CETEI.restorePosition);
    }
  }

  /* 
    Returns a Promise that fetches an XML source document from the URL
    provided in the first parameter and then calls the makeHTML5 method
    on the returned document.
  */
  async getHTML5(XML_url: string, callback?: ProcessingCallback, perElementFn?: PerElementCallback): Promise<DocumentFragment | void> {
    if (typeof window !== 'undefined' && window.location.href.startsWith(this.base) && XML_url.includes("/")) {
      this.base = XML_url.replace(/\/[^/]*$/, "/");
    }
    try {
      const response = await fetch(XML_url);
      if (!response.ok) {
        console.log(`Could not get XML file ${XML_url}.\nServer returned ${response.status}: ${response.statusText}`);
        return;
      }
      const XML = await response.text();
      return this.makeHTML5(XML, callback, perElementFn);
    } catch (error) {
      console.log(error);
    }
  }

  /* 
    Converts the supplied XML string into HTML5 Custom Elements. If a callback
    function is supplied, calls it on the result.
  */
  makeHTML5(XML: string, callback?: ProcessingCallback, perElementFn?: PerElementCallback): DocumentFragment | void {
    this.XML_dom = (new DOMParser()).parseFromString(XML, "text/xml");
    return this.domToHTML5(this.XML_dom, callback, perElementFn);
  }

  preprocess(XML_dom: Document, _callback?: ProcessingCallback | null, perElementFn?: PerElementCallback): void {
    this.els = learnElementNames(XML_dom, this.namespaces);

    const convertEl = (el: Element): Element => {
      // Elements with defined namespaces get the prefix mapped to that element. All others keep
      // their namespaces and are copied as-is.
      let newElement: Element;
      const ns = el.namespaceURI ?? "";
      if (this.namespaces.has(ns)) {
        const prefix = this.namespaces.get(ns);
        newElement = this.document.createElement(`${prefix}-${el.localName.toLowerCase()}`);
      } else {
        newElement = this.document.importNode(el, false);
      }
      // Copy attributes; @xmlns, @xml:id, @xml:lang, and
      // @rendition get special handling.
      for (const att of Array.from(el.attributes)) {
        if (att.name === "xmlns") {
          //Strip default namespaces, but hang on to the values
          newElement.setAttribute("data-xmlns", att.value);
        } else if (att.name !== "role") {
          newElement.setAttribute(att.name, att.value);
        }
        if (att.name === "xml:id") {
          newElement.setAttribute("id", att.value);
        }
        if (att.name === "xml:lang") {
          newElement.setAttribute("lang", att.value);
        }
        if (att.name === "rendition") {
          newElement.setAttribute("class", att.value.replace(/#/g, ""));
        }
        // @role has a name collision with the HTML5 role attribute, so we use a TEI-specific attribute instead.
        if (att.name === "role") {
          newElement.setAttribute("tei-role", att.value);
        }
      }
      // Preserve element name so we can use it later
      newElement.setAttribute("data-origname", el.localName);
      if (el.hasAttributes()) {
        newElement.setAttribute("data-origatts", el.getAttributeNames().join(" "));
      }
      // If element is empty, flag it
      if (el.childNodes.length === 0) {
        newElement.setAttribute("data-empty", "");
      }
      // <head> elements need to know their level
      if (el.localName === "head" && el.namespaceURI === "http://www.tei-c.org/ns/1.0") {
        const getLevel = (head: Element): number => {
          let count = 0;
          let ancestor = head.parentElement;
          while (ancestor) {
            const children = ancestor.children;
            let i = 0;            
            while (i < children.length) {             
              if (children[i].tagName.toLowerCase() === "head" && children[i].namespaceURI === "http://www.tei-c.org/ns/1.0") {
                count++;
                break; // Only count once
              }
              i++;
            }
            ancestor = ancestor.parentElement; // Move to the next ancestor
          }
          return count;
        };
        newElement.setAttribute("data-level", String(getLevel(el)));
      }
      // Turn <rendition scheme="css"> elements into HTML styles
      if (el.localName === "tagsDecl") {
        const style = this.document.createElement("style");
        for (const node of Array.from(el.childNodes)){
          if (node.nodeType === ELEMENT_NODE) {
            const rendition = node as Element;
            if (rendition.localName === "rendition" && rendition.getAttribute("scheme") === "css") {
            let rule = "";
            if (rendition.hasAttribute("selector")) {
              //rewrite element names in selectors
              rule += (rendition.getAttribute("selector") || "").replace(/([^#, >]+\w*)/g, "tei-$1").replace(/#tei-/g, "#") + "{\n";
              rule += rendition.textContent ?? "";
            } else {
              rule += "." + (rendition.getAttribute("xml:id") ?? "") + "{\n";
              rule += rendition.textContent ?? "";
            }
            rule += "\n}\n";
            style.appendChild(this.document.createTextNode(rule));
            }
          }
        }
        if (style.childNodes.length > 0) {
          newElement.appendChild(style);
          this.hasStyle = true;
        }
      }
      // Get prefix definitions
      if (el.localName === "prefixDef") {
        const ident = el.getAttribute("ident");
        if (ident) {
          this.prefixDefs.push(ident);
          this.prefixDefs[ident] = {
            matchPattern: el.getAttribute("matchPattern") ?? "",
            replacementPattern: el.getAttribute("replacementPattern") ?? "",
          };
        }
      }
      // Aria roles for landmark elements
      if (el.localName === "TEI") {
        newElement.setAttribute("role", "main");
      }
      if (["body", "front", "back", "div"].includes(el.localName)) {
        newElement.setAttribute("role", "region");
        newElement.setAttribute("aria-label", el.getAttribute("xml:id") || el.getAttribute("n") || el.localName);
      } 
      for (const node of Array.from(el.childNodes)) {
        if (node.nodeType === ELEMENT_NODE) {
          newElement.appendChild(convertEl(node as Element));
        } else {
          newElement.appendChild(node.cloneNode());
        }
      }
      if (perElementFn) {
        perElementFn(newElement, el);
      }
      return newElement;
    };

    this.dom = this.document.createDocumentFragment();
    for (const node of Array.from(XML_dom.childNodes)) {
      if (node.nodeType === ELEMENT_NODE) {
        this.dom.appendChild(convertEl(node as Element));
      }
      if (node.nodeType === PROCESSING_INSTRUCTION_NODE) {
        this.dom.appendChild(this.document.importNode(node, true));
      }
      if (node.nodeType === COMMENT_NODE) {
        this.dom.appendChild(this.document.importNode(node, true));
      }
    }
    // DocumentFragments don't work in the same ways as other nodes, so use the root element.
    this.utilities.dom = this.dom.firstElementChild ?? null;
  }

  /* 
    Converts the supplied XML DOM into HTML5 Custom Elements. If a callback
    function is supplied, calls it on the result.
  */
  domToHTML5(XML_dom: Document, callback?: ProcessingCallback, perElementFn?: PerElementCallback): DocumentFragment | void {

    this.preprocess(XML_dom, null, perElementFn);

    this.applyBehaviors();
    this.done = true;
    if (callback) {
      callback(this.dom, this);
      if (window) {
        window.dispatchEvent(ceteiceanLoad);
      }
    } else {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(ceteiceanLoad);
      }
      return this.dom;
    }
  }

  /*
    Convenience method for HTML pages containing pre-processed CETEIcean Custom 
    Elements. Usage:
      const c = new CETEI();
      c.processPage();
  */
  processPage(): void {
    this.els = learnCustomElementNames(this.document);
    this.applyBehaviors();
    if (window) {
      window.dispatchEvent(ceteiceanLoad);
    }
  }

  /* 
    To change a namespace -> prefix mapping, the namespace must first be 
    unset. Takes a namespace URI. In order to process a TEI P4 document, e.g.,
    the TEI namespace must be unset before it can be set to the empty string.
  */
  unsetNamespace(ns: string | null): void {
    this.namespaces.delete(ns);
  }

  /* 
    Sets the base URL for the document. Used to rewrite relative links in the
    XML source (which may be in a completely different location from the HTML
    wrapper).
  */
  setBaseUrl(base: string): void {
    this.base = base;
  }

  /* 
  Appends any element returned by the function passed in the first
  parameter to the element in the second parameter. If the function
  returns nothing, this is a no-op aside from any side effects caused
  by the provided function.

  Called by getHandler() and fallback()
  */
  append(fn: BehaviorFunction, elt?: Element): HandlerFunction | void {
    const process = (target: Element): void => {
      if (target.hasAttribute('data-processed')) {
        return;
      }
      const content = fn.call(this.utilities, target);
      if (content) {
        this.appendBasic(target, content);
      }
    };

    if (elt) {
      process(elt);
      return;
    }

    return function(this: HTMLElement): void {
      process(this);
    };
  }

  appendBasic(elt: Element, content: Node): void {
    if (this.discardContent) {
      elt.innerHTML = "";
    } else {
      utilities.hideContent(elt, true);
    }
    elt.appendChild(content);
  }

  // Given an element, return its qualified name as defined in a behaviors object
  bName(e: Element): string {
    const dashIndex = e.tagName.indexOf("-");
    const prefix = e.tagName.substring(0, dashIndex).toLowerCase();
    return `${prefix}:${e.getAttribute("data-origname")}`;
  }

  /* 
    Private method called by append(). Takes a child element and a name, and recurses through the
    child's siblings until an element with that name is found, returning true if it is and false if not.
  */
  childExists(elt: Element | null, name: string): boolean {
    if (!elt) {
      return false;
    }
    if (elt.nodeName === name) {
      return true;
    }
    return !!elt.nextElementSibling && this.childExists(elt.nextElementSibling, name);
  }

/* 
  Takes a template in the form of either an array of 1 or 2 
  strings or an object with CSS selector keys and either functions
  or arrays as described above. Returns a closure around a function 
  that can be called in the element constructor or applied to an 
  individual element. An empty array is considered a no-op.

  Called by the getHandler() and getFallback() methods
*/
  decorator(template: BehaviorDefinition): BehaviorFunction {
    if (Array.isArray(template)) {
      if (template.length === 0) {
        return (function(this: UtilitiesAPI) {}) as BehaviorFunction;
      }
      if (!Array.isArray(template[0])) {
        return this.applyDecorator(template as string[]);
      }
      const rules = template as BehaviorRule[];
      const handleAction = (action: BehaviorDefinition, context: UtilitiesAPI, target: Element) => {
        if (Array.isArray(action)) {
          return this.decorator(action).call(context, target);
        }
        return (action as BehaviorFunction).call(context, target);
      };
      return function(this: UtilitiesAPI, elt: Element) {
        for (const [selector, action] of rules) {
          if (elt.matches(selector) || selector === "_") {
            return handleAction(action, this, elt);
          }
        }
      };
    }
    return template as BehaviorFunction;
  }

  applyDecorator(strings: string[]): BehaviorFunction {
    const renderTemplate = (str: string, element: Element) => this.template(str, element);
    const insertContent = (element: Element, copy: string[]) => this.insert(element, copy);
    return function(this: UtilitiesAPI, elt: Element) {
      const copy = strings.map((str) => renderTemplate(str, elt));
      return insertContent(elt, copy);
    };
  }

/* 
  Returns the fallback function for the given element name.
  Called by fallback().
*/
  getFallback(behaviors: BehaviorDefinitionMap, fn: string): BehaviorFunction | undefined {
    const behavior = behaviors[fn];
    if (!behavior) {
      return undefined;
    }
    if (behavior instanceof Function) {
      return behavior;
    }
    return this.decorator(behavior);
  }

  /* 
    Returns the handler function for the given element name
    Called by define().
  */
  getHandler(behaviors: BehaviorDefinitionMap, fn: string): HandlerFunction | undefined {
    const behavior = behaviors[fn];
    if (!behavior) {
      return undefined;
    }
    if (behavior instanceof Function) {
      return this.append(behavior) as HandlerFunction;
    }
    return this.append(this.decorator(behavior)) as HandlerFunction;
  }

  insert(elt: Element, strings: string[]): Node {
    const content = this.document.createElement("cetei-content");
    for (const node of Array.from(elt.childNodes)) {
      if (node.nodeType === ELEMENT_NODE && !(node as Element).hasAttribute("data-processed")) {
        this.processElement(node as Element);
      }
    }
    if (strings[0].match("<[^>]+>") && strings[1] && strings[1].match("<[^>]+>")) {
      content.innerHTML = strings[0] + elt.innerHTML + (strings[1] ? strings[1] : "");
    } else {
      content.innerHTML = strings[0];
      content.setAttribute("data-before", String(strings[0].replace(/<[^>]+>/g,"").length));
      for (const node of Array.from(elt.childNodes)) {
        content.appendChild(node.cloneNode(true));
      }
      if (strings.length > 1) {
        content.innerHTML += strings[1];
        content.setAttribute("data-after", String(strings[1].replace(/<[^>]+>/g,"").length));
      }
    }
    if (content.childNodes.length < 2) {
      return content.firstChild ?? content;
    }
    return content;
  }
  // Runs behaviors recursively on the supplied element and children
  processElement(elt: Element): void {
    if (elt.hasAttribute("data-origname") && !elt.hasAttribute("data-processed")) {
      const fn = this.getFallback(this.behaviors, this.bName(elt));
      if (fn) {
        this.append(fn, elt);
        elt.setAttribute("data-processed", "");
      }
    }
    for (const node of Array.from(elt.childNodes)) {
      if (node.nodeType === ELEMENT_NODE) {
        this.processElement(node as Element);
      }
    }
  }

  template(str: string, elt: Element): string {
    let result = str;
    if (str.search(/\$(\w*)(@([a-zA-Z:]+))/)) {
      const re = /\$(\w*)@([a-zA-Z:]+)/g;
      let replacements: RegExpExecArray | null;
      while ((replacements = re.exec(str))) {
        if (elt.hasAttribute(replacements[2])) {
          const utilName = replacements[1];
          if (utilName) {
            const utilFn = this.utilities[utilName];
            if (typeof utilFn === 'function') {
              const value = elt.getAttribute(replacements[2]);
              const replacement = utilFn.call(this.utilities, value);
              result = result.replace(replacements[0], replacement);
              continue;
            }
          }
          result = result.replace(replacements[0], elt.getAttribute(replacements[2]));
        } else {
          result = result.replace(replacements[0], "");
        }
      }
    }
    return result;
  }

  // Define or apply behaviors for the document
  applyBehaviors(): void {
    if (typeof window !== 'undefined' && window.customElements) {
      this.define(this.els);
    } else {
      this.fallback(this.els);
    }
  }

  /* 
    Registers the list of elements provided with the browser.
    Called by makeHTML5(), but can be called independently if, for example,
    you've created Custom Elements via an XSLT transformation instead.
  */
  define(names: Set<string>): void {
    for (const name of names) {
      const fn = this.getHandler(this.behaviors, name) ?? null;
      utilities.defineCustomElement(name, fn, this.debug);
    }
  }

  /* 
    Provides fallback functionality for environments where Custom Elements
    are not supported.

    Like define(), this is called by makeHTML5(), but can be called
    independently.
  */
  fallback(names: Set<string>): void {
    for (const name of names) {
      const fn = this.getFallback(this.behaviors, name);
      if (!fn) {
        continue;
      }
      const scope: Document | DocumentFragment = this.dom && !this.done ? this.dom : this.document;
      const elements = scope.querySelectorAll(utilities.tagName(name));
      for (const elt of Array.from(elements)) {
        if (!elt.hasAttribute("data-processed")) {
          this.append(fn, elt);
          elt.setAttribute("data-processed", "");
        }
      }
    }
  }

  /**********************
   * Utility functions  *
   **********************/

  
  static savePosition(): void {
    window.sessionStorage.setItem(`${window.location}-scroll`, String(window.scrollY));
  }
  
  static restorePosition() {
    if (!window.location.hash) {
      const key = `${window.location}-scroll`;
      const scroll = window.sessionStorage.getItem(key);
      if (scroll !== null) {
        window.sessionStorage.removeItem(key);
        setTimeout(() => {
          window.scrollTo(0, Number(scroll));
        }, 100);
      }
    } else {
      setTimeout(() => {
        const selector = decodeURI(window.location.hash);
        const target = window.document.querySelector(selector);
        if (target) {
          target.scrollIntoView();
        }
      }, 100);
    }
  }

}

declare global {
  interface Window {
    CETEI?: typeof CETEI;
  }
}

try {
  if (typeof window !== 'undefined') {
    (window as typeof window & { CETEI?: typeof CETEI }).CETEI = CETEI;
    window.addEventListener("beforeunload", CETEI.savePosition);
    ceteiceanLoad = new Event("ceteiceanload");
    window.addEventListener("ceteiceanload", CETEI.restorePosition);
  }
} catch (e) {
  console.log(e);
}

export default CETEI;
