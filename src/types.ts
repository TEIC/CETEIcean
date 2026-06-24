
// Optional configuration accepted by the CETEI constructor.
export interface CETEIOptions {
  documentObject?: Document;
  base?: string;
  debug?: boolean;
  discardContent?: boolean;
  omitDefaultBehaviors?: boolean;
  ignoreFragmentId?: boolean;
}

// Map of namespace URIs (or null) to prefixes, mirroring CETEI.namespaces.
export type NamespaceMap = Map<string | null, string>;

// Structure that describes an item from the prefixDefs array.
export interface PrefixDef {
  matchPattern: string;
  replacementPattern: string;
}

export type PrefixDefsStore = string[] & Record<string, PrefixDef>;

// Common DOM node types used throughout the project
export type CETEINode = Element | Document | DocumentFragment;

// Helper methods bound onto `this.utilities` 
export interface UtilitiesAPI {
  dom?: Element | null;
  noteIndex?: number;
  first?(urls: string): string;
  getOrdinality?(elt: Element | null, name?: string): number;
  copyAndReset?(node: CETEINode): CETEINode;
  hideContent?(elt: Element, rewriteIds?: boolean): void;
  normalizeURI?(urls: string): string;
  repeat?(str: string, times: number): string;
  rw?(url: string): string;
  resolveURI?(uri: string): string;
  getPrefixDef?(prefix: string): PrefixDef | undefined;
  resetAndSerialize?(el: Element, stripElt?: boolean, ws?: string | boolean): string;
  serialize?(elt: CETEINode, stripElt?: boolean, ws?: string | boolean): string;
  serializeHTML?(elt: CETEINode, stripElt?: boolean, ws?: string | boolean): string;
  unEscapeEntities?(str: string): string;
  tagName?(name: string): string;
  [name: string]: unknown;
}

// for the perElementFn parameter in getHTML5/makeHTML5/preprocess/domToHTML5
export type PerElementCallback = (converted: Element, source: Element) => void;


export type BehaviorFunction = (elt: Element) => Node | void;
// A css selector-based rule
export type BehaviorRule = [string, BehaviorDefinition];
export type BehaviorTemplate = [string] | [string, string] | BehaviorRule[];
export type BehaviorDefinition = BehaviorFunction | BehaviorTemplate;

// Record of element names to behavior definitions
export interface BehaviorDefinitionMap {
  [elementName: string]: BehaviorDefinition;
}

/**
 * Top-level behaviors object that can include namespace declarations and
 * per-prefix behavior maps. Additional keys (e.g., "tei", "teieg") map to
 * BehaviorDefinitionMap entries.
 */
type BehaviorNamespaces = Record<string, string>;
export type BehaviorUtility = (this: UtilitiesAPI, ...args: unknown[]) => unknown;
type BehaviorFunctions = Record<string, BehaviorUtility>;

export interface BehaviorsMap {
  namespaces?: BehaviorNamespaces;
  functions?: BehaviorFunctions;
  [prefix: string]: BehaviorDefinitionMap | BehaviorNamespaces | BehaviorFunctions | undefined;
}

export interface BehaviorHost extends CETEIInstance {
  namespaces: NamespaceMap;
  behaviors: Record<string, BehaviorDefinition>;
  utilities: UtilitiesAPI;
}

/** Function type returned by getHandler/getFallback. */
export type HandlerFunction = (this: HTMLElement) => void;

/** Public surface of CETEI instances exposed through the generated d.ts. */
export interface CETEIInstance {
  document: Document;
  options: CETEIOptions;
  base?: string;
  dom?: DocumentFragment | null;
  prefixDefs: PrefixDefsStore;
  utilities: UtilitiesAPI;
  addBehaviors(map: BehaviorsMap): void;
  addBehavior(ns: string | Record<string, string>, element: string, behavior: BehaviorDefinition): void;
  removeBehavior(ns: string | Record<string, string>, element: string): void;
  getHTML5(url: string, callback?: (dom: DocumentFragment, cet: CETEIInstance) => void, perElement?: PerElementCallback): Promise<DocumentFragment | void>;
  makeHTML5(xml: string, callback?: (dom: DocumentFragment, cet: CETEIInstance) => void, perElement?: PerElementCallback): DocumentFragment | void;
  domToHTML5(doc: Document, callback?: (dom: DocumentFragment, cet: CETEIInstance) => void, perElement?: PerElementCallback): DocumentFragment | void;
  setBaseUrl(base: string): void;
}
