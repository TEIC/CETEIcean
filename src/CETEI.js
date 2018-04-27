import behaviors from './behaviors'
class CETEI {

    constructor(base){
        this.els = [];
        this.behaviors = [];
        this.hasStyle = false;
        this.prefixes = [];
        if (base) {
          this.base = base;
        } else {
          try {
            if (window) {
              this.base = window.location.href.replace(/\/[^\/]*$/, "/");
            }
          } catch (e) {
            this.base = "";
          }
        }
        this.behaviors.push(behaviors);
        this.shadowCSS;
        this.supportsShadowDom = document.head.createShadowRoot || document.head.attachShadow;
    }

    // public method
    /* Returns a Promise that fetches a TEI source document from the URL
       provided in the first parameter and then calls the makeHTML5 method
       on the returned document.
     */
    getHTML5(TEI_url, callback, perElementFn){
        if (window.location.href.startsWith(this.base) && (TEI_url.indexOf("/") >= 0)) {
          this.base = TEI_url.replace(/\/[^\/]*$/, "/");
        }
        // Get TEI from TEI_url and create a promise
        let promise = new Promise( function (resolve, reject) {
            let client = new XMLHttpRequest();

            client.open('GET', TEI_url);
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
            // TODO: better error handling?
            console.log(reason);
        });

        return promise.then((TEI) => {
            return this.makeHTML5(TEI, callback, perElementFn);
        });

    }

    /* Converts the supplied TEI string into HTML5 Custom Elements. If a callback
       function is supplied, calls it on the result.
     */
    makeHTML5(TEI, callback, perElementFn){
      // TEI is assumed to be a string
      let TEI_dom = ( new DOMParser() ).parseFromString(TEI, "text/xml");
      return this.domToHTML5(TEI_dom, callback, perElementFn);
    }

    /* Converts the supplied TEI DOM into HTML5 Custom Elements. If a callback
       function is supplied, calls it on the result.
    */
    domToHTML5(TEI_dom, callback, perElementFn){

      this._fromTEI(TEI_dom);

      let convertEl = (el) => {
          // Create new element. TEI elements get prefixed with 'tei-',
          // TEI example elements with 'teieg-'. All others keep
          // their namespaces and are copied as-is.
          let newElement;
          let copy = false;
          switch (el.namespaceURI) {
            case "http://www.tei-c.org/ns/1.0":
              newElement = document.createElement("tei-" + el.tagName);
              break;
            case "http://www.tei-c.org/ns/Examples":
              newElement = document.createElement("teieg-" + el.tagName);
              break;
            case "http://relaxng.org/ns/structure/1.0":
              newElement = document.createElement("rng-" + el.tagName);
              break;
            default:
              newElement = document.importNode(el, false);
              copy = true;
          }
          // Copy attributes; @xmlns, @xml:id, @xml:lang, and
          // @rendition get special handling.
          for (let att of Array.from(el.attributes)) {
              if (!att.name.startsWith("xmlns") || copy) {
                newElement.setAttribute(att.name, att.value);
              } else {
                if (att.name == "xmlns")
                newElement.setAttribute("data-xmlns", att.value); //Strip default namespaces, but hang on to the values
              }
              if (att.name == "xml:id" && !copy) {
                newElement.setAttribute("id", att.value);
              }
              if (att.name == "xml:lang" && !copy) {
                newElement.setAttribute("lang", att.value);
              }
              if (att.name == "rendition") {
                newElement.setAttribute("class", att.value.replace(/#/g, ""));
              }
          }
          // Preserve element name so we can use it later
          newElement.setAttribute("data-teiname", el.localName);
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
            this.prefixes.push(el.getAttribute("ident"));
            this.prefixes[el.getAttribute("ident")] =
              {"matchPattern": el.getAttribute("matchPattern"),
              "replacementPattern": el.getAttribute("replacementPattern")};
          }
          for (let node of Array.from(el.childNodes)){
              if (node.nodeType == Node.ELEMENT_NODE) {
                  newElement.appendChild(  convertEl(node)  );
              }
              else {
                  newElement.appendChild(node.cloneNode());
              }
          }
          if (perElementFn) {
            perElementFn(newElement);
          }
          return newElement;
      }

      this.dom = convertEl(TEI_dom.documentElement);

      if (window.customElements) {
        this.registerAll(this.els);
      } else {
        this.fallback(this.els);
      }
      this.done = true;
      if (callback) {
          callback(this.dom, this);
      } else {
          return this.dom;
      }
    }

    /* If the TEI document defines CSS styles in its tagsDecl, this method
       copies them into the wrapper HTML document's head.
     */
    addStyle(doc, data) {
      if (this.hasStyle) {
        doc.getElementsByTagName("head").item(0).appendChild(data.getElementsByTagName("style").item(0).cloneNode(true));
      }
    }

    /* If a URL where CSS for styling Shadow DOM elements lives has been defined,
       insert it into the Shadow DOM.
     */
    addShadowStyle(shadow) {
      if (this.shadowCSS) {
        shadow.innerHTML = "<style>" + "@import url(\"" + this.shadowCSS + "\");</style>" + shadow.innerHTML;
      }
    }

    /* Add a user-defined set of behaviors to CETEIcean's processing
       workflow. Added behaviors will override predefined behaviors with the
       same name.
    */
    addBehaviors(bhvs){
      if (bhvs["handlers"] || bhvs ["fallbacks"]) {
        this.behaviors.push(bhvs);
      } else {
        console.log("No handlers or fallback methods found.");
      }
    }

    /* Sets the base URL for the document. Used to rewrite relative links in the
       XML source (which may be in a completely different location from the HTML
       wrapper).
     */
    setBaseUrl(base) {
      this.base = base;
    }

    // "private" method
    _fromTEI(TEI_dom) {
        let root_el = TEI_dom.documentElement;
        this.els = new Set( Array.from(root_el.getElementsByTagNameNS("http://www.tei-c.org/ns/1.0", "*"), x => x.tagName) );
        this.els.add("egXML"); // Special case—not in TEI namespace, but needs to be handled
        this.els.add(root_el.tagName); // Add the root element to the array
    }

    // private method
    _insert(elt, strings) {
      let span = document.createElement("span");
      if (strings.length > 1) {
        if (strings[0].includes("<") && strings[1].includes("</")) {
          span.innerHTML = strings[0] + elt.innerHTML + strings[1];
        } else {
          span.innerHTML = "<span>" + strings[0] + "</span>" + elt.innerHTML + "<span>" + strings[1] + "</span>";
        }
      } else {
        if (strings[0].includes("<")) {
          span.innerHTML = strings[0] + elt.innerHTML;
        } else {
          span.innerHTML = "<span>" + strings[0] + "</span>" + elt.innerHTML;
        }
      }
      if (span.children.length > 1) {
        return span;
      } else {
        return span.children[0];
      }
    }

    // private method
    _template(str, elt) {
      let result = str;
      if (str.search(/$(\w*)(@\w+)/)) {
        let re = /\$(\w*)@(\w+)/g;
        let replacements;
        while (replacements = re.exec(str)) {
          if (elt.hasAttribute(replacements[2])) {
            if (replacements[1] && this[replacements[1]]) {
              result = result.replace(replacements[0], this[replacements[1]].call(this, elt.getAttribute(replacements[2])));
            } else {
              result = result.replace(replacements[0], elt.getAttribute(replacements[2]));
            }
          }
        }
      }
      return result;
    }

    tagName(name) {
      if (name == "egXML") {
        return "teieg-" + name.toLowerCase();
      } else {
        return "tei-" + name.toLowerCase();
      }
    }

    /* Takes a template in the form of an array of 1 or 2 strings and
       returns a closure around a function that can be called as
       a createdCallback or applied to an individual element.

       Called by the getHandler() and getFallback() methods
    */
    decorator(strings) {
      let ceteicean = this;
      return function (elt) {
        let copy = [];
        for (let i = 0; i < strings.length; i++) {
          copy.push(ceteicean._template(strings[i], elt));
        }
        return ceteicean._insert(elt, copy);
      }
    }

    /* Returns the handler function for the given element name

       Called by registerAll().
     */
    getHandler(fn) {
      for (let i = this.behaviors.length - 1; i >= 0; i--) {
        if (this.behaviors[i]["handlers"][fn]) {
          if (Array.isArray(this.behaviors[i]["handlers"][fn])) {
            return this.append(this.decorator(this.behaviors[i]["handlers"][fn]));
          } else {
            return this.append(this.behaviors[i]["handlers"][fn]);
          }
        }
      }
    }

    /* Returns the fallback function for the given element name.

       Called by fallback().
     */
    getFallback(fn) {
      for (let i = this.behaviors.length - 1; i >= 0; i--) {
        if (this.behaviors[i]["handlers"][fn]) {
          if (Array.isArray(this.behaviors[i]["handlers"][fn])) {
            return this.decorator(this.behaviors[i]["handlers"][fn]);
          } else {
            return this.behaviors[i]["handlers"][fn];
          }
        }
      }
    }

    /* Appends any element returned by the function passed in the first
     * parameter to the element in the second parameter. If the function
     * returns nothing, this is a no-op aside from any side effects caused
     * by the provided function.

     * called by getHandler() and fallback()
     */
    append(fn, elt) {
      if (elt) {
        let content = fn.call(this, elt);
        if (content && !(elt.querySelector(":scope > " + content.nodeName))) {
          if (this.supportsShadowDom) {
            this._appendShadow(elt, content);
          } else {
            this._appendBasic(elt, content);
          }
        }
      } else {
        let self = this;
        if (this.supportsShadowDom) {
          return function() {
            let content = fn.call(self, this);
            if (content) {
              self._appendShadow(this, content);
            }
          }
        } else {
          return function() {
            let content = fn.call(self, this);
            if (content && !(this.querySelector(":scope > " + content.nodeName))) {
              self._appendBasic(this, content);
            }
          }
        }
      }
    }

    /* Private method called by append() if the browser supports Shadow DOM
     */
    _appendShadow(elt, content) {
      var shadow = elt.attachShadow({mode:'open'});
      this.addShadowStyle(shadow);
      shadow.appendChild(content);
    }

    /* Private method called by append() if the browser does not support
     * Shadow DOM
     */
    _appendBasic(elt, content) {
      this.hideContent(elt);
      elt.appendChild(content);
    }

    /* Registers the list of elements provided with the browser.

       Called by makeHTML5(), but can be called independently if, for example,
       you've created Custom Elements via an XSLT transformation instead.
     */
    registerAll(names) {
      for (let name of names) {
        let fn = this.getHandler(name);
        let cName = name + "Elt";
        window[cName] = class extends HTMLElement {
          constructor() {
            super();
            if (fn) {
              fn.call(this);
            }
          }
        }
        //Object.setPrototypeOf(newClass, HTMLElement.prototype);

        let prefixedName = this.tagName(name);
        try {
          window.customElements.define(prefixedName, window[cName]);
        } catch (error) {
          console.log(prefixedName + " couldn't be registered or is already registered.");
          console.log(error);
        }

      }
    }

    /* Provides fallback functionality for browsers where Custom Elements
       are not supported.

       Like registerAll(), this is called by makeHTML5(), but can be called
       independently.
    */
    fallback(names) {
      for (let name of names) {
        let fn = this.getFallback(name);
        if (fn) {
          for (let elt of Array.from((this.dom?this.dom:document).getElementsByTagName(this.tagName(name)))) {
            this.append(fn, elt);
          }
        }
      }
    }

    /**********************
     * Utility functions  *
     **********************/

    /* Takes a relative URL and rewrites it based on the base URL of the
       HTML document */
    rw(url) {
      if (!url.match(/^(?:http|mailto|file|\/|#).*$/)) {
        return this.base + url;
      } else {
        return url;
      }
    }

    /* Given a space-separated list of URLs (e.g. in a ref with multiple
       targets), returns just the first one.
     */
    first(urls) {
      return urls.replace(/ .*$/, "");
    }

    /* Takes a string and a number and returns the original string
       printed that number of times.
    */
    repeat(str, times) {
      let result = "";
      for (let i = 0; i < times; i++) {
        result += str;
      }
      return result;
    }

    /* Takes an element and serializes it to a TEI string or, if the stripElt
       parameter is set, serializes the element's content.
     */
    serialize(el, stripElt) {
      let str = "";
      if (!stripElt) {
        str += "&lt;" + el.getAttribute("data-teiname");
        for (let attr of Array.from(el.attributes)) {
          if (!attr.name.startsWith("data-") && !(["id", "lang", "class"].includes(attr.name))) {
            str += " " + attr.name + "=\"" + attr.value + "\"";
          }
          if (attr.name == "data-xmlns") {
            str += " xmlns=\"" + attr.value +"\"";
          }
        }
        if (el.childNodes.length > 0) {
          str += ">";
        } else {
          str += "/>";
        }
      }
      for (let node of Array.from(el.childNodes)) {
        switch (node.nodeType) {
          case Node.ELEMENT_NODE:
            str += this.serialize(node);
            break;
          case Node.PROCESSING_INSTRUCTION_NODE:
            str += "&lt;?" + node.nodeValue + "?>";
            break;
          case Node.COMMENT_NODE:
            str += "&lt;!--" + node.nodeValue + "-->";
            break;
          default:
            str += node.nodeValue.replace(/</g, "&lt;");
        }
      }
      if (!stripElt && el.childNodes.length > 0) {
        str += "&lt;/" + el.getAttribute("data-teiname") + ">";
      }
      return str;
    }

    /* Wraps the content of the element parameter in a <span class="hide">
     * with display set to "none".
     */
    hideContent(elt) {
      if (elt.childNodes.length > 0) {
        let content = elt.innerHTML;
        elt.innerHTML = "";
        let hidden = document.createElement("span");
        hidden.setAttribute("style", "display:none;");
        hidden.setAttribute("class", "hide");
        hidden.innerHTML = content;
        elt.appendChild(hidden);
      }
    }

    unEscapeEntities(str) {
      return str.replace(/&gt;/, ">")
                .replace(/&quot;/, "\"")
                .replace(/&apos;/, "'")
                .replace(/&amp;/, "&");
    }

    static savePosition() {
      window.localStorage.setItem("scroll",window.scrollY);
    }

    static restorePosition() {
      if (!window.location.hash) {
        if (window.localStorage.getItem("scroll")) {
          setTimeout(function() {
            window.scrollTo(0, localStorage.getItem("scroll"))
          }, 100);
        }
      }
    }

    // public method
    fromODD(){
        // Place holder for ODD-driven setup.
        // For example:
        // Create table of elements from ODD
        //    * default HTML behaviour mapping on/off (eg tei:div to html:div)
        //    ** phrase level elements behave like span (can I tell this from ODD classes?)
        //    * optional custom behaviour mapping
    }



}

// Make main class available to pre-ES6 browser environments
try {
  if (window) {
      window.CETEI = CETEI;
      window.addEventListener("beforeunload", CETEI.savePosition);
      window.addEventListener("load", CETEI.restorePosition);
  }
} catch (e) {
  // window not defined;
}

export default CETEI;
