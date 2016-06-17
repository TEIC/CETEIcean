export default {
  "handlers": {
    "ptr": function(proto) {
      let self = this;
      proto.createdCallback = function() {
        let shadow = this.createShadowRoot();
        let link = document.createElement("a");
        link.innerHTML = this.getAttribute("target");
        link.href = self.rewriteRelativeUrl(this.getAttribute("target"));
        shadow.appendChild(link);
      }
    },
    "ref": function(proto) {
      let self = this;
      proto.createdCallback = function() {
        let shadow = this.createShadowRoot();
        let link = document.createElement("a");
        link.innerHTML = this.innerHTML;
        link.href = self.rewriteRelativeUrl(this.getAttribute("target"));
        shadow.appendChild(link);
      }
    },
    "graphic": function(proto) {
      let self = this;
      proto.createdCallback = function() {
        let shadow = this.createShadowRoot();
        let img = new Image();
        img.src = self.rewriteRelativeUrl(this.getAttribute("url"));
        if (this.hasAttribute("width")) {
          img.width = this.getAttribute("width").replace(/[^.0-9]/g, "");
        }
        if (this.hasAttribute("height")) {
          img.height = this.getAttribute("height").replace(/[^.0-9]/g, "");
        }
        shadow.appendChild(img);
      }
    }
  },
  "fallbacks": {
    "ptr": function() {
      let self = this;
      let elts = this.dom.getElementsByTagName("tei-ptr");
      for (let i = 0; i < elts.length; i++) {
        let content = document.createElement("a");
        let elt = elts[i];
        content.setAttribute("href", elt.getAttribute("target"));
        content.innerHTML = elt.getAttribute("target");
        elt.appendChild(content);
        elt.addEventListener("click", function(event) {
          window.location = self.rewriteRelativeUrl(this.getAttribute("target"));
        });
      }
    },
    "ref": function() {
      let self = this;
      let elts = this.dom.getElementsByTagName("tei-ref");
      for (let i = 0; i < elts.length; i++) {
        elts[i].addEventListener("click", function(event) {
          window.location = self.rewriteRelativeUrl(this.getAttribute("target"));
        });
      }
    },
    "graphic": function() {
      let self = this;
      let elts = this.dom.getElementsByTagName("tei-graphic");
      for (let i = 0; i < elts.length; i++) {
        let content = new Image();
        let elt = elts[i];
        content.src = self.rewriteRelativeUrl(this.getAttribute("url"));
        if (elt.hasAttribute("width")) {
          content.width = elt.getAttribute("width").replace(/[^.0-9]/g, "");
        }
        if (elt.hasAttribute("height")) {
          content.height = elt.getAttribute("height").replace(/[^.0-9]/g, "");
        }
        elt.appendChild(content);
      }
    }
  }
}
