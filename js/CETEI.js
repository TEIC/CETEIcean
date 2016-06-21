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
      "ptr": function ptr(proto) {
        var self = this;
        proto.createdCallback = function () {
          var shadow = this.createShadowRoot();
          var link = document.createElement("a");
          link.innerHTML = this.getAttribute("target");
          link.href = self.rewriteRelativeUrl(this.getAttribute("target"));
          shadow.appendChild(link);
        };
      },
      "ref": function ref(proto) {
        var self = this;
        proto.createdCallback = function () {
          var shadow = this.createShadowRoot();
          var link = document.createElement("a");
          link.innerHTML = this.innerHTML;
          link.href = self.rewriteRelativeUrl(this.getAttribute("target"));
          shadow.appendChild(link);
        };
      },
      "graphic": function graphic(proto) {
        var self = this;
        proto.createdCallback = function () {
          var shadow = this.createShadowRoot();
          var img = new Image();
          img.src = self.rewriteRelativeUrl(this.getAttribute("url"));
          if (this.hasAttribute("width")) {
            img.width = this.getAttribute("width").replace(/[^.0-9]/g, "");
          }
          if (this.hasAttribute("height")) {
            img.height = this.getAttribute("height").replace(/[^.0-9]/g, "");
          }
          shadow.appendChild(img);
        };
      }
    },
    "fallbacks": {
      "ptr": function ptr() {
        var self = this;
        var elts = this.dom.getElementsByTagName("tei-ptr");
        for (var i = 0; i < elts.length; i++) {
          var content = document.createElement("a");
          var elt = elts[i];
          content.setAttribute("href", elt.getAttribute("target"));
          content.innerHTML = elt.getAttribute("target");
          elt.appendChild(content);
          elt.addEventListener("click", function (event) {
            window.location = self.rewriteRelativeUrl(this.getAttribute("target"));
          });
        }
      },
      "ref": function ref() {
        var self = this;
        var elts = this.dom.getElementsByTagName("tei-ref");
        for (var i = 0; i < elts.length; i++) {
          elts[i].addEventListener("click", function (event) {
            window.location = self.rewriteRelativeUrl(this.getAttribute("target"));
          });
        }
      },
      "graphic": function graphic() {
        var self = this;
        var elts = this.dom.getElementsByTagName("tei-graphic");
        for (var i = 0; i < elts.length; i++) {
          var content = new Image();
          var elt = elts[i];
          content.src = self.rewriteRelativeUrl(this.getAttribute("url"));
          if (elt.hasAttribute("width")) {
            content.width = elt.getAttribute("width").replace(/[^.0-9]/g, "");
          }
          if (elt.hasAttribute("height")) {
            content.height = elt.getAttribute("height").replace(/[^.0-9]/g, "");
          }
          elt.appendChild(content);
        }
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
        this.base = window.location.href.replace(/\/[^\/]*$/, "/");
      }
      var methods = Object.getOwnPropertyNames(CETEI.prototype);
      this.behaviors.push(behaviors);
    }

    // public method


    babelHelpers.createClass(CETEI, [{
      key: 'getHTML5',
      value: function getHTML5(TEI_url, callback) {
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
        }).then(function (TEI) {
          _this.makeHTML5(TEI, callback);
        }).catch(function (reason) {
          // TODO: better error handling?
          console.log(reason);
        });

        return promise;
      }
    }, {
      key: 'makeHTML5',
      value: function makeHTML5(TEI, callback) {
        var _this2 = this;

        // TEI is assumed to be a string
        var TEI_dom = new window.DOMParser().parseFromString(TEI, "text/xml");

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
              newElement = document.createElement("teieg-" + el.tagName);
              break;
            default:
              newElement = document.importNode(el, false);
              copy = true;
          }
          // Copy attributes; @xmlns, @xml:id, @xml:lang, and
          // @rendition get special handling.
          for (var i = 0, arr = Array.from(el.attributes); i < arr.length; i++) {
            var att = arr[i];
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
          for (var _i = 0, _arr = Array.from(el.childNodes); _i < _arr.length; _i++) {
            var node = _arr[_i];
            if (node.nodeType == Node.ELEMENT_NODE) {
              newElement.appendChild(convertEl(node));
            } else {
              newElement.appendChild(node.cloneNode());
            }
          }
          // Turn <rendition scheme="css"> elements into HTML styles
          if (el.localName == "tagsDecl") {
            var style = document.createElement("style");
            for (var _i2 = 0, _arr2 = Array.from(el.childNodes); _i2 < _arr2.length; _i2++) {
              var _node = _arr2[_i2];
              if (_node.nodeType == Node.ELEMENT_NODE && _node.localName == "rendition" && _node.getAttribute("scheme") == "css") {
                var rule = "";
                if (_node.hasAttribute("selector")) {
                  //rewrite element names in selectors
                  rule += _node.getAttribute("selector").replace(/([^#, >]+\w*)/g, "tei-$1").replace(/#tei-/g, "#") + "{\n";
                  rule += _node.textContent;
                } else {
                  rule += "." + _node.getAttribute("xml:id") + "{\n";
                  rule += _node.textContent;
                }
                rule += "\n}\n";
                style.appendChild(document.createTextNode(rule));
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
          return newElement;
        };

        this.dom = convertEl(TEI_dom.documentElement);

        if (document.registerElement) {
          this.registerAll(this.els);
        } else {
          this.fallback(this.els);
        }

        if (callback) {
          callback(this.dom);
        } else {
          return this.dom;
        }
      }
    }, {
      key: 'addStyle',
      value: function addStyle(doc, data) {
        if (this.hasStyle) {
          doc.getElementsByTagName("head").item(0).appendChild(data.getElementsByTagName("style").item(0).cloneNode(true));
        }
      }

      // public method

    }, {
      key: 'addBehaviors',
      value: function addBehaviors(bhvs) {
        if (bhvs["handlers"] || bhvs["fallbacks"]) {
          this.behaviors.push(bhvs);
        } else {
          console.log("No handlers or fallback methods found.");
        }
      }
    }, {
      key: 'decorator',
      value: function decorator(fn, strings) {
        return function () {
          var elts = this.dom.getElementsByTagName("tei-" + fn);
          for (var i = 0; i < elts.length; i++) {
            var elt = elts[i];
            var span = document.createElement("span");
            span.innerHTML = strings[0];
            if (elt.insertAdjacentElement) {
              elt.insertAdjacentElement("afterbegin", span);
            } else {
              if (elt.firstChild) {
                elt.insertBefore(span, elt.firstChild);
              } else {
                elt.appendChild(span);
              }
            }

            if (strings.length > 1) {
              span = document.createElement("span"), span.innerHTML = strings[1];
              elt.appendChild(span);
            }
          }
        };
      }
    }, {
      key: 'getHandler',
      value: function getHandler(fn) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = this.behaviors.reverse()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var b = _step.value;

            if (b["handlers"][fn]) {
              if (Array.isArray(b["handlers"][fn])) {
                return this.decorator(fn, b["handlers"][fn]);
              } else {
                return b["handlers"][fn];
              }
            }
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
      }
    }, {
      key: 'getFallback',
      value: function getFallback(fn) {
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = this.behaviors.reverse()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var b = _step2.value;

            if (b["fallbacks"][fn]) {
              if (Array.isArray(b["fallbacks"][fn])) {
                return this.decorator(fn, b["fallbacks"][fn]);
              } else {
                return b["fallbacks"][fn];
              }
            } else if (b["handlers"][fn] && Array.isArray(b["handlers"][fn])) {
              return this.decorator(fn, b["handlers"][fn]);
            } else if (b["handlers"][fn] && b["handlers"][fn].length == 0) {
              //handler doesn't use element registration callback
              return b["handlers"][fn];
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
      }
    }, {
      key: 'registerAll',
      value: function registerAll(names) {
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = names[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var name = _step3.value;

            var proto = Object.create(HTMLElement.prototype);
            var fn = this.getHandler(name);
            if (fn) {
              fn.call(this, proto);
            }
            var prefixedName = "tei-" + name;
            try {
              document.registerElement(prefixedName, { prototype: proto });
            } catch (error) {
              console.log(prefixedName + " already registered.");
              console.log(error);
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
      }
    }, {
      key: 'fallback',
      value: function fallback(names) {
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = names[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var name = _step4.value;

            var fn = this.getFallback(name);
            if (fn) {
              fn.call(this);
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
    }, {
      key: 'setBaseUrl',
      value: function setBaseUrl(base) {
        this.base = base;
      }
    }, {
      key: 'rewriteRelativeUrl',
      value: function rewriteRelativeUrl(url) {
        if (!url.match(/^(?:http|mailto|file|\/).*$/)) {
          return this.base + url;
        } else {
          return url;
        }
      }

      // public method

    }, {
      key: 'fromODD',
      value: function fromODD() {}
      // Place holder for ODD-driven setup.
      // For example:
      // Create table of elements from ODD
      //    * default HTML behaviour mapping on/off (eg tei:div to html:div)
      //    ** phrase level elements behave like span (can I tell this from ODD classes?)
      //    * optional custom behaviour mapping


      // "private" method

    }, {
      key: '_fromTEI',
      value: function _fromTEI(TEI_dom) {
        var root_el = TEI_dom.documentElement;
        this.els = new Set(Array.from(root_el.getElementsByTagName("*"), function (x) {
          return x.tagName;
        }));
        this.els.add(root_el.tagName); // Add the root element to the array
      }
    }]);
    return CETEI;
  }();

  // Make main class available to pre-ES6 browser environments


  if (window) {
    window.CETEI = CETEI;
  }

  return CETEI;

}());