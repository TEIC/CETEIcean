class CETEI {

    constructor(){
        this.els = [];
        this.behaviors = [{"handlers":{}, "fallbacks":{}}];
        let methods = Object.getOwnPropertyNames(CETEI.prototype);
        for (let i = 0; i < methods.length; i++) {
          if (methods[i].startsWith("_h_")) {
            this.behaviors[0]["handlers"][methods[i].replace("_h_", "")] = this[methods[i]];
          }
          if (methods[i].startsWith("_fb_")) {
            this.behaviors[0]["fallbacks"][methods[i].replace("_fb_", "")] = this[methods[i]];
          }
        }
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
            let TEI_dom = ( new window.DOMParser() ).parseFromString(TEI, "text/xml");
            this._fromTEI(TEI_dom);

            let newTree;
            let convertEl = (el) => {
                // Create new element
                let newElement = document.createElement('tei-' + el.tagName);
                // Copy attributes
                for (let att of Array.from(el.attributes)) {
                    if (att.name != "xmlns") {
                      newElement.setAttribute(att.name, att.value);
                    }
                    if (att.name == "xml:id") {
                      newElement.setAttribute("id", att.value);
                    }
                    if (att.name == "xml:lang") {
                      newElement.setAttribute("lang", att.value);
                    }
                }
                for (let node of Array.from(el.childNodes)){
                    if (node.nodeType == 1) {
                        newElement.appendChild(  convertEl(node)  );
                    }
                    else {
                        newElement.appendChild(node.cloneNode());
                    }
                }
                return newElement;
            }

            newTree = convertEl(TEI_dom.documentElement);

            if (document.registerElement) {
              this.registerAll(this.els);
            } else {
              this.fallback(newTree, this.els);
            }

            if (callback) {
                callback(newTree);
            }
            else {
                return newTree;
            }

        })
        .catch( function(reason) {
            // TODO: better error handling?
            console.log(reason);
        });

        return promise;

    }

    // public method
    addBehaviors(bhvs){
      if (bhvs["handlers"] || bhvs ["fallbacks"]) {
        this.behaviors.push(bhvs);
      } else {
        console.log("No handlers or fallback methods found.");
      }
    }

    getHandler(fn) {
      for (let b of this.behaviors.reverse()) {
        if (b["handlers"][fn]) {
          return b["handlers"][fn];
        }
      }
    }

    getFallback(fn) {
      for (let b of this.behaviors.reverse()) {
        if (b["fallbacks"][fn]) {
          return b["fallbacks"][fn];
        }
      }
    }

    registerAll(names) {
      for (let name of names) {
        let proto = Object.create(HTMLElement.prototype);
        let fn = this.getHandler(name);
        if (fn) {
          fn.call(fn, proto);
        }
        document.registerElement("tei-" + name, {prototype: proto});
      }
    }

    fallback(dom, names) {
      for (let name of names) {
        let fn = this.getFallback(name);
        if (fn) {
          fn.call(fn, dom);
        }
      }
    }

    // Handler methods
    _h_ptr(proto) {
      proto.createdCallback = function() {
        let shadow = this.createShadowRoot();
        let link = document.createElement("a");
        link.innerHTML = this.getAttribute("target");
        link.href = this.getAttribute("target");
        shadow.appendChild(link);
      }
    }

    _h_ref(proto) {
      proto.createdCallback = function() {
        let shadow = this.createShadowRoot();
        let link = document.createElement("a");
        link.innerHTML = this.innerHTML;
        link.href = this.getAttribute("target");
        shadow.appendChild(link);
      }
    }

    _h_graphic(proto) {
      proto.createdCallback = function() {
        let shadow = this.createShadowRoot();
        let img = new Image();
        img.src = this.getAttribute("url");
        img.width = this.getAttribute("width");
        img.height = this.getAttribute("height");
        shadow.apprendChild(img);
      }
    }

    // Fallback handler methods
    _fb_ptr(dom) {
      let elts = dom.getElementsByTagName("tei-ptr");
      for (let i = 0; i < elts.length; i++) {
        let content = document.createElement("a");
        let elt = elts[i];
        content.setAttribute("href", elt.getAttribute("target"));
        content.innerHTML = elt.getAttribute("target");
        elt.appendChild(content);
        elt.addEventListener("click", function(event) {
          window.location = this.getAttribute("target");
        });
      }
    }

    _fb_ref(dom) {
      let elts = dom.getElementsByTagName("tei-ref");
      for (let i = 0; i < elts.length; i++) {
        elts[i].addEventListener("click", function(event) {
          window.location = this.getAttribute("target");
        });
      }
    }

    _fb_graphic(dom) {
      let elts = dom.getElementsByTagName("tei-graphic");
      for (let i = 0; i < elts.length; i++) {
        let content = new Image();
        let elt = elts[i];
        content.src = elt.getAttribute("url");
        content.width = elt.getAttribute("width");
        content.height = elt.getAttribute("height");
        elt.appendChild(content);
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
