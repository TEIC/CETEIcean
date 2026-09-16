import type { CETEIInstance, UtilitiesAPI, PrefixDef } from "../types.js";
import { first } from "./dom.js";

export function normalizeURI(this: UtilitiesAPI, urls: string): string {
  const firstUrl = this.first ? this.first(urls) : first(urls);
  const rewriter = this.rw as ((url: string) => string) | undefined;
  return rewriter ? rewriter(firstUrl) : firstUrl;
}

/*
  Resolves URIs that use TEI prefixDefs into full URIs.
  See https://www.tei-c.org/release/doc/tei-p5-doc/en/html/ref-prefixDef.html
*/
export function resolveURI(this: CETEIInstance, uri: string): string {
  const colonIndex = uri.indexOf(":");
  if (colonIndex === -1) {
    return uri;
  }
  const prefix = uri.substring(0, colonIndex);
  const prefixdef = this.prefixDefs[prefix];
  if (!prefixdef) {
    return uri;
  }
  return uri.replace(new RegExp(prefixdef.matchPattern), prefixdef.replacementPattern);
}

/*
  Convenience function for getting prefix definitions, Takes a prefix
  and returns an object with "matchPattern" and "replacementPattern"
  keys.
*/
export function getPrefixDef(this: CETEIInstance, prefix: string): PrefixDef | undefined {
  return this.prefixDefs[prefix];
}

/*
  Takes a relative URL and rewrites it based on the base URL of the
  HTML document
*/
export function rw(this: CETEIInstance, url: string): string {
  if (!url.trim().match(/^(?:http|mailto|file|\/|#).*$/)) {
    return (this.base || "") + first(url.trim());
  }
  return url;
}
