import type { BehaviorsMap, BehaviorDefinition, BehaviorHost } from "./types.js";

/* 
  Add a user-defined set of behaviors to CETEIcean's processing
  workflow. Added behaviors will override predefined behaviors with the
  same name.
*/
export function addBehaviors(this: BehaviorHost, bhvs: BehaviorsMap) {
  if (bhvs.namespaces) {//updating this.namespaces with any new namespace declarations
    for (const prefix of Object.keys(bhvs.namespaces)) {//bhv.namespaces is prefix:namespaceURI
      const namespaceURI = bhvs.namespaces[prefix];
      if (!this.namespaces.has(namespaceURI) && !Array.from(this.namespaces.values()).includes(prefix)) {
        this.namespaces.set(namespaceURI, prefix); //this.namespaces is namespaceURI:prefix
      }
    }
  }
  for (const prefix of this.namespaces.values()) {//updating this.behaviors with any new behavior definitions
    const entries = bhvs[prefix];
    if (entries) {
      for (const elementName of Object.keys(entries)) {
        this.behaviors[`${prefix}:${elementName}`] = entries[elementName] as BehaviorDefinition;
      }//this.behaviors maps qualified element names to BehaviorDefinitions
    }
  }
  if (bhvs.functions) {
    for (const fn of Object.keys(bhvs.functions)) {
      this.utilities[fn] = bhvs.functions[fn].bind(this.utilities);
    }
  }
  if (bhvs["handlers"]) {
    console.log("Behavior handlers are no longer used.")
  }
  if (bhvs["fallbacks"]) {
    console.log("Fallback behaviors are no longer used.")
  }
}

/* 
  Adds or replaces an individual behavior. Takes a namespace prefix or namespace definition,
  the element name, and the behavior. E.g.
  addBehavior("tei", "add", ["`","`"]) for an already-declared namespace or
  addBehavior({"doc": "http://docbook.org/ns/docbook"}, "note", ["[","]"]) for a new one
*/
export function addBehavior(this: BehaviorHost, ns: string | Record<string, string>, element: string, b: BehaviorDefinition) {
  let p: string | undefined;
  if (typeof ns === "object" && ns !== null) {//ns is a namespace definition
    for (const prefix of Object.keys(ns)) {
      const namespaceURI = ns[prefix];
      if (!this.namespaces.has(namespaceURI)) {
        this.namespaces.set(namespaceURI, prefix);
      }
      p = prefix;//this used to be inside the if block?
    }
  } else {//ns is a string prefix
    p = ns as string;
  }
  this.behaviors[`${p}:${element}`] = b;
}

/*
  Removes a previously-defined or default behavior. Takes a namespace prefix or namespace definition
  and the element name.
*/
export function removeBehavior(this: BehaviorHost, ns: string | Record<string, string>, element: string) {
  let p: string | undefined;
  if (typeof ns === "object" && ns !== null) {
    for (const prefix of Object.keys(ns)) {
      const namespaceURI = ns[prefix];
      if (!this.namespaces.has(namespaceURI)) {
        this.namespaces.set(namespaceURI, prefix);
      }
      p = prefix; //this used to be inside the if block?
    }
  } else {
    p = ns as string;
  }
  delete this.behaviors[`${p}:${element}`];
}