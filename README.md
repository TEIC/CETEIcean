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
Custom Elements conventions, and registering them with the browser. Browsers
that support Web Components will use them to add the appropriate display and
behaviors to the TEI elements; other browsers will use fallback methods to
achieve the same result.

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

### Example
This code fetches a TEI file, transforms it into HTML Custom Elements, and places the result in a div with id "TEI".

```js
var CETEIcean = new CETEI()
CETEIcean.getHTML5("URL_TO_YOUR_TEI.xml", function(data) {
  document.getElementById("TEI").appendChild(data)
})
```


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
