export default {
  "namespaces": {
    "tei": "http://www.tei-c.org/ns/1.0",
    "teieg": "http://www.tei-c.org/ns/Examples",
    "rng": "http://relaxng.org/ns/structure/1.0"  
  },
  "tei": {
    "eg": ["<pre>","</pre>"],
    // inserts a link inside <ptr> using the @target; the link in the
    // @href is piped through the rw (rewrite) function before insertion
    "ptr": ["<a href=\"$rw@target\">$@target</a>"],
    // wraps the content of the <ref> in an HTML link
    "ref": [
      ["[target]", ["<a href=\"$rw@target\">","</a>"]]
    ],
    "graphic": function(elt) {
      let content = new Image();
      content.src = this.rw(elt.getAttribute("url"));
      if (elt.hasAttribute("width")) {
        content.setAttribute("width",elt.getAttribute("width"));
      }
      if (elt.hasAttribute("height")) {
        content.setAttribute("height",elt.getAttribute("height"));
      }
      return content;
    },
    "list": [
      // will only run on a list where @type="gloss"
      ["[type=gloss]", function(elt) {
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
        return dl;
      }
    ]],
    "note": [
      // Make endnotes
      ["[place=end]", function(elt){
        if (!this.noteIndex){
          this["noteIndex"] = 1;
        } else {
          this.noteIndex++;
        }
        let id = "_note_" + this.noteIndex;
        let link = document.createElement("a");
        link.setAttribute("id", "src" + id);
        link.setAttribute("href", "#" + id);
        link.innerHTML = this.noteIndex;
        let content = document.createElement("sup");
        content.appendChild(link);
        let notes = this.dom.querySelector("ol.notes");
        if (!notes) {
          notes = document.createElement("ol");
          notes.setAttribute("class", "notes");
          this.dom.appendChild(notes);
        }
        let note = document.createElement("li");
        note.id = id;
        note.innerHTML = elt.innerHTML
        notes.appendChild(note);
        return content;
      }],
      ["_", ["(",")"]]
    ],
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
      return table;
    },
    "teiHeader": function(e) {
      this.hideContent(e, false);
    },
    "title": [
      ["tei-titlestmt>tei-title", function(elt) {
        let title = document.createElement("title");
        title.innerHTML = elt.innerText;
        document.querySelector("head").appendChild(title);
      }]
    ]
  },
  "teieg": {
    "egXML": function(elt) {
      let pre = document.createElement("pre");
      pre.innerHTML = this.serialize(elt, true);
      return pre;
    }
  }
}
