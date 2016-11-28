export default {
  "handlers": {
    "eg": ["<pre>","</pre>"],
    // inserts a link inside <ptr> using the @target; the link in the
    // @href is piped through the rw (rewrite) function before insertion
    "ptr": ["<a href=\"$rw@target\">$@target</a>"],
    // wraps the content of the <ref> in an HTML link
    "ref": ["<a href=\"$rw@target\">","</a>"],
    "graphic": function() {
      let ceteicean = this;
      return function() {
        let shadow = this.createShadowRoot();
        ceteicean.addShadowStyle(shadow);
        let img = new Image();
        img.src = ceteicean.rw(this.getAttribute("url"));
        if (this.hasAttribute("width")) {
          img.width = this.getAttribute("width").replace(/[^.0-9]/g, "");
        }
        if (this.hasAttribute("height")) {
          img.height = this.getAttribute("height").replace(/[^.0-9]/g, "");
        }
        shadow.appendChild(img);
      }
    },
    "list": function() {
      let ceteicean = this;
      return function() {
        if (this.hasAttribute("type") && this.getAttribute("type") == "gloss") {
          let shadow = this.createShadowRoot();
          ceteicean.addShadowStyle(shadow);
          let dl = document.createElement("dl");
          for (let child of Array.from(this.children)) {
            if (child.nodeType == Node.ELEMENT_NODE) {
              if (child.localName == "tei-label") {
                let dt = document.createElement("dt");
                dt.innerHTML = child.innerHTML;
                dl.appendChild(dt);
              }
              if (child.localName == "tei-item") {
                let dd = document.createElement("dd");
                dd.innerHTML = child.innerHTML;
                dl.appendChild(dd);
              }
            }
          }
          shadow.appendChild(dl);
        }
      }
    },
    "table": function() {
      let ceteicean = this;
      return function() {
        let shadow = this.createShadowRoot();
        ceteicean.addShadowStyle(shadow);
        let shadowContent = document.createElement("table");
        shadowContent.innerHTML = this.innerHTML;
        if (shadowContent.firstElementChild.localName == "tei-head") {
          let head = shadowContent.firstElementChild;
          head.remove();
          let caption = document.createElement("caption");
          caption.innerHTML = head.innerHTML;
          shadowContent.appendChild(caption);
        }
        for (let row of Array.from(shadowContent.querySelectorAll("tei-row"))) {
          let tr = document.createElement("tr");
          tr.innerHTML = row.innerHTML;
          for (let attr of Array.from(row.attributes)) {
            tr.setAttribute(attr.name, attr.value);
          }
          row.parentElement.replaceChild(tr, row);
        }
        for (let cell of Array.from(shadowContent.querySelectorAll("tei-cell"))) {
          let td = document.createElement("td");
          if (cell.hasAttribute("cols")) {
            td.setAttribute("colspan", cell.getAttribute("cols"));
          }
          td.innerHTML = cell.innerHTML;
          for (let attr of Array.from(cell.attributes)) {
            td.setAttribute(attr.name, attr.value);
          }
          cell.parentElement.replaceChild(td, cell);
        }
        shadow.appendChild(shadowContent);
      }
    },
    "egXML": function() {
      let ceteicean = this;
      return function() {
        let shadow = this.createShadowRoot();
        ceteicean.addShadowStyle(shadow);
        shadow.innerHTML = "<pre>" + ceteicean.serialize(this, true) + "</pre>";
      }
    }
  },
  "fallbacks": {
    "ref": function(elt) {
      let ceteicean = this;
      elt.addEventListener("click", function(event) {
        window.location = ceteicean.rw(elt.getAttribute("target"));
      });
    },
    "graphic": function(elt) {
      let content = new Image();
      content.src = this.rw(elt.getAttribute("url"));
      if (elt.hasAttribute("width")) {
        content.width = elt.getAttribute("width").replace(/[^.0-9]/g, "");
      }
      if (elt.hasAttribute("height")) {
        content.height = elt.getAttribute("height").replace(/[^.0-9]/g, "");
      }
      elt.appendChild(content);
    },
    "list": function(elt) {
      if (elt.hasAttribute("type") && elt.getAttribute("type") == "gloss") {
        let dl = document.createElement("dl");
        for (let child of Array.from(elt.children)) {
          if (child.nodeType == Node.ELEMENT_NODE) {
            if (child.localName == "tei-label") {
              let dt = document.createElement("dt");
              dt.innerHTML = child.innerHTML;
              dl.appendChild(dt);
            }
            if (child.localName == "tei-item") {
              let dd = document.createElement("dd");
              dd.innerHTML = child.innerHTML;
              dl.appendChild(dd);
            }
          }
        }
        this.hideContent(elt);
        elt.appendChild(dl);
      }
    },
    "table": function(elt) {
      let table = document.createElement("table");
      table.innerHTML = elt.innerHTML;
      if (table.firstElementChild.localName == "tei-head") {
        let head = table.firstElementChild;
        head.remove();
        let caption = document.createElement("caption");
        caption.innerHTML = head.innerHTML;
        table.appendChild(caption);
      }
      for (let row of Array.from(table.querySelectorAll("tei-row"))) {
        let tr = document.createElement("tr");
        tr.innerHTML = row.innerHTML;
        for (let attr of Array.from(row.attributes)) {
          tr.setAttribute(attr.name, attr.value);
        }
        row.parentElement.replaceChild(tr, row);
      }
      for (let cell of Array.from(table.querySelectorAll("tei-cell"))) {
        let td = document.createElement("td");
        if (cell.hasAttribute("cols")) {
          td.setAttribute("colspan", cell.getAttribute("cols"));
        }
        td.innerHTML = cell.innerHTML;
        for (let attr of Array.from(cell.attributes)) {
          td.setAttribute(attr.name, attr.value);
        }
        cell.parentElement.replaceChild(td, cell);
      }
      this.hideContent(elt);
      elt.appendChild(table);
    },
    "egXML": function(elt) {
      let contents = this.serialize(elt, true);
      this.hideContent(elt);
      elt.innerHTML += "<pre>" + contents + "</pre>";
    }
  }
}
