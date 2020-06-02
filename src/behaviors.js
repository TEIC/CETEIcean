
/* 
  Add a user-defined set of behaviors to CETEIcean's processing
  workflow. Added behaviors will override predefined behaviors with the
  same name.
*/
export function addBehaviors(bhvs) {
  if (bhvs.namespaces) {
    for (let prefix of Object.keys(bhvs.namespaces)) {
      if (!this.namespaces.has(bhvs.namespaces[prefix]) && !Array.from(this.namespaces.values()).includes(prefix)) {
        this.namespaces.set(bhvs.namespaces[prefix], prefix);
      }
    }
  }
  for (let prefix of this.namespaces.values()) {
    if (bhvs[prefix]) {
      for (let b of Object.keys(bhvs[prefix])) {
        this.behaviors[`${prefix}:${b}`] = bhvs[prefix][b];
      }
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
export function addBehavior(ns, element, b) {
  let p;
  if (ns === Object(ns)) {
    for (let prefix of Object.keys(ns)) {
      if (!this.namespaces.has(ns[prefix])) {
        this.namespaces.set(ns[prefix], prefix);
        p = prefix;
      }
    }
  } else {
    p = ns;
  }
  this.behaviors[`${p}:${element}`] = b;
}

/*
  Removes a previously-defined or default behavior. Takes a namespace prefix or namespace definition
  and the element name.
*/
export function removeBehavior(ns, element) {
  let p;
  if (ns === Object(ns)) {
    for (let prefix of Object.keys(ns)) {
      if (!this.namespaces.has(ns[prefix])) {
        this.namespaces.set(ns[prefix], prefix);
        p = prefix;
      }
    }
  } else {
    p = ns;
  }
  delete this.behaviors[`${p}:${element}`];
}

// Define or apply behaviors for the document
export function applyBehaviors() {
  if (window.customElements) {
    this.define.call(this, this.els);
  } else {
    this.fallback.call(this, this.els);
  }
}
