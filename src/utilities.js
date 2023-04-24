export function getOrdinality(elt, name) {
  let pos = 1;
  let e = elt;
  while (e && e.previousElementSibling !== null && (name?e.previousElementSibling.localName == name:true)) {
    pos++;
    e = e.previousElementSibling;
    if (!e.previousElementSibling) {
      break;
    }
  }
  return pos;
}

/* 
  Performs a deep copy operation of the input node while stripping
  out child elements introduced by CETEIcean.
*/ 
export function copyAndReset(node) {
  const doc = node.ownerDocument;
  let clone = (n) => {
    // nodeType 1 is Node.ELEMENT_NODE
    let result = n.nodeType === 1
      ? doc.createElement(n.nodeName)
      : n.cloneNode(true);
    if (n.attributes) {
      for (let att of Array.from(n.attributes)) {
        if (att.name !== "data-processed") {
          result.setAttribute(att.name,att.value);
        }
      }
    }
    for (let nd of Array.from(n.childNodes)){
      // nodeType 1 is Node.ELEMENT_NODE
      if (nd.nodeType == 1) {
        if (!n.hasAttribute("data-empty")) {
          if (nd.hasAttribute("data-original")) {
            for (let childNode of Array.from(nd.childNodes)) {
              let child = result.appendChild(clone(childNode));
              // nodeType 1 is Node.ELEMENT_NODE
              if (child.nodeType === 1 && child.hasAttribute("data-origid")) {
                child.setAttribute("id", child.getAttribute("data-origid"));
                child.removeAttribute("data-origid");
              }
            }
            return result;
          } else {
            result.appendChild(clone(nd));
          }
        }
      }
      else {
        result.appendChild(nd.cloneNode());
      }
    }
    return result;
  }
  return clone(node);
}

/* 
  Given a space-separated list of URLs (e.g. in a ref with multiple
  targets), returns just the first one.
*/
export function first(urls) {
  return urls.replace(/ .*$/, "");
}

/* 
  Wraps the content of the element parameter in a <span data-original>
  with display set to "none".
*/
export function hideContent(elt, rewriteIds = true) {
  const doc = elt.ownerDocument;
  if (elt.childNodes.length > 0) {
    let hidden = doc.createElement("span");
    elt.appendChild(hidden);
    hidden.setAttribute("hidden", "");
    hidden.setAttribute("data-original", "");
    for (let node of Array.from(elt.childNodes)) {
      if (node !== hidden) {
        // nodeType 1 is Node.ELEMENT_NODE
        if (node.nodeType === 1) {
          node.setAttribute("data-processed", "");
          for (let e of node.querySelectorAll("*")) {
            e.setAttribute("data-processed", "");
          }
        }
        hidden.appendChild(elt.removeChild(node));
      }
    }
    if (rewriteIds) {
      for (let e of Array.from(hidden.querySelectorAll("*"))) {
        if (e.hasAttribute("id")) {
          e.setAttribute("data-origid", e.getAttribute("id"));
          e.removeAttribute("id");
        }
      }
    }
  }
}

export function normalizeURI(urls) {
  return this.rw(this.first(urls))
}

/* 
  Takes a string and a number and returns the original string
  printed that number of times.
*/
export function repeat(str, times) {
  let result = "";
  for (let i = 0; i < times; i++) {
    result += str;
  }
  return result;
}

/* 
  Resolves URIs that use TEI prefixDefs into full URIs.
  See https://www.tei-c.org/release/doc/tei-p5-doc/en/html/ref-prefixDef.html
*/
export function resolveURI(uri) {
  let prefixdef = this.prefixDefs[uri.substring(0,uri.indexOf(":"))];
  return uri.replace(new RegExp(prefixdef["matchPattern"]), prefixdef["replacementPattern"]);
}

/*
  Convenience function for getting prefix definitions, Takes a prefix
  and returns an object with "matchPattern" and "replacementPattern"
  keys.
*/
export function getPrefixDef(prefix) {
  return this.prefixDefs[prefix];
}

/* 
  Takes a relative URL and rewrites it based on the base URL of the
  HTML document
*/
export function rw(url) {
  if (!url.match(/^(?:http|mailto|file|\/|#).*$/)) {
    return this.base + this.utilities.first(url);
  } else {
    return url;
  }
}

/* 
  Takes an element and serializes it to an XML string or, if the stripElt
  parameter is set, serializes the element's content. The ws parameter, if
  set, will switch on minimal "pretty-printing" and indenting of the serialized
  result.
*/
export function serialize(el, stripElt, ws) {
  let str = "";
  let ignorable = (txt) => {
    return !(/[^\t\n\r ]/.test(txt));
  }
  // nodeType 1 is Node.ELEMENT_NODE
  if (!stripElt && el.nodeType == 1) {
    if ((typeof ws === "string") && ws !== "") {
      str += "\n" + ws + "<";
    } else  {
      str += "<";
    }
    str += el.getAttribute("data-origname");
    // HTML5 lowercases all attribute names; @data-origatts contains the original names
    let attrNames = el.hasAttribute("data-origatts") ? el.getAttribute("data-origatts").split(" ") : [];
    for (let attr of Array.from(el.attributes)) {
      if (!attr.name.startsWith("data-") && !(["id", "lang", "class"].includes(attr.name))) {
        str += " " + attrNames.find(function(e) {return e.toLowerCase() == attr.name}) + "=\"" + attr.value + "\"";
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
  //TODO: Be smarter about skipping generated content with hidden original
  for (let node of Array.from(el.childNodes)) {
    // nodeType 1 is Node.ELEMENT_NODE
    // nodeType 7 is Node.PROCESSING_INSTRUCTION_NODE
    // nodeType 8 is Node.COMMENT_NODE
    switch (node.nodeType) {
      case 1:
        if (typeof ws === "string") {
          str += serialize(node, false, ws + "  ");
        } else {
          str += serialize(node, false, ws);
        }
        break;
      case 7:
        str += "<?" + node.nodeValue + "?>";
        break;
      case 8:
        str += "<!--" + node.nodeValue + "-->";
        break;
      default:
        if (stripElt && ignorable(node.nodeValue)) {
          str += node.nodeValue.replace(/^\s*\n/, "");
        }
        if ((typeof ws === "string") && ignorable(node.nodeValue)) {
          break;
        }
        str += node.nodeValue;
    }
  }
  if (!stripElt && el.childNodes.length > 0) {
    if (typeof ws === "string") {
      str += "\n" + ws + "</";
    } else  {
      str += "</";
    }
    str += el.getAttribute("data-origname") + ">";
  }
  return str;
}

export function unEscapeEntities(str) {
  return str.replace(/&gt;/, ">")
            .replace(/&quot;/, "\"")
            .replace(/&apos;/, "'")
            .replace(/&amp;/, "&");
}

// Given a qualified name (e.g. tei:text), return the element name
export function tagName(name) {
  if (name.includes(":"), 1) {
    return name.replace(/:/,"-").toLowerCase();
  } else {
    return "ceteicean-" + name.toLowerCase();
  }
}

export function defineCustomElement(name, behavior = null, debug = false) {
  /* 
  Registers the list of elements provided with the browser.
  Called by makeHTML5(), but can be called independently if, for example,
  you've created Custom Elements via an XSLT transformation instead.
  */
  try {
    window.customElements.define(tagName(name), class extends HTMLElement {
      constructor() {
        super(); 
        if (!this.matches(":defined")) { // "Upgraded" undefined elements can have attributes & children; new elements can't
          if (behavior) {
            behavior.call(this);
          }
          // We don't want to double-process elements, so add a flag
          this.setAttribute("data-processed", "");
        }
      }
      // Process new elements when they are connected to the browser DOM
      connectedCallback() {
        if (!this.hasAttribute("data-processed")) {
          if (behavior) {
            behavior.call(this);
          }
          this.setAttribute("data-processed", "");
        }
      };
    });
  } catch (error) {
    // When using the same CETEIcean instance for multiple TEI files, this error becomes very common. 
    // It's muted by default unless the debug option is set.
    if (debug) {
        console.log(tagName(name) + " couldn't be registered or is already registered.");
        console.log(error);
    }
  }
}
