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
            if (document.registerElement) {
              this.registerAll(this.els);
            } // TODO: add fallback methods for terrible browsers

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

    registerAll(names) {
      for (let name of names) {
        let proto = Object.create(HTMLElement.prototype);
        if (this[name]) {
          this[name].call(this[name], proto);
        }
        document.registerElement("tei-" + name, {prototype: proto});
      }
    }

    ptr(proto) {
      proto.createdCallback = function() {
        var shadow = this.createShadowRoot();
        var link = document.createElement('a');
        link.innerHTML = this.getAttribute("target").replace(/https?:\/\/([^/]+)\/.*/, "$1");
        link.href = this.getAttribute("target");
        shadow.appendChild(link);
      }
    }

    ref(proto) {
      proto.createdCallback = function() {
        this.onclick = function(evt) {
          window.location = evt.target.getAttribute("target");
        }
      }
    }

    img(proto) {
      proto.createdCallback = function() {
        var shadow = this.createShadowRoot();
        var img = document.createElement('img');
        img.src = this.getAttribute("url");
        img.width = this.getAttribute("width");
        img.height = this.getAttribute("height");
        shadow.apprendChild(img);
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

    // public method
    addBehaviors(bhvs){
        for (let [el, bhv] of bhvs.entries()){
            if (["div", "span", "a"].indexOf(bhv)){
                this.behaviors[el] = bhv;
            }
        }
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
