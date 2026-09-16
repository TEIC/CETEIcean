import type { CETEINode } from "../types.js";

export const ELEMENT_NODE = 1;
export const DOCUMENT_NODE = 9;
export const DOCUMENT_FRAGMENT_NODE = 11;
export const PROCESSING_INSTRUCTION_NODE = 7;
export const COMMENT_NODE = 8;

export const isElement = (node: Node | null): node is Element => {
  return !!node && node.nodeType === ELEMENT_NODE;
};

export const isDocument = (node: Node | null): node is Document => {
  return !!node && node.nodeType === DOCUMENT_NODE;
};

export const isDocumentFragment = (node: Node | null): node is DocumentFragment => {
  return !!node && node.nodeType === DOCUMENT_FRAGMENT_NODE;
};

export function getOrdinality(elt: Element | null, name?: string): number {
  let pos = 1;
  let e = elt;
  while (e && e.previousElementSibling !== null && (name ? e.previousElementSibling.localName == name : true)) {
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
export function copyAndReset<T extends CETEINode>(node: T): T {
  const doc = node.ownerDocument || (node as Document);
  const clone = (n: Node): Node => {
    let result: Node;
    switch (n.nodeType) {
      case ELEMENT_NODE:
        result = doc.createElement((n as Element).nodeName);
        break;
      case DOCUMENT_NODE:
        result = (n as Document).implementation.createDocument(
          null,
          (n as Document).documentElement?.nodeName ?? "",
          null
        );
        break;
      case DOCUMENT_FRAGMENT_NODE:
        result = doc.createDocumentFragment();
        break;
      default:
        result = n.cloneNode(true);
    }
    if (isElement(n) && isElement(result)) {
      for (const att of Array.from(n.attributes)) {
        if (att.name !== "data-processed") {
          result.setAttribute(att.name, att.value);
        }
      }
    }
    for (const nd of Array.from(n.childNodes)) {
      if (isElement(nd)) {
        if (nd.hasAttribute("data-original")) {
          for (const childNode of Array.from(nd.childNodes)) {
            const child = result.appendChild(clone(childNode));
            if (isElement(child) && child.hasAttribute("data-origid")) {
              const orig = child.getAttribute("data-origid") || "";
              child.setAttribute("id", orig);
              child.removeAttribute("data-origid");
            }
          }
          return result;
        } else if (nd.hasAttribute("data-origname")) {
          result.appendChild(clone(nd));
        }
      } else {
        result.appendChild(nd.cloneNode());
      }
    }
    return result;
  };
  return clone(node) as T;
}

/*
  Given a space-separated list of URLs (e.g. in a ref with multiple
  targets), returns just the first one.
*/
export function first(urls: string): string {
  return urls.replace(/ .*$/, "");
}

/*
  Wraps the content of the element parameter in a hidden <cetei-original data-original>
*/
export function hideContent(elt: Element, rewriteIds = true): void {
  const doc = elt.ownerDocument;
  if (elt.childNodes.length > 0) {
    const hidden = doc.createElement("cetei-original");
    elt.appendChild(hidden);
    hidden.setAttribute("hidden", "");
    hidden.setAttribute("data-original", "");
    hidden.setAttribute("role", "none");
    const children = Array.from(elt.childNodes);
    for (const node of children) {
      if (node === hidden) {
        continue;
      }
      if (isElement(node)) {
        node.setAttribute("data-processed", "");
        for (const e of Array.from(node.querySelectorAll("*"))) {
          e.setAttribute("data-processed", "");
        }
      }
      hidden.appendChild(elt.removeChild(node));
    }
    if (rewriteIds) {
      for (const e of Array.from(hidden.querySelectorAll("*"))) {
        if (e.hasAttribute("id")) {
          e.setAttribute("data-origid", e.getAttribute("id"));
          e.removeAttribute("id");
        }
      }
    }
  }
}

/*
  Takes a string and a number and returns the original string
  printed that number of times.
*/
export function repeat(str: string, times: number): string {
  let result = "";
  for (let i = 0; i < times; i++) {
    result += str;
  }
  return result;
}
