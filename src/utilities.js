/* 
  Performs a deep copy operation of the input node while stripping
  out child elements introduced by CETEIcean.
*/ 
export function copyAndReset(node) {
  let clone = (n) => {
    let result = n.nodeType === Node.ELEMENT_NODE?document.createElement(n.nodeName):n.cloneNode(true);
    if (n.attributes) {
      for (let att of Array.from(n.attributes)) {
        if (att.name !== "data-processed") {
          result.setAttribute(att.name,att.value);
        }
      }
    }
    for (let nd of Array.from(n.childNodes)){
      if (nd.nodeType == Node.ELEMENT_NODE) {
        if (!n.hasAttribute("data-empty")) {
          if (nd.hasAttribute("data-original")) {
            for (let childNode of Array.from(nd.childNodes)) {
              let child = result.appendChild(clone(childNode));
              if (child.nodeType === Node.ELEMENT_NODE && child.hasAttribute("data-origid")) {
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
  if (elt.childNodes.length > 0) {
    let hidden = document.createElement("span");
    elt.appendChild(hidden);
    hidden.setAttribute("hidden", "");
    hidden.setAttribute("data-original", "");
    for (let node of Array.from(elt.childNodes)) {
      if (node !== hidden) {
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
  Takes a relative URL and rewrites it based on the base URL of the
  HTML document
*/
export function rw(url) {
  if (!url.match(/^(?:http|mailto|file|\/|#).*$/)) {
    return this.base + url;
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
  if (!stripElt && el.nodeType == Node.ELEMENT_NODE) {
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
    switch (node.nodeType) {
      case Node.ELEMENT_NODE:
        if (typeof ws === "string") {
          str += this.serialize(node, false, ws + "  ");
        } else {
          str += this.serialize(node, false, ws);
        }
        break;
      case Node.PROCESSING_INSTRUCTION_NODE:
        str += "<?" + node.nodeValue + "?>";
        break;
      case Node.COMMENT_NODE:
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
