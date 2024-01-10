import defaultBehaviors from './defaultBehaviors.js';
import * as utilities from './utilities.js';
import {addBehaviors, addBehavior, removeBehavior} from './behaviors.js';
import {learnElementNames, learnCustomElementNames} from './dom.js';

class CETEI {
  constructor(options){
    this.options = options ? options : {}

    // Set a local reference to the Document object
    // Determine document in this order of preference: options, window, global 
    this.document = this.options.documentObject ? this.options.documentObject : undefined
    if (this.document === undefined) {
      if (typeof window !== 'undefined' && window.document) {
        this.document = window.document
      } else if (typeof global !== 'undefined' && global.document) {
        this.document = global.document
      }
    }

    // Bind methods
    this.addBehaviors = addBehaviors.bind(this);
    this.addBehavior = addBehavior.bind(this);
    this.removeBehavior = removeBehavior.bind(this);

    // Bind selected utilities
    this.utilities = {}
    for (const u of Object.keys(utilities)) {
      if (["getPrefixDef", "rw", "resolveURI"].includes(u)) {
        this.utilities[u] = utilities[u].bind(this);
      } else {
        this.utilities[u] = utilities[u];
      }
    }

    // Set properties
    this.els = [];
    this.namespaces = new Map();
    this.behaviors = {};
    this.hasStyle = false;
    this.prefixDefs = [];
    this.debug = this.options.debug === true ? true : false;
    this.discardContent = this.options.discardContent === true ? true : false;

    if (this.options.base) {
      this.base = this.options.base;
    } else {
      try {
        if (window) {
          this.base = window.location.href.replace(/\/[^\/]*$/, "/");
        }
      } catch (e) {
        this.base = "";
      }
    }
    if (!this.options.omitDefaultBehaviors) {
      this.addBehaviors(defaultBehaviors);
    }
    if (this.options.ignoreFragmentId) {
      if (window) {
        window.removeEventListener("ceteiceanload", CETEI.restorePosition);
      }
    }
  }

  /* 
    Returns a Promise that fetches an XML source document from the URL
    provided in the first parameter and then calls the makeHTML5 method
    on the returned document.
  */
  async getHTML5(XML_url, callback, perElementFn){
    if (window && window.location.href.startsWith(this.base) && (XML_url.indexOf("/") >= 0)) {
      this.base = XML_url.replace(/\/[^\/]*$/, "/");
    }
    try {
      const response = await fetch(XML_url);
      if (response.ok) {
        const XML = await response.text();
        return this.makeHTML5(XML, callback, perElementFn);
      } else {
        console.log(`Could not get XML file ${XML_url}.\nServer returned ${response.status}: ${response.statusText}`);
      }
    }
    catch (error) {
      console.log(error);
    }
  }

  /* 
    Converts the supplied XML string into HTML5 Custom Elements. If a callback
    function is supplied, calls it on the result.
  */
  makeHTML5(XML, callback, perElementFn){
    // XML is assumed to be a string
    this.XML_dom = ( new DOMParser() ).parseFromString(XML, "text/xml");
    return this.domToHTML5(this.XML_dom, callback, perElementFn);
  }

  preprocess(XML_dom, callback, perElementFn) {
    this.els = learnElementNames(XML_dom, this.namespaces);

    let convertEl = (el) => {
      // Elements with defined namespaces get the prefix mapped to that element. All others keep
      // their namespaces and are copied as-is.
      let newElement;
      if (this.namespaces.has(el.namespaceURI ? el.namespaceURI : "")) {
        let prefix = this.namespaces.get(el.namespaceURI ? el.namespaceURI : "");
        newElement = this.document.createElement(`${prefix}-${el.localName.toLowerCase()}`);
      } else {
        newElement = this.document.importNode(el, false);
      }
      // Copy attributes; @xmlns, @xml:id, @xml:lang, and
      // @rendition get special handling.
      for (let att of Array.from(el.attributes)) {
          if (att.name == "xmlns") {
            //Strip default namespaces, but hang on to the values
            newElement.setAttribute("data-xmlns", att.value);
          } else {
            newElement.setAttribute(att.name, att.value);
          }
          if (att.name == "xml:id") {
            newElement.setAttribute("id", att.value);
          }
          if (att.name == "xml:lang") {
            newElement.setAttribute("lang", att.value);
          }
          if (att.name == "rendition") {
            newElement.setAttribute("class", att.value.replace(/#/g, ""));
          }
      }
      // Preserve element name so we can use it later
      newElement.setAttribute("data-origname", el.localName);
      if (el.hasAttributes()) {
        newElement.setAttribute("data-origatts", el.getAttributeNames().join(" "));
      }
      // If element is empty, flag it
      if (el.childNodes.length == 0) {
        newElement.setAttribute("data-empty", "");
      }
      // <head> elements need to know their level
      if (el.localName == "head") {
        // 1 is XPathResult.NUMBER_TYPE
        let level = XML_dom.evaluate("count(ancestor::*[tei:head])", el, function(ns) {
          if (ns == "tei") return "http://www.tei-c.org/ns/1.0";
        }, 1, null);
        newElement.setAttribute("data-level", level.numberValue);
      }
      // Turn <rendition scheme="css"> elements into HTML styles
      if (el.localName == "tagsDecl") {
        let style = this.document.createElement("style");
        for (let node of Array.from(el.childNodes)){
          // nodeType 1 is Node.ELEMENT_NODE
          if (node.nodeType == 1 && node.localName == "rendition" && node.getAttribute("scheme") == "css") {
            let rule = "";
            if (node.hasAttribute("selector")) {
              //rewrite element names in selectors
              rule += node.getAttribute("selector").replace(/([^#, >]+\w*)/g, "tei-$1").replace(/#tei-/g, "#") + "{\n";
              rule += node.textContent;
            } else {
              rule += "." + node.getAttribute("xml:id") + "{\n";
              rule += node.textContent;
            }
            rule += "\n}\n";
            style.appendChild(this.document.createTextNode(rule));
          }
        }
        if (style.childNodes.length > 0) {
          newElement.appendChild(style);
          this.hasStyle = true;
        }
      }
      // Get prefix definitions
      if (el.localName == "prefixDef") {
        this.prefixDefs.push(el.getAttribute("ident"));
        this.prefixDefs[el.getAttribute("ident")] = {
          "matchPattern": el.getAttribute("matchPattern"),
          "replacementPattern": el.getAttribute("replacementPattern")
        };
      }
      for (let node of Array.from(el.childNodes)) {
          // Node.ELEMENT_NODE
          if (node.nodeType == 1 ) {
              newElement.appendChild(convertEl(node));
          }
          else {
              newElement.appendChild(node.cloneNode());
          }
      }
      if (perElementFn) {
        perElementFn(newElement, el);
      }
      return newElement;
    }

    this.dom = this.document.createDocumentFragment();
    for (let node of Array.from(XML_dom.childNodes)) {
      // Node.ELEMENT_NODE
      if (node.nodeType == 1) {
        this.dom.appendChild(convertEl(node));
      }
      // Node.PROCESSING_INSTRUCTION_NODE
      if (node.nodeType == 7) {
        this.dom.appendChild(this.document.importNode(node, true));
      }
      // Node.COMMENT_NODE
      if (node.nodeType == 8) {
        this.dom.appendChild(this.document.importNode(node, true));
      }
    }
    // DocumentFragments don't work in the same ways as other nodes, so use the root element.
    this.utilities.dom = this.dom.firstElementChild;

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
    Converts the supplied XML DOM into HTML5 Custom Elements. If a callback
    function is supplied, calls it on the result.
  */
  domToHTML5(XML_dom, callback, perElementFn){

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
  processPage() {
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
  unsetNamespace(ns) {
    this.namespaces.delete(ns);
  }

  /* 
    Sets the base URL for the document. Used to rewrite relative links in the
    XML source (which may be in a completely different location from the HTML
    wrapper).
  */
  setBaseUrl(base) {
    this.base = base;
  }

  /* 
  Appends any element returned by the function passed in the first
  parameter to the element in the second parameter. If the function
  returns nothing, this is a no-op aside from any side effects caused
  by the provided function.

  Called by getHandler() and fallback()
  */
append(fn, elt) {
  let self = this;
  if (elt && !elt.hasAttribute('data-processed')) {
    let content = fn.call(self.utilities, elt);
    if (content) {
      self.appendBasic(elt, content);
    }
  } else {
    return function() {
      if (!this.hasAttribute("data-processed")) {
        let content = fn.call(self.utilities, this);
        if (content) {
          self.appendBasic(this, content);
        }
      }
    }
  }
}

appendBasic(elt, content) {
  if (this.discardContent) {
    elt.innerHTML = "";
  } else {
    utilities.hideContent(elt, true);
  }
  elt.appendChild(content);
}

// Given an element, return its qualified name as defined in a behaviors object
bName(e) {
  return e.tagName.substring(0,e.tagName.indexOf("-")).toLowerCase() + ":" + e.getAttribute("data-origname");
}

/* 
  Private method called by append(). Takes a child element and a name, and recurses through the
  child's siblings until an element with that name is found, returning true if it is and false if not.
*/
childExists(elt, name) {
  if (elt && elt.nodeName == name) {
    return true;
  } else {
    return elt && elt.nextElementSibling && this.childExists(elt.nextElementSibling, name);
  }
}

/* 
  Takes a template in the form of either an array of 1 or 2 
  strings or an object with CSS selector keys and either functions
  or arrays as described above. Returns a closure around a function 
  that can be called in the element constructor or applied to an 
  individual element. An empty array is considered a no-op.

  Called by the getHandler() and getFallback() methods
*/
decorator(template) {
  if (Array.isArray(template) && template.length == 0) {
    return function(e) {};
  }
  if (Array.isArray(template) && !Array.isArray(template[0])) {
    return this.applyDecorator(template)
  } 
  let self = this;
  return function(elt) {
    for (let rule of template) {
      if (elt.matches(rule[0]) || rule[0] === "_") {
        if (Array.isArray(rule[1])) {
          return self.decorator(rule[1]).call(this, elt);
        } else {
          return rule[1].call(this, elt);
        }
      }
    }
  }
}

applyDecorator(strings) {
  let self = this;
  return function (elt) {
    let copy = [];
    for (let i = 0; i < strings.length; i++) {
      copy.push(self.template(strings[i], elt));
    }
    return self.insert(elt, copy);
  }
}

/* 
  Returns the fallback function for the given element name.
  Called by fallback().
*/
getFallback(behaviors, fn) {
  if (behaviors[fn]) {
    if (behaviors[fn] instanceof Function) {
      return behaviors[fn];
    } else {
      return this.decorator(behaviors[fn]);
    }
  }
}

/* 
  Returns the handler function for the given element name
  Called by define().
*/
getHandler(behaviors, fn) {
  if (behaviors[fn]) {
    if (behaviors[fn] instanceof Function) {
      return this.append(behaviors[fn]);
    } else {
      return this.append(this.decorator(behaviors[fn]));
    }
  }
}

insert(elt, strings) {
  let content = this.document.createElement("cetei-content");
  for (let node of Array.from(elt.childNodes)) {
    // nodeType 1 is Node.ELEMENT_NODE
    if (node.nodeType === 1 && !node.hasAttribute("data-processed")) {
      this.processElement(node);
    }
  } 
  // If we have before and after tags have them parsed by
  // .innerHTML and then add the content to the resulting child
  if (strings[0].match("<[^>]+>") && strings[1] && strings[1].match("<[^>]+>")) { 
    content.innerHTML = strings[0] + elt.innerHTML + (strings[1]?strings[1]:"");
  } else {
    content.innerHTML = strings[0];
    content.setAttribute("data-before", strings[0].replace(/<[^>]+>/g,"").length);
    for (let node of Array.from(elt.childNodes)) {
      content.appendChild(node.cloneNode(true));
    }
    if (strings.length > 1) {
      content.innerHTML += strings[1];
      content.setAttribute("data-after", strings[1].replace(/<[^>]+>/g,"").length);
    } 
  }
  if (content.childNodes.length < 2) {
    return content.firstChild;
  } else {
    return content;
  }
}

// Runs behaviors recursively on the supplied element and children
processElement(elt) {
  if (elt.hasAttribute("data-origname") && ! elt.hasAttribute("data-processed")) {
    let fn = this.getFallback(this.bName(elt));
    if (fn) {
      this.append(fn,elt);
      elt.setAttribute("data-processed", "");
    }
  }
  for (let node of Array.from(elt.childNodes)) {
    // nodeType 1 is Node.ELEMENT_NODE
    if (node.nodeType === 1) {
      this.processElement(node);
    }
  }
}

template(str, elt) {
  let result = str;
  if (str.search(/\$(\w*)(@([a-zA-Z:]+))/ )) {
    let re = /\$(\w*)@([a-zA-Z:]+)/g;
    let replacements;
    while (replacements = re.exec(str)) {
      if (elt.hasAttribute(replacements[2])) {
        if (replacements[1] && this.utilities[replacements[1]]) {
          result = result.replace(replacements[0], this.utilities[replacements[1]](elt.getAttribute(replacements[2])));
        } else {
          result = result.replace(replacements[0], elt.getAttribute(replacements[2]));
        }
      } else {
        result = result.replace(replacements[0], "");
      }
    }
  }
  return result;
}

// Define or apply behaviors for the document
applyBehaviors() {
  if (typeof window !== 'undefined' && window.customElements) {
    this.define.call(this, this.els);
  } else {
    this.fallback.call(this, this.els);
  }
}

/* 
  Registers the list of elements provided with the browser.
  Called by makeHTML5(), but can be called independently if, for example,
  you've created Custom Elements via an XSLT transformation instead.
*/
define(names) {
  for (let name of names) {
    const fn = this.getHandler(this.behaviors, name);
    utilities.defineCustomElement(name, fn, this.debug);
  }
}

/* 
  Provides fallback functionality for environments where Custom Elements
  are not supported.

  Like define(), this is called by makeHTML5(), but can be called
  independently.
*/
fallback(names) {
  for (let name of names) {
    let fn = this.getFallback(this.behaviors, name);
    if (fn) {
      for (let elt of Array.from((
          this.dom && !this.done 
          ? this.dom
          : this.document
        ).querySelectorAll(utilities.tagName(name)))) {
        if (!elt.hasAttribute("data-processed")) {
          this.append(fn, elt);
          elt.setAttribute("data-processed", "");
        }
      }
    }
  }
}

  /**********************
   * Utility functions  *
   **********************/

  
  static savePosition() {
    window.sessionStorage.setItem(window.location + "-scroll", window.scrollY);
  }
  
  static restorePosition() {
    if (!window.location.hash) {
      let scroll;
      if (scroll = window.sessionStorage.getItem(window.location + "-scroll")) {
        window.sessionStorage.removeItem(window.location + "-scroll");
        setTimeout(function() {
          window.scrollTo(0, scroll);
        }, 100);
      }
    } else {
      setTimeout(function() {
        let h = this.document.querySelector(window.decodeURI(window.location.hash));
        if (h) {
          h.scrollIntoView();
        }
      }, 100);
    }
  }

}

try {
  if (typeof window !== 'undefined') {
      window.CETEI = CETEI;
      window.addEventListener("beforeunload", CETEI.savePosition);
      var ceteiceanLoad = new Event("ceteiceanload");
      window.addEventListener("ceteiceanload", CETEI.restorePosition);
  }
} catch (e) {
  console.log(e);
}

export default CETEI;
