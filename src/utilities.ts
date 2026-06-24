export {
  ELEMENT_NODE,
  DOCUMENT_NODE,
  DOCUMENT_FRAGMENT_NODE,
  PROCESSING_INSTRUCTION_NODE,
  COMMENT_NODE,
  getOrdinality,
  copyAndReset,
  first,
  hideContent,
  repeat,
} from "./utilities/dom.js";

export { normalizeURI, resolveURI, getPrefixDef, rw } from "./utilities/prefixes.js";

export { resetAndSerialize, serialize, serializeHTML, unEscapeEntities } from "./utilities/serialization.js";

export { tagName, defineCustomElement } from "./utilities/customElements.js";
