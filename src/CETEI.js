import defaultBehaviors from './defaultBehaviors';
import * as utilities from './utilities';
import {addBehaviors, addBehavior, removeBehavior} from './behaviors';
import {learnElementNames, learnCustomElementNames} from './dom';

class CETEI {
  constructor(options){
    this.options = options ? options : {}

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
  getHTML5(XML_url, callback, perElementFn){
    if (window && window.location.href.startsWith(this.base) && (XML_url.indexOf("/") >= 0)) {
      this.base = XML_url.replace(/\/[^\/]*$/, "/");
    }
    // Get XML from XML_url and create a promise
    let promise = new Promise( function (resolve, reject) {
      let client = new XMLHttpRequest();
      client.open('GET', XML_url);
      client.send();
      client.onload = function () {
        if (this.status >= 200 && this.status < 300) {
          resolve(this.response);
        } else {
          reject(this.statusText);
        }
      };
      client.onerror = function () {
        reject(this.statusText);
      };
    })
    .catch( function(reason) {
      console.log("Could not get XML file.");
      if (this.debug) {
          console.log(reason);
      }
    });

    return promise.then((XML) => {
        return this.makeHTML5(XML, callback, perElementFn);
    });
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

  /* 
    Converts the supplied XML DOM into HTML5 Custom Elements. If a callback
    function is supplied, calls it on the result.
  */
  domToHTML5(XML_dom, callback, perElementFn){

    this.els = learnElementNames(XML_dom, this.namespaces);

    let convertEl = (el) => {
      // Elements with defined namespaces get the prefix mapped to that element. All others keep
      // their namespaces and are copied as-is.
      let newElement;
      if (this.namespaces.has(el.namespaceURI ? el.namespaceURI : "")) {
        let prefix = this.namespaces.get(el.namespaceURI ? el.namespaceURI : "");
        newElement = document.createElement(`${prefix}-${el.localName}`);
      } else {
        newElement = document.importNode(el, false);
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
        let level = XML_dom.evaluate("count(ancestor::*[tei:head])", el, function(ns) {
          if (ns == "tei") return "http://www.tei-c.org/ns/1.0";
        }, XPathResult.NUMBER_TYPE, null);
        newElement.setAttribute("data-level", level.numberValue);
      }
      // Turn <rendition scheme="css"> elements into HTML styles
      if (el.localName == "tagsDecl") {
        let style = document.createElement("style");
        for (let node of Array.from(el.childNodes)){
          if (node.nodeType == Node.ELEMENT_NODE && node.localName == "rendition" && node.getAttribute("scheme") == "css") {
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
            style.appendChild(document.createTextNode(rule));
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
          if (node.nodeType == Node.ELEMENT_NODE) {
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

    this.dom = convertEl(XML_dom.documentElement);
    this.utilities.dom = this.dom;

    this.applyBehaviors();
    this.done = true;
    if (callback) {
      callback(this.dom, this);
      if (window) {
        window.dispatchEvent(ceteiceanLoad);
      }
    } else {
      if (window) {
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
    this.els = learnCustomElementNames(document);
    this.applyBehaviors();
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
  if (elt) {
    let content = fn.call(self.utilities, elt);
    if (content && !self.childExists(elt.firstElementChild, content.nodeName)) {
      self.appendBasic(elt, content);
    }
  } else {
    return function() {
      if (!this.hasAttribute("data-processed")) {
        let content = fn.call(self.utilities, this);
        if (content && !self.childExists(this.firstElementChild, content.nodeName)) {
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
      return decorator(behaviors[fn]);
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
  let span = document.createElement("span");
  for (let node of Array.from(elt.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE && !node.hasAttribute("data-processed")) {
      this.processElement(node);
    }
  } 
  // If we have before and after tags have them parsed by
  // .innerHTML and then add the content to the resulting child
  if (strings[0].match("<[^>]+>") && strings[1] && strings[1].match("<[^>]+>")) { 
    span.innerHTML = strings[0] + elt.innerHTML + (strings[1]?strings[1]:"");
  } else {
    span.innerHTML = strings[0];
    span.setAttribute("data-before", strings[0].replace(/<[^>]+>/g,"").length);
    for (let node of Array.from(elt.childNodes)) {
      span.appendChild(node.cloneNode(true));
    }
    if (strings.length > 1) {
      span.innerHTML += strings[1];
      span.setAttribute("data-after", strings[1].replace(/<[^>]+>/g,"").length);
    } 
  }
  return span;
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
    if (node.nodeType === Node.ELEMENT_NODE) {
      this.processElement(node);
    }
  }
}

// Given a qualified name (e.g. tei:text), return the element name
tagName(name) {
  if (name.includes(":"), 1) {
    return name.replace(/:/,"-").toLowerCase();;
  } else {
    return "ceteicean-" + name.toLowerCase();
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
  if (window.customElements) {
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
    try {
      const fn = this.getHandler(this.behaviors, name);
      window.customElements.define(this.tagName(name), class extends HTMLElement {
        constructor() {
          super(); 
          if (!this.matches(":defined")) { // "Upgraded" undefined elements can have attributes & children; new elements can't
            if (fn) {
              fn.call(this);
            }
            // We don't want to double-process elements, so add a flag
            this.setAttribute("data-processed", "");
          }
        }
        // Process new elements when they are connected to the browser DOM
        connectedCallback() {
          if (!this.hasAttribute("data-processed")) {
            if (fn) {
              fn.call(this);
            }
            this.setAttribute("data-processed", "");
          }
        };
      });
    } catch (error) {
      // When using the same CETEIcean instance for multiple TEI files, this error becomes very common. 
      // It's muted by default unless the debug option is set.
      if (this.debug) {
          console.log(this.tagName(name) + " couldn't be registered or is already registered.");
          console.log(error);
      }
    }
  }
}

/* 
  Provides fallback functionality for browsers where Custom Elements
  are not supported.

  Like define(), this is called by makeHTML5(), but can be called
  independently.
*/
fallback(names) {
  for (let name of names) {
    let fn = getFallback(this.behaviors, name);
    if (fn) {
      for (let elt of Array.from((
          this.dom && !this.done 
          ? this.dom
          : document
        ).getElementsByTagName(tagName(name)))) {
        if (!elt.hasAttribute("data-processed")) {
          append(fn, elt);
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
        setTimeout(function() {
          window.scrollTo(0, scroll);
        }, 100);
      }
    } else {
      setTimeout(function() {
        let h = document.querySelector(window.decodeURI(window.location.hash));
        if (h) {
          h.scrollIntoView();
        }
      }, 100);
    }
  }

}

try {
  if (window) {
      window.CETEI = CETEI;
      window.addEventListener("beforeunload", CETEI.savePosition);
      var ceteiceanLoad = new Event("ceteiceanload");
      window.addEventListener("ceteiceanload", CETEI.restorePosition);
  }
} catch (e) {
  console.log(e);
}

export default CETEI
