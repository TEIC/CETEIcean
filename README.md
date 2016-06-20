# CETEIcean 🐳
/sɪˈti:ʃn/
## What is this?
**tl;dr**: CETEIcean lets you display unmodified TEI documents in a web browser!
Examplesmay be found  [here](http://teic.github.io/CETEIcean/).

CETEIcean is a Javascript (ES6) library that allows [TEI](http://tei-c.org)
documents to be displayed in a web browser without converting them to
HTML. It uses the emerging [Web Components](http://webcomponents.org) standards,
especially [Custom Elements](http://w3c.github.io/webcomponents/spec/custom/),
and [Shadow DOM](http://w3c.github.io/webcomponents/spec/shadow/). It works by
loading the TEI file dynamically, renaming the elements to follow the
Custom Elements conventions, and registering them with the browser. Browsers
that support Web Components will use them to add the appropriate display and
behaviors to the TEI elements; other browsers will use fallback methods to
achieve the same result.

CETEIcean was inspired by
[TEI Boilerplate](https://github.com/GrantLS/TEI-Boilerplate),
which also displays TEI in the browser, but differs from it in a couple of
important ways. It does not rely on an in-browser XSLT transformation, triggered
by an XSLT directive in the source, meaning no modification to the source XML is
necessary for it to work. Because it follows the Custom Elements standard, the
HTML it produces is valid and there are no possibilities of element name
collisions (like HTML `<p>` vs. TEI `<p>` for example). As with Boilerplate, the
HTML5 document displayed in the browser is isomorphic to the TEI source, meaning
behaviors can be added that leverage the richness of the TEI model.

## Usage

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
