# CETEIcean 🐳
/sɪˈti:ʃn/

[![Build Status](https://travis-ci.com/TEIC/CETEIcean.svg?branch=master)](https://travis-ci.com/TEIC/CETEIcean)

## What is this?
**tl;dr**: CETEIcean lets you display unmodified TEI documents in a web browser!
Examples may be found  [here](http://teic.github.io/CETEIcean/).

CETEIcean is a Javascript library that allows [TEI](http://tei-c.org)
documents to be displayed in a web browser without first transforming them to
HTML. It uses the emerging [Web Components](http://webcomponents.org) standards,
especially [Custom Elements](http://w3c.github.io/webcomponents/spec/custom/). It 
works by loading the TEI file dynamically, renaming the elements to follow the
Custom Elements conventions, and registering them with the browser.

Because it preserves the full structure and information from your TEI data model,
CETEIcean allows you to build rich web applications from your source documents
using standard tools like CSS and Javascript.

CETEIcean was inspired by
[TEI Boilerplate](https://github.com/GrantLS/TEI-Boilerplate),
which also displays TEI in the browser, but differs from it in a couple of
important ways. CETEIcean does not rely on an in-browser XSLT transformation, 
triggered by an XSLT directive in the source, so no modification to the source XML is
necessary for it to work. Because it follows the Custom Elements standard, the
HTML it produces is valid and there are no possibilities of element name
collisions (like HTML `<p>` vs. TEI `<p>` for example). 

## Usage

You can use CETEIcean in your projects just by grabbing the CETEI.js file from the latest [release](https://github.com/TEIC/CETEIcean/releases) and linking to it in an HTML file like the [examples](http://teic.github.io/CETEIcean/) do. Note that you'll want also to grab the example CSS or make your own. If you want to build and play with it on your own, follow the steps below.

### Simple Usage Example
This code fetches a TEI file, transforms it into HTML Custom Elements, and places the result in a div with id "TEI".

```js
var CETEIcean = new CETEI()
CETEIcean.getHTML5("URL_TO_YOUR_TEI.xml", function(data) {
  document.getElementById("TEI").appendChild(data)
})
```

By default, CETEIcean saves and restores the scroll position for a document via a URL fragment. To turn this behavior off, particularly when using CETEIcean for Server Side Rendering, you can set the `ignoreFragmentId` option to `true`:

```js
new CETEI({
  ignoreFragmentId: true
})
```

### Usage with Node

CETEIcean can be used on the server by providing a DOM implementation, such as [JSDOM](https://github.com/jsdom/jsdom). You can pass a document object as an option when instantiating CETEIcean.

```js
import { JSDOM } from 'jsdom';
import CETEI from 'CETEIcean';

const jdom = new JSDOM(`<TEI xmlns="http://www.tei-c.org/ns/1.0" />`, {contentType: 'text/xml'});
new CETEI({
  documentObject: jdom.window.document
})
```

### Other methods

#### getHTML5( url, callback, perElementFn )
Returns a Promise that fetches an XML source document then calls the makeHTML5 method on the returned document.

Parameters:
* `url`: The XML document will be fetched from the provided URL.
* `callback`: A function to be called on the results.
* `perElementFn`: A function to be called on each resulting element.

#### makeHTML5( XML, callback, perElementFn )
Converts the supplied XML string into HTML5 Custom Elements.

Parameters:
* `XML`: The XML document serialized to string.
* `callback`: A function to be called on the results.
* `perElementFn`: A function to be called on each resulting element.

#### domToHTML5( XML_dom, callback, perElementFn )
Converts the supplied XML string into HTML5 Custom Elements.

Parameters:
* `XML_dom`: The XML document as DOM.
* `callback`: A function to be called on the results.
* `perElementFn`: A function to be called on each resulting element.

#### unsetNamespace( ns )
To change a namespace to prefix mapping, the namespace must first be unset. Takes a namespace URI. In order to process a TEI P4 document, e.g., the TEI namespace must be unset before it can be set to the empty string.

#### setBaseUrl( base )
Sets the base URL for the document. Used to rewrite relative links in the XML source (which may be in a completely different location from the HTML wrapper).

### Install
Get [NodeJS](https://nodejs.org/).

Run
```
npm i
```

### Build
```
npm run build
```
puts a copy of CETEI.js in the `dist/` folder

### Develop
```
npm run dev
```
runs a local web server on port 8888. Browse to the examples in the `test/`
folder. Make changes and they'll show up when you reload.

### Use
Run the build process and then include the generated `CETEI.js` file in an HTML 
document like the simpleTest.html file in the `test/` folder. Or, use the 
server-side language and framework of your choice to generate such files on demand.

### Customize
TEI documents displayed using CETEIcean can be customized via CSS or by specifying
behaviors for individual elements. For documentation on behaviors see the 
[wiki](https://github.com/TEIC/CETEIcean/wiki/Anatomy-of-a-behaviors-object).
