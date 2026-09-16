import type { BehaviorsMap, UtilitiesAPI } from "./types.js";

const defaultBehaviors: BehaviorsMap = {
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
    // wraps the content of the <ref> in an HTML link with the @target in 
    // the @href. If there are multiple @targets, only the first is used.
    "ref": [
      ["[target]", ["<a href=\"$rw@target\">","</a>"]]
    ],
    // creates an img tag with the @url as the src attribute
    "graphic": function(this: UtilitiesAPI, elt: Element) {
      const doc = elt.ownerDocument;
      const content = doc.createElement("img");
      const url = elt.getAttribute("url");
      content.src = url ? this.rw(url) : "";
      if (elt.hasAttribute("width")) {
        const width = elt.getAttribute("width");
        if (width) {
          content.setAttribute("width", width);
        }
      }
      if (elt.hasAttribute("height")) {
        const height = elt.getAttribute("height");
        if (height) {
          content.setAttribute("height", height);
        }
      }
      return content;
    },
    "list": [
      // will only run on a list where @type="gloss"
      ["[type=gloss]", function(this: UtilitiesAPI, elt: Element) {
        const doc = elt.ownerDocument;
        const dl = doc.createElement("dl");
        for (const child of Array.from(elt.children)) {
          // nodeType 1 is Node.ELEMENT_NODE
          if (child.nodeType == 1) {
            if (child.localName == "tei-label") {
              const dt = doc.createElement("dt");
              dt.innerHTML = child.innerHTML;
              dl.appendChild(dt);
            }
            if (child.localName == "tei-item") {
              const dd = doc.createElement("dd");
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
      ["[place=end]", function(this: UtilitiesAPI, elt: Element){
        const doc = elt.ownerDocument;
        this.noteIndex = (this.noteIndex ?? 0) + 1;
        const currentIndex = this.noteIndex;
        const id = "_note_" + currentIndex;
        const link = doc.createElement("a");
        link.setAttribute("id", "src" + id);
        link.setAttribute("href", "#" + id);
        link.innerHTML = String(currentIndex);
        const content = doc.createElement("sup");
        content.appendChild(link);
        let notes = doc.querySelector("ol.notes");
        if (!notes) {
          notes = doc.createElement("ol");
          notes.setAttribute("class", "notes");
          const host = this.dom;
          if (!host) {
            throw new Error("CETEI utilities DOM root is unavailable.");
          }
          host.appendChild(notes);
        }
        const note = doc.createElement("li");
        note.id = id;
        note.innerHTML = elt.innerHTML;
        notes.appendChild(note);
        return content;
      }],
      ["_", ["(",")"]]
    ],
    // Hide the teiHeader by default
    "teiHeader": function(this: UtilitiesAPI, e: Element) {
      this.hideContent(e, false);
    },
    // Make the title element the HTML title
    "title": [
      ["tei-titlestmt>tei-title", function(this: UtilitiesAPI, elt: Element) {
        const doc = elt.ownerDocument;
        const title = doc.createElement("title");
        const textSource = (elt as HTMLElement).innerText ?? "";
        title.innerHTML = textSource;
        const head = doc.querySelector("head");
        if (head) {
          head.appendChild(title);
        }
      }]
    ],
  },
  "teieg": {
    "egXML": function(this: UtilitiesAPI, elt: Element) {
      const doc = elt.ownerDocument;
      const pre = doc.createElement("pre");
      const code = doc.createElement("code");
      pre.appendChild(code);
      let content = this.serialize(elt, true).replace(/</g, "&lt;");
      const ws = content.match(/^[\t ]+/);
      if (ws) {
        content = content.replace(new RegExp("^" + ws[0], "mg"), "");
      }
      code.innerHTML = content;
      return pre;
    }
  }
}

export default defaultBehaviors;
