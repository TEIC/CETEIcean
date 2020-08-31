var CETEI = (function () {
  'use strict';

  /* 
    Performs a deep copy operation of the input node while stripping
    out child elements introduced by CETEIcean.
  */ 
  function copyAndReset(node) {
    let clone = (n) => {
      let result = n.nodeType === Node.ELEMENT_NODE?document.createElement(n.nodeName):n.cloneNode(true);
      if (n.attributes) {
        for (let att of Array.from(n.attributes)) {
          if (att.name !== "data-processed") {
            result.setAttribute(att.name,att.value);
          }
        }
      }
      for (let nd of Array.from(n.childNodes)){
        if (nd.nodeType == Node.ELEMENT_NODE) {
          if (!n.hasAttribute("data-empty")) {
            if (nd.hasAttribute("data-original")) {
              for (let childNode of Array.from(nd.childNodes)) {
                let child = result.appendChild(clone(childNode));
                if (child.nodeType === Node.ELEMENT_NODE && child.hasAttribute("data-origid")) {
                  child.setAttribute("id", child.getAttribute("data-origid"));
                  child.removeAttribute("data-origid");
                }
              }
              return result;
            } else {
              result.appendChild(clone(nd));
            }
          }
        }
        else {
          result.appendChild(nd.cloneNode());
        }
      }
      return result;
    };
    return clone(node);
  }

  /* 
    Given a space-separated list of URLs (e.g. in a ref with multiple
    targets), returns just the first one.
  */
  function first(urls) {
    return urls.replace(/ .*$/, "");
  }

  /* 
    Wraps the content of the element parameter in a <span data-original>
    with display set to "none".
  */
  function hideContent(elt, rewriteIds = true) {
    if (elt.childNodes.length > 0) {
      let hidden = document.createElement("span");
      elt.appendChild(hidden);
      hidden.setAttribute("hidden", "");
      hidden.setAttribute("data-original", "");
      for (let node of Array.from(elt.childNodes)) {
        if (node !== hidden) {
          hidden.appendChild(elt.removeChild(node));
        }
      }
      if (rewriteIds) {
        for (let e of Array.from(hidden.querySelectorAll("*"))) {
          if (e.hasAttribute("id")) {
            e.setAttribute("data-origid", e.getAttribute("id"));
            e.removeAttribute("id");
          }
        }
      }
    }
  }

  function normalizeURI(urls) {
    return this.rw(this.first(urls))
  }

  /* 
    Takes a string and a number and returns the original string
    printed that number of times.
  */
  function repeat(str, times) {
    let result = "";
    for (let i = 0; i < times; i++) {
      result += str;
    }
    return result;
  }

  /* 
    Takes a relative URL and rewrites it based on the base URL of the
    HTML document
  */
  function rw(url) {
    if (!url.match(/^(?:http|mailto|file|\/|#).*$/)) {
      return this.base + url;
    } else {
      return url;
    }
  }

  /* 
    Takes an element and serializes it to an XML string or, if the stripElt
    parameter is set, serializes the element's content.
  */
  function serialize(el, stripElt) {
    let str = "";
    if (!stripElt) {
      str += "&lt;" + el.getAttribute("data-origname");
      for (let attr of Array.from(el.attributes)) {
        if (!attr.name.startsWith("data-") && !(["id", "lang", "class"].includes(attr.name))) {
          str += " " + attr.name + "=\"" + attr.value + "\"";
        }
        if (attr.name == "data-xmlns") {
          str += " xmlns=\"" + attr.value +"\"";
        }
      }
      if (el.childNodes.length > 0) {
        str += ">";
      } else {
        str += "/>";
      }
    }
    //TODO: Be smarter about skipping generated content with hidden original
    for (let node of Array.from(el.childNodes)) {
      switch (node.nodeType) {
        case Node.ELEMENT_NODE:
          str += this.serialize(node);
          break;
        case Node.PROCESSING_INSTRUCTION_NODE:
          str += "&lt;?" + node.nodeValue + "?>";
          break;
        case Node.COMMENT_NODE:
          str += "&lt;!--" + node.nodeValue + "-->";
          break;
        default:
          str += node.nodeValue.replace(/</g, "&lt;");
      }
    }
    if (!stripElt && el.childNodes.length > 0) {
      str += "&lt;/" + el.getAttribute("data-origname") + ">";
    }
    return str;
  }

  function unEscapeEntities(str) {
    return str.replace(/&gt;/, ">")
              .replace(/&quot;/, "\"")
              .replace(/&apos;/, "'")
              .replace(/&amp;/, "&");
  }

  var utilities = /*#__PURE__*/Object.freeze({
    copyAndReset: copyAndReset,
    first: first,
    hideContent: hideContent,
    normalizeURI: normalizeURI,
    repeat: repeat,
    rw: rw,
    serialize: serialize,
    unEscapeEntities: unEscapeEntities
  });

  var defaultBehaviors = {
    "namespaces": {
      "tei": "http://www.tei-c.org/ns/1.0",
      "teieg": "http://www.tei-c.org/ns/Examples",
      "rng": "http://relaxng.org/ns/structure/1.0"  
    },
    "tei": {
      "eg": ["<pre>","</pre>"],
      // inserts a link inside <ptr> using the @target; the link in the
      // @href is piped through the rw (rewrite) function before insertion
      "ptr": ["<a href=\"$rw@target\">$@target</a>"],
      // wraps the content of the <ref> in an HTML link
      "ref": [
        ["[target]", ["<a href=\"$rw@target\">","</a>"]]
      ],
      "graphic": function(elt) {
        let content = new Image();
        content.src = this.rw(elt.getAttribute("url"));
        if (elt.hasAttribute("width")) {
          content.setAttribute("width",elt.getAttribute("width"));
        }
        if (elt.hasAttribute("height")) {
          content.setAttribute("height",elt.getAttribute("height"));
        }
        return content;
      },
      "list": [
        // will only run on a list where @type="gloss"
        ["[type=gloss]", function(elt) {
          let dl = document.createElement("dl");
          for (let child of Array.from(elt.children)) {
            if (child.nodeType == Node.ELEMENT_NODE) {
              if (child.localName == "tei-label") {
                let dt = document.createElement("dt");
                dt.innerHTML = child.innerHTML;
                dl.appendChild(dt);
              }
              if (child.localName == "tei-item") {
                let dd = document.createElement("dd");
                dd.innerHTML = child.innerHTML;
                dl.appendChild(dd);
              }
            }
          }
          return dl;
        }
      ]],
      "note": [
        // Make endnotes
        ["[place=end]", function(elt){
          if (!this.noteIndex){
            this["noteIndex"] = 1;
          } else {
            this.noteIndex++;
          }
          let id = "_note_" + this.noteIndex;
          let link = document.createElement("a");
          link.setAttribute("id", "src" + id);
          link.setAttribute("href", "#" + id);
          link.innerHTML = this.noteIndex;
          let content = document.createElement("sup");
          content.appendChild(link);
          let notes = this.dom.querySelector("ol.notes");
          if (!notes) {
            notes = document.createElement("ol");
            notes.setAttribute("class", "notes");
            this.dom.appendChild(notes);
          }
          let note = document.createElement("li");
          note.id = id;
          note.innerHTML = elt.innerHTML;
          notes.appendChild(note);
          return content;
        }],
        ["_", ["(",")"]]
      ],
      "table": function(elt) {
        let table = document.createElement("table");
        table.innerHTML = elt.innerHTML;
        if (table.firstElementChild.localName == "tei-head") {
          let head = table.firstElementChild;
          head.remove();
          let caption = document.createElement("caption");
          caption.innerHTML = head.innerHTML;
          table.appendChild(caption);
        }
        for (let row of Array.from(table.querySelectorAll("tei-row"))) {
          let tr = document.createElement("tr");
          tr.innerHTML = row.innerHTML;
          for (let attr of Array.from(row.attributes)) {
            tr.setAttribute(attr.name, attr.value);
          }
          row.parentElement.replaceChild(tr, row);
        }
        for (let cell of Array.from(table.querySelectorAll("tei-cell"))) {
          let td = document.createElement("td");
          if (cell.hasAttribute("cols")) {
            td.setAttribute("colspan", cell.getAttribute("cols"));
          }
          td.innerHTML = cell.innerHTML;
          for (let attr of Array.from(cell.attributes)) {
            td.setAttribute(attr.name, attr.value);
          }
          cell.parentElement.replaceChild(td, cell);
        }
        return table;
      },
      "teiHeader": function(e) {
        this.hideContent(e, false);
      },
      "title": [
        ["tei-titlestmt>tei-title", function(elt) {
          let title = document.createElement("title");
          title.innerHTML = elt.innerText;
          document.querySelector("head").appendChild(title);
        }]
      ]
    },
    "teieg": {
      "egXML": function(elt) {
        let pre = document.createElement("pre");
        pre.innerHTML = this.serialize(elt, true);
        return pre;
      }
    }
  };

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
    hideContent(elt);
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
    return (elt) => {
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
      return name.replace(/:/,"-").toLowerCase();  }
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
  function define(names) {
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
  function fallback(names) {
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

  /* 
    Add a user-defined set of behaviors to CETEIcean's processing
    workflow. Added behaviors will override predefined behaviors with the
    same name.
  */
  function addBehaviors(bhvs) {
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
      console.log("Behavior handlers are no longer used.");
    }
    if (bhvs["fallbacks"]) {
      console.log("Fallback behaviors are no longer used.");
    }
  }

  /* 
    Adds or replaces an individual behavior. Takes a namespace prefix or namespace definition,
    the element name, and the behavior. E.g.
    addBehavior("tei", "add", ["`","`"]) for an already-declared namespace or
    addBehavior({"doc": "http://docbook.org/ns/docbook"}, "note", ["[","]"]) for a new one
  */
  function addBehavior(ns, element, b) {
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

  // Define or apply behaviors for the document
  function applyBehaviors() {
    if (window.customElements) {
      define.call(this, this.els);
    } else {
      fallback.call(this, this.els);
    }
  }

  function learnElementNames(XML_dom, namespaces) {
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

  class CETEI {
    constructor(options){
      this.options = options ? options : {};

      // Bind methods
      this.addBehaviors = addBehaviors.bind(this);
      this.addBehavior = addBehavior.bind(this);
      this.applyBehaviors = applyBehaviors.bind(this);

      // Bind utilities
      this.utilities = {};
      for (const u of Object.keys(utilities)) {
        this.utilities[u] = utilities[u].bind(this);
      }

      // Set properties
      this.els = [];
      this.namespaces = new Map();
      this.behaviors = {};
      this.hasStyle = false;
      this.prefixDefs = [];
      this.debug = this.options.debug === true ? true : false;
      if (this.options.base) {
        this.base = this.options.base;
      } else {
        try {
          if (window) {
            this.base = window.location.href.replace(/\/[^\/]*$/, "/");
          }
        } catch (e) {
          this.base = "";
        }
      }
      if (!this.options.omitDefaultBehaviors) {
        this.addBehaviors(defaultBehaviors);
      }
    }

    /* 
      Returns a Promise that fetches an XML source document from the URL
      provided in the first parameter and then calls the makeHTML5 method
      on the returned document.
    */
    getHTML5(XML_url, callback, perElementFn){
      if (window.location.href.startsWith(this.base) && (XML_url.indexOf("/") >= 0)) {
        this.base = XML_url.replace(/\/[^\/]*$/, "/");
      }
      // Get XML from XML_url and create a promise
      let promise = new Promise( function (resolve, reject) {
        let client = new XMLHttpRequest();
        client.open('GET', XML_url);
        client.send();
        client.onload = function () {
          if (this.status >= 200 && this.status < 300) {
            resolve(this.response);
          } else {
            reject(this.statusText);
          }
        };
        client.onerror = function () {
          reject(this.statusText);
        };
      })
      .catch( function(reason) {
        console.log("Could not get XML file.");
        if (this.debug) {
            console.log(reason);
        }
      });

      return promise.then((XML) => {
          return this.makeHTML5(XML, callback, perElementFn);
      });
    }

    /* 
      Converts the supplied XML string into HTML5 Custom Elements. If a callback
      function is supplied, calls it on the result.
    */
    makeHTML5(XML, callback, perElementFn){
      // XML is assumed to be a string
      let XML_dom = ( new DOMParser() ).parseFromString(XML, "text/xml");
      return this.domToHTML5(XML_dom, callback, perElementFn);
    }

    /* 
      Converts the supplied XML DOM into HTML5 Custom Elements. If a callback
      function is supplied, calls it on the result.
    */
    domToHTML5(XML_dom, callback, perElementFn){

      this.els = learnElementNames(XML_dom, this.namespaces);

      let convertEl = (el) => {
        // Elements with defined namespaces get the prefix mapped to that element. All others keep
        // their namespaces and are copied as-is.
        let newElement;
        if (this.namespaces.has(el.namespaceURI ? el.namespaceURI : "")) {
          let prefix = this.namespaces.get(el.namespaceURI ? el.namespaceURI : "");
          newElement = document.createElement(`${prefix}-${el.localName}`);
        } else {
          newElement = document.importNode(el, false);
        }
        // Copy attributes; @xmlns, @xml:id, @xml:lang, and
        // @rendition get special handling.
        for (let att of Array.from(el.attributes)) {
            if (att.name == "xmlns") {
              //Strip default namespaces, but hang on to the values
              newElement.setAttribute("data-xmlns", att.value);
            } else {
              newElement.setAttribute(att.name, att.value);
            }
            if (att.name == "xml:id") {
              newElement.setAttribute("id", att.value);
            }
            if (att.name == "xml:lang") {
              newElement.setAttribute("lang", att.value);
            }
            if (att.name == "rendition") {
              newElement.setAttribute("class", att.value.replace(/#/g, ""));
            }
        }
        // Preserve element name so we can use it later
        newElement.setAttribute("data-origname", el.localName);
        // If element is empty, flag it
        if (el.childNodes.length == 0) {
          newElement.setAttribute("data-empty", "");
        }
        // Turn <rendition scheme="css"> elements into HTML styles
        if (el.localName == "tagsDecl") {
          let style = document.createElement("style");
          for (let node of Array.from(el.childNodes)){
            if (node.nodeType == Node.ELEMENT_NODE && node.localName == "rendition" && node.getAttribute("scheme") == "css") {
              let rule = "";
              if (node.hasAttribute("selector")) {
                //rewrite element names in selectors
                rule += node.getAttribute("selector").replace(/([^#, >]+\w*)/g, "tei-$1").replace(/#tei-/g, "#") + "{\n";
                rule += node.textContent;
              } else {
                rule += "." + node.getAttribute("xml:id") + "{\n";
                rule += node.textContent;
              }
              rule += "\n}\n";
              style.appendChild(document.createTextNode(rule));
            }
          }
          if (style.childNodes.length > 0) {
            newElement.appendChild(style);
            this.hasStyle = true;
          }
        }
        // Get prefix definitions
        if (el.localName == "prefixDef") {
          this.prefixDefs.push(el.getAttribute("ident"));
          this.prefixDefs[el.getAttribute("ident")] = {
            "matchPattern": el.getAttribute("matchPattern"),
            "replacementPattern": el.getAttribute("replacementPattern")
          };
        }
        for (let node of Array.from(el.childNodes)) {
            if (node.nodeType == Node.ELEMENT_NODE) {
                newElement.appendChild(convertEl(node));
            }
            else {
                newElement.appendChild(node.cloneNode());
            }
        }
        if (perElementFn) {
          perElementFn(newElement, el);
        }
        return newElement;
      };

      this.dom = convertEl(XML_dom.documentElement);

      this.applyBehaviors();
      this.done = true;
      if (callback) {
        callback(this.dom, this);
        window.dispatchEvent(ceteiceanLoad);
      } else {
        window.dispatchEvent(ceteiceanLoad);
        return this.dom;
      }
    }

    /* 
      If the TEI document defines CSS styles in its tagsDecl, this method
      copies them into the wrapper HTML document's head.
    */
    addStyle(doc, data) {
      if (this.hasStyle) {
        doc.getElementsByTagName("head").item(0).appendChild(data.getElementsByTagName("style").item(0).cloneNode(true));
      }
    }

    /* 
      To change a namespace -> prefix mapping, the namespace must first be 
      unset. Takes a namespace URI. In order to process a TEI P4 document, e.g.,
      the TEI namespace must be unset before it can be set to the empty string.
    */
    unsetNamespace(ns) {
      this.namespaces.delete(ns);
    }

    /* 
      Sets the base URL for the document. Used to rewrite relative links in the
      XML source (which may be in a completely different location from the HTML
      wrapper).
    */
    setBaseUrl(base) {
      this.base = base;
    }

    /**********************
     * Utility functions  *
     **********************/

    static savePosition() {
      window.localStorage.setItem("scroll", window.scrollY);
    }
    
    static restorePosition() {
      if (!window.location.hash) {
        if (window.localStorage.getItem("scroll")) {
          setTimeout(function() {
            window.scrollTo(0, localStorage.getItem("scroll"));
          }, 100);
        }
      } else {
        setTimeout(function() {
          document.querySelector(window.location.hash).scrollIntoView();
        }, 100);
      }
    }

  }

  // Make main class available to pre-ES6 browser environments
  try {
    if (window) {
        window.CETEI = CETEI;
        window.addEventListener("beforeunload", CETEI.savePosition);
        var ceteiceanLoad = new Event("ceteiceanload");
        window.addEventListener("ceteiceanload", CETEI.restorePosition);
    }
  } catch (e) {
    // window not defined
    console.log(e);
  }

  return CETEI;

}());
