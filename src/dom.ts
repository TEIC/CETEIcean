import type { NamespaceMap } from "./types.js";

export function learnElementNames(XML_dom: Document, namespaces: NamespaceMap): Set<string> {
  const root = XML_dom.documentElement;
  if (!root) {
    return new Set<string>();
  }
  let i = 1;
  const qname = (e: Element): string => {
    const ns = e.namespaceURI ?? "";
    if (!namespaces.has(ns)) {
      namespaces.set(ns, "ns" + i++);
    }
    const prefix = namespaces.get(ns) ?? ""; //technically don't need ?? "" 
    return `${prefix}:${e.localName}`;
  };
  const els = new Set<string>(Array.from(root.querySelectorAll("*"), qname));
  // Add the root element to the array
  els.add(qname(root));
  return els;
}

export function learnCustomElementNames(HTML_dom: Document | Element): Set<string> {
  return new Set<string>(
    Array.from(
      HTML_dom.querySelectorAll("*[data-origname]"),
      (e) => `${e.localName.replace(/(\w+)-.+/, "$1:")}${e.getAttribute("data-origname")}`
    )
  );
}