var CETEI = (function () {
  'use strict';

  var babelHelpers = {};

  babelHelpers.classCallCheck = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  babelHelpers.createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  babelHelpers;

  var behaviors = {
    "handlers": {
      // inserts a link inside <ptr> using the @target; the link in the
      // @href is piped through the rw (rewrite) function before insertion
      "ptr": ["<a href=\"$rw@target\">$@target</a>"],
      // wraps the content of the <ref> in an HTML link
      "ref": ["<a href=\"$rw@target\">", "</a>"],
      "graphic": function graphic() {
        var ceteicean = this;
        return function () {
          var shadow = ceteicean.createShadowRoot();
          this.addShadowStyle(shadow);
          var img = new Image();
          img.src = ceteicean.rw(this.getAttribute("url"));
          if (this.hasAttribute("width")) {
            img.width = this.getAttribute("width").replace(/[^.0-9]/g, "");
          }
          if (this.hasAttribute("height")) {
            img.height = this.getAttribute("height").replace(/[^.0-9]/g, "");
          }
          shadow.appendChild(img);
        };
      },
      "table": function table() {
        var ceteicean = this;
        return function () {
          var shadow = this.createShadowRoot();
          ceteicean.addShadowStyle(shadow);
          var shadowContent = document.createElement("table");
          shadowContent.innerHTML = this.innerHTML;
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = Array.from(shadowContent.querySelectorAll("tei-row"))[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var row = _step.value;

              var tr = document.createElement("tr");
              tr.innerHTML = row.innerHTML;
              var _iteratorNormalCompletion3 = true;
              var _didIteratorError3 = false;
              var _iteratorError3 = undefined;

              try {
                for (var _iterator3 = Array.from(row.attributes)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                  var attr = _step3.value;

                  tr.setAttribute(attr.name, attr.value);
                }
              } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion3 && _iterator3.return) {
                    _iterator3.return();
                  }
                } finally {
                  if (_didIteratorError3) {
                    throw _iteratorError3;
                  }
                }
              }

              row.parentElement.replaceChild(tr, row);
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }

          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = Array.from(shadowContent.querySelectorAll("tei-cell"))[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var cell = _step2.value;

              var td = document.createElement("td");
              if (cell.hasAttribute("cols")) {
                td.setAttribute("colspan", cell.getAttribute("cols"));
              }
              td.innerHTML = cell.innerHTML;
              var _iteratorNormalCompletion4 = true;
              var _didIteratorError4 = false;
              var _iteratorError4 = undefined;

              try {
                for (var _iterator4 = Array.from(cell.attributes)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                  var _attr = _step4.value;

                  td.setAttribute(_attr.name, _attr.value);
                }
              } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion4 && _iterator4.return) {
                    _iterator4.return();
                  }
                } finally {
                  if (_didIteratorError4) {
                    throw _iteratorError4;
                  }
                }
              }

              cell.parentElement.replaceChild(td, cell);
            }
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }

          shadow.appendChild(shadowContent);
        };
      },
      "egXML": function egXML() {
        var ceteicean = this;
        return function () {
          var shadow = this.createShadowRoot();
          ceteicean.addShadowStyle(shadow);
          shadow.innerHTML = "<pre>" + ceteicean.serialize(this, true) + "</pre>";
        };
      }
    },
    "fallbacks": {
      "ref": function ref(elt) {
        var ceteicean = this;
        elt.addEventListener("click", function (event) {
          window.location = ceteicean.rw(elt.getAttribute("target"));
        });
      },
      "graphic": function graphic(elt) {
        var content = new Image();
        content.src = this.rw(this.getAttribute("url"));
        if (elt.hasAttribute("width")) {
          content.width = elt.getAttribute("width").replace(/[^.0-9]/g, "");
        }
        if (elt.hasAttribute("height")) {
          content.height = elt.getAttribute("height").replace(/[^.0-9]/g, "");
        }
        elt.appendChild(content);
      },
      "table": function table(elt) {
        var table = document.createElement("table");
        table.innerHTML = elt.innerHTML;
        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;

        try {
          for (var _iterator5 = Array.from(table.querySelectorAll("tei-row"))[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var row = _step5.value;

            var tr = document.createElement("tr");
            tr.innerHTML = row.innerHTML;
            var _iteratorNormalCompletion7 = true;
            var _didIteratorError7 = false;
            var _iteratorError7 = undefined;

            try {
              for (var _iterator7 = Array.from(row.attributes)[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                var attr = _step7.value;

                tr.setAttribute(attr.name, attr.value);
              }
            } catch (err) {
              _didIteratorError7 = true;
              _iteratorError7 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion7 && _iterator7.return) {
                  _iterator7.return();
                }
              } finally {
                if (_didIteratorError7) {
                  throw _iteratorError7;
                }
              }
            }

            row.parentElement.replaceChild(tr, row);
          }
        } catch (err) {
          _didIteratorError5 = true;
          _iteratorError5 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion5 && _iterator5.return) {
              _iterator5.return();
            }
          } finally {
            if (_didIteratorError5) {
              throw _iteratorError5;
            }
          }
        }

        var _iteratorNormalCompletion6 = true;
        var _didIteratorError6 = false;
        var _iteratorError6 = undefined;

        try {
          for (var _iterator6 = Array.from(table.querySelectorAll("tei-cell"))[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var cell = _step6.value;

            var td = document.createElement("td");
            if (cell.hasAttribute("cols")) {
              td.setAttribute("colspan", cell.getAttribute("cols"));
            }
            td.innerHTML = cell.innerHTML;
            var _iteratorNormalCompletion8 = true;
            var _didIteratorError8 = false;
            var _iteratorError8 = undefined;

            try {
              for (var _iterator8 = Array.from(cell.attributes)[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                var _attr2 = _step8.value;

                td.setAttribute(_attr2.name, _attr2.value);
              }
            } catch (err) {
              _didIteratorError8 = true;
              _iteratorError8 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion8 && _iterator8.return) {
                  _iterator8.return();
                }
              } finally {
                if (_didIteratorError8) {
                  throw _iteratorError8;
                }
              }
            }

            cell.parentElement.replaceChild(td, cell);
          }
        } catch (err) {
          _didIteratorError6 = true;
          _iteratorError6 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion6 && _iterator6.return) {
              _iterator6.return();
            }
          } finally {
            if (_didIteratorError6) {
              throw _iteratorError6;
            }
          }
        }

        elt.innerHTML = "<span style=\"display:none\">" + elt.innerHTML + "</span>";
        elt.appendChild(table);
      },
      "egXML": function egXML(elt) {
        var content = elt.innerHTML;
        elt.innerHTML = "<span style=\"display:none\">" + elt.innerHTML + "</span>";
        elt.innerHTML += "<pre>" + content.replace(/</g, "&lt;") + "</pre>";
      }
    }
  };

  var CETEI = function () {
    function CETEI(base) {
      babelHelpers.classCallCheck(this, CETEI);

      this.els = [];
      this.behaviors = [];
      this.hasStyle = false;
      this.prefixes = [];
      if (base) {
        this.base = base;
      } else {
        try {
          if (window) {
            this.base = window.location.href.replace(/\/[^\/]*$/, "/");
          }
        } catch (e) {
          this.base = "";
        }
      }
      this.behaviors.push(behaviors);
      this.shadowCSS;
    }

    // public method
    /* Returns a Promise that fetches a TEI source document from the URL
       provided in the first parameter and then calls the makeHTML5 method
       on the returned document.
     */


    babelHelpers.createClass(CETEI, [{
      key: "getHTML5",
      value: function getHTML5(TEI_url, callback, perElementFn) {
        var _this = this;

        // Get TEI from TEI_url and create a promise
        var promise = new Promise(function (resolve, reject) {
          var client = new XMLHttpRequest();

          client.open('GET', TEI_url);
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
        }).catch(function (reason) {
          // TODO: better error handling?
          console.log(reason);
        });

        return promise.then(function (TEI) {
          return _this.makeHTML5(TEI, callback, perElementFn);
        });
      }

      /* Converts the supplied TEI string into HTML5 Custom Elements. If a callback
         function is supplied, calls it on the result.
       */

    }, {
      key: "makeHTML5",
      value: function makeHTML5(TEI, callback, perElementFn) {
        var _this2 = this;

        // TEI is assumed to be a string
        var TEI_dom = new DOMParser().parseFromString(TEI, "text/xml");

        this._fromTEI(TEI_dom);

        var convertEl = function convertEl(el) {
          // Create new element. TEI elements get prefixed with 'tei-',
          // TEI example elements with 'teieg-'. All others keep
          // their namespaces and are copied as-is.
          var newElement = void 0;
          var copy = false;
          switch (el.namespaceURI) {
            case "http://www.tei-c.org/ns/1.0":
              newElement = document.createElement("tei-" + el.tagName);
              break;
            case "http://www.tei-c.org/ns/Examples":
              if (el.tagName == "egXML") {
                newElement = document.createElement("teieg-" + el.tagName);
                break;
              }
            default:
              newElement = document.importNode(el, false);
              copy = true;
          }
          // Copy attributes; @xmlns, @xml:id, @xml:lang, and
          // @rendition get special handling.
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = Array.from(el.attributes)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var att = _step.value;

              if (att.name != "xmlns" || copy) {
                newElement.setAttribute(att.name, att.value);
              } else {
                newElement.setAttribute("data-xmlns", att.value); //Strip default namespaces, but hang on to the values
              }
              if (att.name == "xml:id" && !copy) {
                newElement.setAttribute("id", att.value);
              }
              if (att.name == "xml:lang" && !copy) {
                newElement.setAttribute("lang", att.value);
              }
              if (att.name == "rendition") {
                newElement.setAttribute("class", att.value.replace(/#/g, ""));
              }
            }
            // Preseve element name so we can use it later
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }

          newElement.setAttribute("data-teiname", el.localName);
          // Turn <rendition scheme="css"> elements into HTML styles
          if (el.localName == "tagsDecl") {
            var style = document.createElement("style");
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
              for (var _iterator2 = Array.from(el.childNodes)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var node = _step2.value;

                if (node.nodeType == Node.ELEMENT_NODE && node.localName == "rendition" && node.getAttribute("scheme") == "css") {
                  var rule = "";
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
            } catch (err) {
              _didIteratorError2 = true;
              _iteratorError2 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                  _iterator2.return();
                }
              } finally {
                if (_didIteratorError2) {
                  throw _iteratorError2;
                }
              }
            }

            if (style.childNodes.length > 0) {
              newElement.appendChild(style);
              _this2.hasStyle = true;
            }
          }
          // Get prefix definitions
          if (el.localName == "prefixDef") {
            _this2.prefixes.push(el.getAttribute("ident"));
            _this2.prefixes[el.getAttribute("ident")] = { "matchPattern": el.getAttribute("matchPattern"),
              "replacementPattern": el.getAttribute("replacementPattern") };
          }
          var _iteratorNormalCompletion3 = true;
          var _didIteratorError3 = false;
          var _iteratorError3 = undefined;

          try {
            for (var _iterator3 = Array.from(el.childNodes)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              var _node = _step3.value;

              if (_node.nodeType == Node.ELEMENT_NODE) {
                newElement.appendChild(convertEl(_node));
              } else {
                newElement.appendChild(_node.cloneNode());
              }
            }
          } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion3 && _iterator3.return) {
                _iterator3.return();
              }
            } finally {
              if (_didIteratorError3) {
                throw _iteratorError3;
              }
            }
          }

          if (perElementFn) {
            perElementFn(newElement);
          }
          return newElement;
        };

        this.dom = convertEl(TEI_dom.documentElement);

        if (document.registerElement) {
          this.registerAll(this.els);
        } else {
          this.fallback(this.els);
        }
        this.done = true;
        if (callback) {
          callback(this.dom, this);
        } else {
          return this.dom;
        }
      }

      /* If the TEI document defines CSS styles in its tagsDecl, this method
         copies them into the wrapper HTML document's head.
       */

    }, {
      key: "addStyle",
      value: function addStyle(doc, data) {
        if (this.hasStyle) {
          doc.getElementsByTagName("head").item(0).appendChild(data.getElementsByTagName("style").item(0).cloneNode(true));
        }
      }
    }, {
      key: "addShadowStyle",
      value: function addShadowStyle(shadow) {
        if (this.shadowCSS) {
          shadow.innerHTML = "<style>" + "@import url(\"" + this.shadowCSS + "\");</style>" + shadow.innerHTML;
        }
      }

      /* Add a user-defined set of behaviors to CETEIcean's processing
         workflow. Added behaviors will override predefined behaviors with the
         same name.
      */

    }, {
      key: "addBehaviors",
      value: function addBehaviors(bhvs) {
        if (bhvs["handlers"] || bhvs["fallbacks"]) {
          this.behaviors.push(bhvs);
        } else {
          console.log("No handlers or fallback methods found.");
        }
      }

      /* Sets the base URL for the document. Used to rewrite relative links in the
         XML source (which may be in a completely different location from the HTML
         wrapper).
       */

    }, {
      key: "setBaseUrl",
      value: function setBaseUrl(base) {
        this.base = base;
      }

      // "private" method

    }, {
      key: "_fromTEI",
      value: function _fromTEI(TEI_dom) {
        var root_el = TEI_dom.documentElement;
        this.els = new Set(Array.from(root_el.getElementsByTagName("*"), function (x) {
          return x.tagName;
        }));
        this.els.add(root_el.tagName); // Add the root element to the array
      }

      // private method

    }, {
      key: "_insert",
      value: function _insert(elt, strings) {
        if (elt.createShadowRoot) {
          var shadow = elt.createShadowRoot();
          this.addShadowStyle(shadow);
          shadow.innerHTML += strings[0] + elt.innerHTML + (strings[1] ? strings[1] : "");
        } else {
          var span = void 0;
          if (strings.length > 1) {
            if (strings[0].includes("<") && strings[1].includes("</")) {
              elt.innerHTML = strings[0] + elt.innerHTML + strings[1];
            } else {
              elt.innerHTML = "<span>" + strings[0] + "</span>" + elt.innerHTML + "<span>" + strings[1] + "</span>";
            }
          } else {
            if (strings[0].includes("<")) {
              elt.innerHTML = strings[0] + elt.innerHTML;
            } else {
              elt.innerHTML = "<span>" + strings[0] + "</span>" + elt.innerHTML;
            }
          }
        }
      }

      // private method

    }, {
      key: "_template",
      value: function _template(str, elt) {
        var result = str;
        if (str.search(/$(\w*)@(\w+)/)) {
          var re = /\$(\w*)@(\w+)/g;
          var replacements = void 0;
          while (replacements = re.exec(str)) {
            if (elt.hasAttribute(replacements[2])) {
              if (replacements[1] && this[replacements[1]]) {
                result = result.replace(replacements[0], this[replacements[1]].call(this, elt.getAttribute(replacements[2])));
              } else {
                result = result.replace(replacements[0], elt.getAttribute(replacements[2]));
              }
            }
          }
        }
        return result;
      }
    }, {
      key: "tagName",
      value: function tagName(name) {
        if (name == "egXML") {
          return "teieg-" + name;
        } else {
          return "tei-" + name;
        }
      }

      /* Takes a template in the form of an array of 1 or 2 strings and
         returns a closure around a function that can be called as
         a createdCallback or applied to an individual element.
          Called by the getHandler() and getFallback() methods
      */

    }, {
      key: "decorator",
      value: function decorator(strings) {
        return function () {
          var ceteicean = this;
          return function (elt) {
            var copy = [];
            if (this != ceteicean) {
              elt = this;
            }
            for (var i = 0; i < strings.length; i++) {
              copy.push(ceteicean._template(strings[i], elt));
            }
            ceteicean._insert(elt, copy);
          };
        };
      }

      /* Returns the handler function for the given element name
          Called by registerAll().
       */

    }, {
      key: "getHandler",
      value: function getHandler(fn) {
        for (var i = this.behaviors.length - 1; i >= 0; i--) {
          if (this.behaviors[i]["handlers"][fn]) {
            if (Array.isArray(this.behaviors[i]["handlers"][fn])) {
              return this.decorator(this.behaviors[i]["handlers"][fn]);
            } else {
              return this.behaviors[i]["handlers"][fn];
            }
          }
        }
      }

      /* Returns the fallback function for the given element name.
          Called by fallback().
       */

    }, {
      key: "getFallback",
      value: function getFallback(fn) {
        for (var i = this.behaviors.length - 1; i >= 0; i--) {
          if (this.behaviors[i]["fallbacks"][fn]) {
            if (Array.isArray(this.behaviors[i]["fallbacks"][fn])) {
              return this.decorator(this.behaviors[i]["fallbacks"][fn]).call(this);
            } else {
              return this.behaviors[i]["fallbacks"][fn];
            }
          } else if (this.behaviors[i]["handlers"][fn] && Array.isArray(this.behaviors[i]["handlers"][fn])) {
            // if there's a handler template, we can construct a fallback function
            return this.decorator(this.behaviors[i]["handlers"][fn]).call(this);
          } else if (this.behaviors[i]["handlers"][fn] && this.behaviors[i]["handlers"][fn].call(this).length == 1) {
            return this.behaviors[i]["handlers"][fn].call(this);
          }
        }
      }

      /* Registers the list of elements provided with the browser.
          Called by makeHTML5(), but can be called independently if, for example,
         you've created Custom Elements via an XSLT transformation instead.
       */

    }, {
      key: "registerAll",
      value: function registerAll(names) {
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = names[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var name = _step4.value;

            var proto = Object.create(HTMLElement.prototype);
            var fn = this.getHandler(name);
            if (fn) {
              proto.createdCallback = fn.call(this);
            }
            var prefixedName = this.tagName(name);
            try {
              document.registerElement(prefixedName, { prototype: proto });
            } catch (error) {
              console.log(prefixedName + " couldn't be registered or is already registered.");
              console.log(error);
            }
          }
        } catch (err) {
          _didIteratorError4 = true;
          _iteratorError4 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion4 && _iterator4.return) {
              _iterator4.return();
            }
          } finally {
            if (_didIteratorError4) {
              throw _iteratorError4;
            }
          }
        }
      }

      /* Provides fallback functionality for browsers where Custom Elements
         are not supported.
          Like registerAll(), this is called by makeHTML5(), but can be called
         independently.
      */

    }, {
      key: "fallback",
      value: function fallback(names) {
        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;

        try {
          for (var _iterator5 = names[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var name = _step5.value;

            var fn = this.getFallback(name);
            if (fn) {
              var _iteratorNormalCompletion6 = true;
              var _didIteratorError6 = false;
              var _iteratorError6 = undefined;

              try {
                for (var _iterator6 = Array.from(this.dom.getElementsByTagName(this.tagName(name)))[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                  var elt = _step6.value;

                  fn.call(this, elt);
                }
              } catch (err) {
                _didIteratorError6 = true;
                _iteratorError6 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion6 && _iterator6.return) {
                    _iterator6.return();
                  }
                } finally {
                  if (_didIteratorError6) {
                    throw _iteratorError6;
                  }
                }
              }
            }
          }
        } catch (err) {
          _didIteratorError5 = true;
          _iteratorError5 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion5 && _iterator5.return) {
              _iterator5.return();
            }
          } finally {
            if (_didIteratorError5) {
              throw _iteratorError5;
            }
          }
        }
      }

      /**********************
       * Utility functions  *
       **********************/

      /* Takes a relative URL and rewrites it based on the base URL of the
         HTML document */

    }, {
      key: "rw",
      value: function rw(url) {
        if (!url.match(/^(?:http|mailto|file|\/|#).*$/)) {
          return this.base + url;
        } else {
          return url;
        }
      }

      /* Given a space-separated list of URLs (e.g. in a ref with multiple
         targets), returns just the first one.
       */

    }, {
      key: "first",
      value: function first(urls) {
        return urls.replace(/ .*$/, "");
      }
    }, {
      key: "serialize",
      value: function serialize(el, stripElt) {
        var str = "";
        if (!stripElt) {
          str += "&lt;" + el.getAttribute("data-teiname");
          var _iteratorNormalCompletion7 = true;
          var _didIteratorError7 = false;
          var _iteratorError7 = undefined;

          try {
            for (var _iterator7 = Array.from(el.attributes)[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
              var attr = _step7.value;

              if (!attr.name.startsWith("data-") && !["id", "lang", "class"].includes(attr.name)) {
                str += " " + attr.name + "=\"" + attr.value + "\"";
              }
            }
          } catch (err) {
            _didIteratorError7 = true;
            _iteratorError7 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion7 && _iterator7.return) {
                _iterator7.return();
              }
            } finally {
              if (_didIteratorError7) {
                throw _iteratorError7;
              }
            }
          }

          if (el.children.length > 0) {
            str += ">";
          } else {
            str += "/>";
          }
        }
        var _iteratorNormalCompletion8 = true;
        var _didIteratorError8 = false;
        var _iteratorError8 = undefined;

        try {
          for (var _iterator8 = Array.from(el.childNodes)[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
            var node = _step8.value;

            if (node.nodeType == Node.ELEMENT_NODE) {
              str += this.serialize(node);
            } else {
              str += node.nodeValue;
            }
          }
        } catch (err) {
          _didIteratorError8 = true;
          _iteratorError8 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion8 && _iterator8.return) {
              _iterator8.return();
            }
          } finally {
            if (_didIteratorError8) {
              throw _iteratorError8;
            }
          }
        }

        if (!stripElt && el.children.length > 0) {
          str += "&lt;" + el.getAttribute("data-teiname") + ">";
        }
        return str;
      }

      // public method

    }, {
      key: "fromODD",
      value: function fromODD() {
        // Place holder for ODD-driven setup.
        // For example:
        // Create table of elements from ODD
        //    * default HTML behaviour mapping on/off (eg tei:div to html:div)
        //    ** phrase level elements behave like span (can I tell this from ODD classes?)
        //    * optional custom behaviour mapping
      }
    }]);
    return CETEI;
  }();

  // Make main class available to pre-ES6 browser environments


  try {
    if (window) {
      window.CETEI = CETEI;
    }
  } catch (e) {
    // window not defined;
  }

  return CETEI;

}());