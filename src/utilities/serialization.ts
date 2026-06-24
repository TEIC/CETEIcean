import type { CETEINode } from "../types.js";
import {
  ELEMENT_NODE,
  PROCESSING_INSTRUCTION_NODE,
  COMMENT_NODE,
  isElement,
  isDocument,
  isDocumentFragment,
  copyAndReset,
} from "./dom.js";

/*
  Combines the functionality of copyAndReset() and serialize() to return
  a "clean" version of the XML markup.
 */
export function resetAndSerialize(el: Element, stripElt?: boolean, ws?: string | boolean): string {
  return serialize(copyAndReset(el), stripElt, ws);
}

/*
  Takes an element and serializes it to an XML string or, if the stripElt
  parameter is set, serializes the element's content. The ws parameter, if
  set, will switch on minimal "pretty-printing" and indenting of the serialized
  result.
*/
export function serialize(el: CETEINode, stripElt?: boolean, ws?: string | boolean): string {
  let str = "";
  const ignorable = (txt: string | null | undefined): boolean => {
    return !txt ? true : !(/[^	\n\r ]/.test(txt));
  };
  const isRootLike = isDocument(el) || isDocumentFragment(el);
  if (isRootLike) {
    str += "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
  }
  if (!stripElt && isElement(el)) {
    if ((typeof ws === "string") && ws !== "") {
      str += "\n" + ws + "<";
    } else {
      str += "<";
    }
    str += el.getAttribute("data-origname");
    const attrNames = el.hasAttribute("data-origatts") ? (el.getAttribute("data-origatts") || "").split(" ") : [];
    for (const attr of Array.from(el.attributes)) {
      if (!attr.name.startsWith("data-")
        && !attr.name.startsWith("tei-")
        && !attr.name.startsWith("aria-")
        && !( ["id", "lang", "class"].includes(attr.name))) {
        const originalName = attrNames.find((e) => e.toLowerCase() == attr.name) || attr.name;
        str += ` ${originalName}="${attr.value}"`;
      }
      if (attr.name == "data-xmlns") {
        str += ` xmlns="${attr.value}"`;
      }
      if (attr.name.startsWith("tei-")) {
        const originalName = attrNames.find((e) => e.toLowerCase() == attr.name.replace("tei-", "")) || attr.name.replace("tei-", "");
        str += ` ${originalName}="${attr.value}"`;
      }
    }
    if (el.childNodes.length > 0) {
      str += ">";
    } else {
      str += "/>";
    }
  }
  for (const node of Array.from(el.childNodes)) {
    switch (node.nodeType) {
      case ELEMENT_NODE:
        if (typeof ws === "string") {
          str += serialize(node as Element, false, ws + "  ");
        } else {
          str += serialize(node as Element, false, ws);
        }
        break;
      case PROCESSING_INSTRUCTION_NODE:
        str += `<?${node.nodeName} ${node.nodeValue ?? ""}?>`;
        if (isRootLike) {
          str += "\n";
        }
        break;
      case COMMENT_NODE:
        str += `<!--${node.nodeValue ?? ""}-->`;
        if (isRootLike) {
          str += "\n";
        }
        break;
      default:
        const value = node.nodeValue ?? "";
        if (stripElt && ignorable(value)) {
          str += value.replace(/^\s*\n/, "");
        }
        if ((typeof ws === "string") && ignorable(value)) {
          break;
        }
        str += value;
    }
  }
  if (!stripElt && isElement(el) && el.childNodes.length > 0) {
    if (typeof ws === "string") {
      str += "\n" + ws + "</";
    } else {
      str += "</";
    }
    str += `${el.getAttribute("data-origname")}>`;
  }
  if (isRootLike) {
    str += "\n";
  }
  return str;
}

/*
  Write out the HTML markup to a string, using HTML conventions.
 */
export function serializeHTML(el: CETEINode, stripElt?: boolean, ws?: string | boolean): string {
  const EMPTY_ELEMENTS = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
  let str = "";
  const ignorable = (txt: string | null | undefined) => {
    return !txt ? true : !(/[^\t\n\r ]/.test(txt));
  };
  const isRootLike = isDocument(el) || isDocumentFragment(el);
  if (!stripElt && isElement(el)) {
    if ((typeof ws === "string") && ws !== "") {
      str += "\n" + ws + "<";
    } else {
      str += "<";
    }
    str += el.nodeName;
    for (const attr of Array.from(el.attributes)) {
      str += ` ${attr.name}="${attr.value}"`;
    }
    str += ">";
  }
  for (const node of Array.from(el.childNodes)) {
    switch (node.nodeType) {
      case ELEMENT_NODE:
        if (typeof ws === "string") {
          str += serializeHTML(node as Element, false, ws + "  ");
        } else {
          str += serializeHTML(node as Element, false, ws);
        }
        break;
      case PROCESSING_INSTRUCTION_NODE:
        str += `<?${node.nodeName} ${node.nodeValue ?? ""}?>`;
        if (isRootLike) {
          str += "\n";
        }
        break;
      case COMMENT_NODE:
        str += `<!--${node.nodeValue ?? ""}-->`;
        if (isRootLike) {
          str += "\n";
        }
        break;
      default:
        const value = node.nodeValue ?? "";
        if (stripElt && ignorable(value)) {
          str += value.replace(/^\s*\n/, "");
        }
        if ((typeof ws === "string") && ignorable(value)) {
          break;
        }
        str += value.replace(/</g, "&lt;");
    }
  }
  if (isElement(el)) {
    const nodeName = el.nodeName.toLowerCase();
    if (!EMPTY_ELEMENTS.includes(nodeName)) {
      if (!stripElt) {
        if (typeof ws === "string") {
          str += `\n${ws}</`;
        } else {
          str += "</";
        }
        str += `${el.nodeName}>`;
      }
    }
  }
  if (isRootLike) {
    str += "\n";
  }
  return str;
}

export function unEscapeEntities(str: string): string {
  return str.replace(/&gt;/, ">")
            .replace(/&quot;/, "\"")
            .replace(/&apos;/, "'")
            .replace(/&amp;/, "&");
}
