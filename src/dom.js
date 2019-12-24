export function learnElementNames(XML_dom, namespaces) {
  const root = XML_dom.documentElement;
  const els = new Set(
    Array.from(root.querySelectorAll("*"),
    e => (
      namespaces.has(e.namespaceURI ? e.namespaceURI : "")
      ? namespaces.get(e.namespaceURI ? e.namespaceURI : "") + ":"
      : ""
    ) + e.localName) );
  // Add the root element to the array
  els.add(
    (
      namespaces.has(root.namespaceURI ? root.namespaceURI : "")
      ? namespaces.get(root.namespaceURI ? root.namespaceURI : "") + ":"
      : ""
    ) + root.localName);
  return els
}