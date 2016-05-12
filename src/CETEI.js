class CETEI {

    constructor(){
        this.els = [];
        this.behaviors = {};
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
                    newElement.setAttribute(att.name, att.value);
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
            } // TODO: add fallback methods for terrible browsers

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

    getBehavior(fn) {
      let result = this[fn];
      for (let b of this.behaviors.reverse()) {
        if (b[fn]) {
          return b[fn];
        }
      }
      return result;
    }

    registerAll(names) {
      for (let name of names) {
        if (document.registerElement) {
          let proto = Object.create(HTMLElement.prototype);
          let fn = this.getBehavior("_h_" + name);
          if (fn) {
            fn.call(fn, proto);
          }
          document.registerElement("tei-" + name, {prototype: proto});
        } else {
          let fn = this.getBehavior("_h_fb_" + name);
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
    _h_fb_ptr() {
      let elts = document.getElementsByTagName("ptr");
      elts.forEach(function (elt, i) {
        let content = document.createElement("span");
        content.innerHTML = elt.getAttribute("target");
        elt.appendChild(content);
        elt.addEventListener("click", function(event) {
          window.location = this.getAttribute("target");
        });
      })
    }

    _h_fb_ref() {
      let elts = document.getElementsByTagName("ptr");
      elts.forEach(function (elt, i) {
        elt.addEventListener("click", function(event) {
          window.location = this.getAttribute("target");
        });
      })
    }

    _h_fb_graphic() {
      let elts = document.getElementsByTagName("ptr");
      elts.forEach(function (elt, i) {
        let content = new Image();
        content.src = elt.getAttribute("url"));
        content.width = elt.getAttribute("width");
        elt.appendChild(content);
      })
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

    // public method
    addBehaviors(bhvs){
        this.behaviors.push(bhvs);
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
