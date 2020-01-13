import * as utilities from './utilities';
import defaultBehaviors from './defaultBehaviors';
import {addBehaviors, addBehavior, applyBehaviors} from './behaviors';
import {learnElementNames} from './dom';

class CETEI {
  constructor(options){
    this.options = options ? options : {}

    // Bind methods
    this.addBehaviors = addBehaviors.bind(this);
    this.addBehavior = addBehavior.bind(this);
    this.applyBehaviors = applyBehaviors.bind(this);

    // Bind selected utilities
    this.utilities = {}
    for (const u of Object.keys(utilities)) {
      if (u == "rw") {
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
  }

  /* 
    Returns a Promise that fetches an XML source document from the URL
    provided in the first parameter and then calls the makeHTML5 method
    on the returned document.
  */
  getHTML5(XML_url, callback, perElementFn){
    if (window.location.href.startsWith(this.base) && (XML_url.indexOf("/") >= 0)) {
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
    let XML_dom = ( new DOMParser() ).parseFromString(XML, "text/xml");
    return this.domToHTML5(XML_dom, callback, perElementFn);
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

    this.applyBehaviors();
    this.done = true;
    if (callback) {
      callback(this.dom, this);
      window.dispatchEvent(ceteiceanLoad);
    } else {
      window.dispatchEvent(ceteiceanLoad);
      return this.dom;
    }
  }

  /* 
    If the TEI document defines CSS styles in its tagsDecl, this method
    copies them into the wrapper HTML document's head.
  */
  addStyle(doc, data) {
    if (this.hasStyle) {
      doc.getElementsByTagName("head").item(0).appendChild(data.getElementsByTagName("style").item(0).cloneNode(true));
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
        let h = document.querySelector(window.location.hash);
        if (h) {
          h.scrollIntoView();
        }
      }, 100);
    }
  }

}

// Make main class available to pre-ES6 browser environments
try {
  if (window) {
      window.CETEI = CETEI;
      window.addEventListener("beforeunload", CETEI.savePosition);
      var ceteiceanLoad = new Event("ceteiceanload");
      window.addEventListener("ceteiceanload", CETEI.restorePosition);
  }
} catch (e) {
  // window not defined
  console.log(e);
}

export default CETEI;
