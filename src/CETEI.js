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
          this.base = window.location.href.replace(/\/[^\/]*$/, "/");
        }
        this.behaviors.push(behaviors);
    }

    // public method
    getHTML5(TEI_url, callback){
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
        .then((TEI) => {
            this.makeHTML5(TEI, callback);
        })
        .catch( function(reason) {
            // TODO: better error handling?
            console.log(reason);
        });

        return promise;

    }

    makeHTML5(TEI, callback){
      // TEI is assumed to be a string
      let TEI_dom = ( new window.DOMParser() ).parseFromString(TEI, "text/xml");

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
            default:
              newElement = document.importNode(el, false);
              copy = true;
          }
          // Copy attributes; @xmlns, @xml:id, @xml:lang, and
          // @rendition get special handling.
          for (let att of Array.from(el.attributes)) {
              if (att.name != "xmlns" || copy) {
                newElement.setAttribute(att.name, att.value);
              } else {
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
          for (let node of Array.from(el.childNodes)){
              if (node.nodeType == Node.ELEMENT_NODE) {
                  newElement.appendChild(  convertEl(node)  );
              }
              else {
                  newElement.appendChild(node.cloneNode());
              }
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
          return newElement;
      }

      this.dom = convertEl(TEI_dom.documentElement);

      if (document.registerElement) {
        this.registerAll(this.els);
      } else {
        this.fallback(this.els);
      }

      if (callback) {
          callback(this.dom, this);
      }
      else {
          return this.dom;
      }
    }

    addStyle(doc, data) {
      if (this.hasStyle) {
        doc.getElementsByTagName("head").item(0).appendChild(data.getElementsByTagName("style").item(0).cloneNode(true));
      }
    }

    // public method
    addBehaviors(bhvs){
      if (bhvs["handlers"] || bhvs ["fallbacks"]) {
        this.behaviors.push(bhvs);
      } else {
        console.log("No handlers or fallback methods found.");
      }
    }

    _insert(elt, strings) {
      if (elt.createShadowRoot) {
        let shadow = elt.createShadowRoot();
        shadow.innerHTML = strings[0] + shadow.innerHTML + strings[1]?strings[1]:"";
      } else {
        let span;
        if (strings.length > 1) {
          if (strings[0].includes("<") && strings[1].includes("</")) {
            elt.innerHTML = strings[0] + elt.innerHTML + strings[1];
          } else {
            elt.innerHTML = "<span>" + strings[0] + "</span>" + elt.innerHTML + "<span>" + strings[1] + "</span>";
          }
        } else {
          if (strings[0].includes("<")) {
            elt.innerHTML = strings[0] + elt.innerHTML;
          } else {
            elt.innerHTML = "<span>" + strings[0] + "</span>" + elt.innerHTML;
          }
        }
      }
    }

    _template(str, elt) {
      let result = str;
      if (str.search(/$(\w*)@(\w+)/)) {
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

    /* Takes a template in the form of an array of 1 or 2 strings and
       returns a closure around a function that can be called as
       a createdCallback or applied to an individual element.
    */
    decorator(strings) {
      return function() {
        let ceteicean = this;
        return function (elt) {
          if (this != ceteicean) {
            elt = this;
          }
          for (let i = 0; i < strings.length; i++) {
            strings[i] = ceteicean._template(strings[i], elt);
          }
          ceteicean._insert(elt, strings);
        }
      }
    }

    getHandler(fn) {
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

    getFallback(fn) {
      for (let i = this.behaviors.length - 1; i >= 0; i--) {
        if (this.behaviors[i]["fallbacks"][fn]) {
          if (Array.isArray(this.behaviors[i]["fallbacks"][fn])) {
            return this.decorator(this.behaviors[i]["fallbacks"][fn]);
          } else {
            return this.behaviors[i]["fallbacks"][fn];
          }
        } else if (this.behaviors[i]["handlers"][fn] && Array.isArray(this.behaviors[i]["handlers"][fn])) {
          // if there's a handler template, we can construct a fallback function
          return this.decorator(this.behaviors[i]["handlers"][fn]);
        }
      }
    }

    registerAll(names) {
      for (let name of names) {
        let proto = Object.create(HTMLElement.prototype);
        let fn = this.getHandler(name);
        if (fn) {
          proto.createdCallback = fn.call(this);
        }
        let prefixedName = "tei-" + name;
        try {
          document.registerElement(prefixedName, {prototype: proto});
        } catch (error) {
          console.log(prefixedName + " already registered.");
          console.log(error);
        }

      }
    }

    fallback(names) {
      for (let name of names) {
        let fn = this.getFallback(name);
        if (fn) {
          for (let elt of Array.from(this.dom.getElementsByTagName("tei-" + name))) {
            fn.call(this, elt);
          }
        }
      }
    }

    setBaseUrl(base) {
      this.base = base;
    }

    /* Takes a relative URL and rewrites it based on the base URL of the
       HTML document */
    rw(url) {
      if (!url.match(/^(?:http|mailto|file|\/).*$/)) {
        return this.base + url;
      } else {
        return url;
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

    // "private" method
    _fromTEI(TEI_dom) {
        let root_el = TEI_dom.documentElement;
        this.els = new Set( Array.from(root_el.getElementsByTagName("*"), x => x.tagName) );
        this.els.add(root_el.tagName); // Add the root element to the array
    }

}

// Make main class available to pre-ES6 browser environments
if (window) {
    window.CETEI = CETEI;
}
export default CETEI;
