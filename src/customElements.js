import * as utilities from './utilities'

/* 
  Appends any element returned by the function passed in the first
  parameter to the element in the second parameter. If the function
  returns nothing, this is a no-op aside from any side effects caused
  by the provided function.

  Called by getHandler() and fallback()
*/
function append(fn, elt) {
  if (elt) {
    let content = fn.call(utilities, elt);
    if (content && !childExists(elt.firstElementChild, content.nodeName)) {
      appendBasic(elt, content);
    }
  } else {
    return function() {
      if (!this.hasAttribute("data-processed")) {
        let content = fn.call(utilities, this);
        if (content && !childExists(this.firstElementChild, content.nodeName)) {
          appendBasic(this, content);
        }
      }
    }
  }
}

function appendBasic(elt, content) {
  utilities.hideContent(elt);
  elt.appendChild(content);
}

// Given an element, return its qualified name as defined in a behaviors object
function bName(e) {
  return e.tagName.substring(0,e.tagName.indexOf("-")).toLowerCase() + ":" + e.getAttribute("data-origname");
}

/* 
  Private method called by append(). Takes a child element and a name, and recurses through the
  child's siblings until an element with that name is found, returning true if it is and false if not.
*/
function childExists(elt, name) {
  if (elt && elt.nodeName == name) {
    return true;
  } else {
    return elt && elt.nextElementSibling && childExists(elt.nextElementSibling, name);
  }
}

/* 
  Takes a template in the form of either an array of 1 or 2 
  strings or an object with CSS selector keys and either functions
  or arrays as described above. Returns a closure around a function 
  that can be called in the element constructor or applied to an 
  individual element.

  Called by the getHandler() and getFallback() methods
*/
function decorator(template) {
  if (Array.isArray(template) && !Array.isArray(template[0])) {
    return applyDecorator(template)
  } 
  return function(elt) {
    for (let rule of template) {
      if (elt.matches(rule[0]) || rule[0] === "_") {
        if (Array.isArray(rule[1])) {
          return decorator(rule[1]).call(this, elt);
        } else {
          return rule[1].call(this, elt);
        }
      }
    }
  }
}

function applyDecorator(strings) {
  return function (elt) {
    let copy = [];
    for (let i = 0; i < strings.length; i++) {
      copy.push(template(strings[i], elt));
    }
    return insert(elt, copy);
  }
}

/* 
  Returns the fallback function for the given element name.
  Called by fallback().
*/
function getFallback(behaviors, fn) {
  if (behaviors[fn]) {
    if (behaviors[fn] instanceof Function) {
      return behaviors[fn];
    } else {
      return decorator(behaviors[fn]);
    }
  }
}

/* 
  Returns the handler function for the given element name
  Called by define().
*/
function getHandler(behaviors, fn) {
  if (behaviors[fn]) {
    if (behaviors[fn] instanceof Function) {
      return append(behaviors[fn]);
    } else {
      return append(decorator(behaviors[fn]));
    }
  }
}

function insert(elt, strings) {
  let span = document.createElement("span");
  for (let node of Array.from(elt.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE && !node.hasAttribute("data-processed")) {
      processElement(node);
    }
  } 
  // If we have before and after tags have them parsed by
  // .innerHTML and then add the content to the resulting child
  if (strings[0].match("<[^>]+>") && strings[1] && strings[1].match("<[^>]+>")) { 
    span.innerHTML = strings[0] + (strings[1]?strings[1]:"");
    for (let node of Array.from(elt.childNodes)) {
      span.firstElementChild.appendChild(node.cloneNode(true));
    }
  } else {
    span.innerHTML = strings[0];
    span.setAttribute("data-before", strings[0].replace(/<[^>]+>/g,"").length);
    for (let node of Array.from(elt.childNodes)) {
      span.appendChild(node.cloneNode(true));
    }
    if (strings.length > 1) {
      span.innerHTML += strings[1];
      span.setAttribute("data-after", strings[1].replace(/<[^>]+>/g,"").length);
    } 
  }
  return span;
}

// Runs behaviors recursively on the supplied element and children
function processElement(elt) {
  if (elt.hasAttribute("data-origname") && ! elt.hasAttribute("data-processed")) {
    let fn = getFallback(bName(elt));
    if (fn) {
      append(fn,elt);
      elt.setAttribute("data-processed", "");
    }
  }
  for (let node of Array.from(elt.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      processElement(node);
    }
  }
}

// Given a qualified name (e.g. tei:text), return the element name
function tagName(name) {
  if (name.includes(":"), 1) {
    return name.replace(/:/,"-").toLowerCase();;
  } else {
    return "ceteicean-" + name.toLowerCase();
  }
}

function template(str, elt) {
  let result = str;
  if (str.search(/\$(\w*)(@([a-zA-Z:]+))/ )) {
    let re = /\$(\w*)@([a-zA-Z:]+)/g;
    let replacements;
    while (replacements = re.exec(str)) {
      if (elt.hasAttribute(replacements[2])) {
        if (replacements[1] && utilities[replacements[1]]) {
          result = result.replace(replacements[0], utilities[replacements[1]](elt.getAttribute(replacements[2])));
        } else {
          result = result.replace(replacements[0], elt.getAttribute(replacements[2]));
        }
      }
    }
  }
  return result;
}

/* 
  Registers the list of elements provided with the browser.
  Called by makeHTML5(), but can be called independently if, for example,
  you've created Custom Elements via an XSLT transformation instead.
*/
export function define(names) {
  for (let name of names) {
    try {
      let fn = getHandler(this.behaviors, name);
      window.customElements.define(tagName(name), class extends HTMLElement {
        constructor() {
          super(); 
          if (!this.matches(":defined")) { // "Upgraded" undefined elements can have attributes & children; new elements can't
            if (fn) {
              fn.call(this);
            }
            // We don't want to double-process elements, so add a flag
            this.setAttribute("data-processed", "");
          }
        }
        // Process new elements when they are connected to the browser DOM
        connectedCallback() {
          if (!this.hasAttribute("data-processed")) {
            if (fn) {
              fn.call(this);
            }
            this.setAttribute("data-processed", "");
          }
        };
      });
    } catch (error) {
      // When using the same CETEIcean instance for multiple TEI files, this error becomes very common. 
      // It's muted by default unless the debug option is set.
      if (this.debug) {
          console.log(tagName(name) + " couldn't be registered or is already registered.");
          console.log(error);
      }
    }

  }
}

/* 
  Provides fallback functionality for browsers where Custom Elements
  are not supported.

  Like define(), this is called by makeHTML5(), but can be called
  independently.
*/
export function fallback(names) {
  for (let name of names) {
    let fn = getFallback(this.behaviors, name);
    if (fn) {
      for (let elt of Array.from((
          this.dom && !this.done 
          ? this.dom
          : document
        ).getElementsByTagName(tagName(name)))) {
        if (!elt.hasAttribute("data-processed")) {
          append(fn, elt);
        }
      }
    }
  }
}