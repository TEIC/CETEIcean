import type { HandlerFunction } from "../types.js";

// Given a qualified name (e.g. tei:text), return the element name
export function tagName(name: string): string {
  if (name.includes(":"), 1) {
    return name.replace(/:/,"-").toLowerCase();
  }
  return "ceteicean-" + name.toLowerCase();
}

export function defineCustomElement(name: string, behavior: HandlerFunction | null = null, debug = false): void {
  /*
    Registers the list of elements provided with the browser.
    Called by makeHTML5(), but can be called independently if, for example,
    you've created Custom Elements via an XSLT transformation instead.
  */
  try {
    window.customElements.define(tagName(name), class extends HTMLElement {
      constructor() {
        super();
        if (!this.matches(":defined")) {
          if (behavior) {
            behavior.call(this);
            this.setAttribute("data-processed", "");
          }
        }
      }

      connectedCallback() {
        if (!this.hasAttribute("data-processed")) {
          if (behavior) {
            behavior.call(this);
            this.setAttribute("data-processed", "");
          }
        }
      }
    });
  } catch (error) {
    if (debug) {
      console.log(tagName(name) + " couldn't be registered or is already registered.");
      console.log(error);
    }
  }
}
