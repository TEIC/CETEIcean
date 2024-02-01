# Getting Started with CETEIcean and TEI Publishing

[CETEIcean](https://github.com/TEIC/CETEIcean) is a JavaScript program that makes it easy to publish (Text Encoding Initiative XML)[https://tei-c.org/release/doc/tei-p5-doc/en/html/index.html] files on the web. You will need some background in TEI and its uses in order to understand what CETEIcean is doing. Introductory materials can be found at [TEI by Example](https://teibyexample.org/).

This tutorial will walk you through the steps to publish a TEI file online using CETEIcean. We will start with a simple (though quite large) file in TEI P5 form, `fpn-washington.xml`, which we want to display in a web browser.

First, a note about viewing the results of your work: CETEIcean's default method for displaying TEI relies on loading a TEI file from another location. Not all browsers will allow you to do this when you view an HTML file directly on your file system. You should try it, but if it doesn't work, then you will have to run a web server, put your files on a web server, or use a text editor with preview capabilities. [Visual Studio Code](https://code.visualstudio.com/), with the `Html Preview` plugin is the example we will use for this tutorial, but there are many other options. You should download and install Visual Studio Code, or an equivalent text editor, before starting this tutorial. A text editor is different from other programs you may already use for editing 'text', such as LibreOffice or Word, in that it edits only plain text files.

We will start by setting up a directory structure for our files. You may simply want to copy the structure of this tutorial, which looks like:

```
  tutorial/
      |
       --- css/
            |
             --- tei.css
      |
       --- js/
            |
             --- CETEI.js
      |
       --- fpn-washington.xml
       --- README.md (the file you are reading)
```

Inside the root folder, create an `index.html` file, with the content:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  
</head>
<body>
  
</body>
</html>
```

This will serve as a shell into which we will put the instructions that will display our TEI file. Like TEI, HTML files have a header, named `head`, and a `body`. We will put links to our CSS (Cascading Style Sheets) and JavaScript files and write a bit of JavaScript to get CETEIcean running. In the first empty line in the `<head>`, type:

```html
  <link rel="stylesheet" href="css/tei.css">
```
This will link our CSS file to our HTML page, giving it access to the styling directives inside (there are only a few—we'll add more). Next, we'll link in the CETEIcean library by adding this line after the stylesheet link:
```html
  <script src="js/CETEI.js"></script>
```
Now we are ready to load our file. Add another `<script></script>` element to your `index.html` file, this time without a `@src` attribute (because we're going to put the script inside it).

Inside your new script element, add the lines:

```js
  let c = new CETEI();
  c.getHTML5('fpn-washington.xml', function(data) {
    document.getElementsByTagName("body")[0].appendChild(data);
  });
```

You don't need to be a JavaScript expert to use CETEIcean, but learning how the basics work will be helpful. If you want advanced behaviors, you will have to know JavaScript. An excellent guide is available from the [Mozilla Developer Network](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide) (MDN) in many languages. The lines of code above are doing a few things: first, a variable, `c` is defined as a new CETEI object. This will do the work of loading and styling our source file for us. Next, we tell `c` to load the source file and turn it into HTML Custom Elements, and we're also giving it a function that will take the results and put them into the `<body>` of our index.html file. `document.getElementsByTagName('body')` calls a function available on the built-in `document` object (`document` is the HTML document loaded into the browser) that finds all the body elements and returns them in an Array (a list whose members can be accessed by index number). There is only one body element, so we're getting the first item in the Array, at index 0. To that item, an HTML Element, we are appending as a child the TEI document we just loaded.

At this point, if you're using Visual Studio Code, you should be able to run HTML Preview with ctrl+shift+v or cmd+shift+v and see your document. You may need to disable security settings when prompted in order for this to work. If you aren't using Visual Studio Code, you can try putting your documents on a web server. If you're familiar with using GitHub, you can use GitHub Pages ([tutorial](https://docs.github.com/en/pages/quickstart)—you can skip the themes step and just use a repository with the tutorial you're reading in it). If you have Python 3 installed on your computer, you can run a simple web server in the tutorial directory with the command:
```bash
python3 -m http.server
```
If you have NodeJS installed, you can use:
```bash
npx serve
```
Your computer may also come with web serving capabilites built in, or you can install [MAMP](https://www.mamp.info) or something similar.

Your preview will have various things wrong with it that we will want to fix. We'll do this first by adding CSS to handle the TEI elements in our file, and then later we'll add some CETEIcean behaviors to do more sophisticated things. If you haven't already taken a look at the XML source file, you might want to do so now, to see what things CETEIcean is doing already, and what it isn't. You'll notice that figures with graphics are getting loaded properly (as long as you're online, because the pictures are hosted on a web site). The `teiHeader`'s content isn't being displayed. Page beginnings and line beginnings are being ignored, but `div`s and `p` elements are being formatted as blocks. A bit of investigation will tell you that there are 19 kinds of element in the body of our source document: 

 * div
 * head
 * p
 * pb
 * hi
 * figure
 * graphic
 * lb
 * sic
 * opener
 * dateline
 * closer
 * salute
 * signed
 * emph
 * lg
 * l
 * foreign
 * name. 
 
Some of these may not need any special styling or behaviors, but others definitely will.

Take a look at the `tei.css` file in the `css/` folder. As you can see, it only has a couple of rules so far:

```css
tei-div {
  display: block;
}
tei-p {
  display: block;
  margin-top: .5em;
  margin-bottom: .5em;
}
```
Some things to notice: the element names in our CSS selectors are prefixed with "tei-", which is what CETEIcean does to turn TEI elements into HTML Custom Elements. These rules mean divs are displayed as blocks (they start on a new line and are followed by a break at the end), as are paragraphs, and the latter also have some spacing before and after. Deciding what styles to apply to the currently unstyled elements may not always be easy, but we can begin by picking some simple cases. The source document uses lists for its table of contents and indices, always with `@type="simple"`. We can use CSS to format these as lists. Add the following to the `tei.css` file:
```css
tei-list[type=simple] {
  list-style-type: none;
}
tei-list[type=simple]>tei-item {
  display: list-item;
}
```
The first selector will match `<tei-list type="simple">` elements and specifies that list items should not be decorated with bullets or numbers. The second identifies `<tei-list>` elements as list items (like `<li>` in HTML). If you make this change and reload your preview, you will see that the table of contents is now formatted as a list. You can experiment with adding margins and other styles to make it look better. The `<hi rend="italics">` elements can be dealt with easily too:
```css
tei-hi[rend=italics] {
  font-style: italic;
}
```
Line beginnings are a little trickier, and require a CSS "pseudo-selector":
```css
tei-lb:before {
  white-space: pre;
  content: "\A";
}
```
This tells the browser to insert a new-line character (the "\A") before each `<tei-lb>` and to treat it as preformatted text (as you would a block of code, for example). We have to do this because in HTML new lines are normally ignored for formatting purposes. There's more we can do with CSS, but this is a good point to look at where you might use CETEIcean behaviors for formatting instead. HTML has an element equivalent to `<lb/>`, the `<br>` element. What if we just put a `<br>` inside our `<tei-lb>`? We can do that by adding some behaviors. In your index.html, add the following after the first line of the code in the `<script></script>` tags:
```js
  let behaviors = {
    "tei": {
      "lb": ["<br>"],
    }
  };
  c.addBehaviors(behaviors);
```
The code should now look like this:
```js
  let c = new CETEI();
  let behaviors = {
    "tei": {
      "lb": ["<br>"],
    }
  };
  c.addBehaviors(behaviors);
  c.getHTML5('fpn-washington.xml', function(data) {
    document.getElementsByTagName("body")[0].appendChild(data);
  });
```
This new code will create a Javascript object and assign it to a variable, `behaviors`, which we then pass to the `CETEI` object we created earlier, using the `addBehaviors` method. Inside that behaviors object, we have a section labeled "tei" (which is the prefix for all of our Custom Elements), and inside that, we define behaviors for elements. When CETEIcean sees a match for an element name, like "lb" (note that it uses the un-prefixed TEI name), it applies what it finds. For "lb", it sees an Array with one element, `<br>`, so it will insert that `<br>` tag before the content of any `<tei-lb>` element it finds. `<tei-lb>` is an empty element anyway, so the final result as seen by the browser will be
```html
<tei-lb><br></tei-lb>
```
The browser will not know what to do with `<tei-lb>` and so will ignore it, but it will know what to do with `<br>`, and will display it as a new line. Note that if you use the behavior, you won't want the CSS rule for `tei-lb`, or you'll get two line breaks for every one in your source.

Behaviors can get more complex than this. You may have noticed that our source document has `<div>` elements, which nest, and which may have `<head>` elements. In HTML, the convention is to represent different levels of header with `h1`, `h2`, `h3`, and so on (up to `h6`). We can do this using a more sophisticated behavior:
```js
  let behaviors = {
    "tei": {
      "head": function(e) {
        let level = document.evaluate("count(ancestor::tei-div)", e, null, XPathResult.NUMBER_TYPE, null);
        let result = document.createElement("h" + level.numberValue);
        for (let n of Array.from(e.childNodes)) {
          result.appendChild(n.cloneNode());
        }
        return result;
      },
      "lb": ["<br>"],
    }
  };
  c.addBehaviors(behaviors);
```
This new "head" behavior is doing something different. It takes a JavaScript function instead of an Array, which gets the element being processed as a parameter (the `e`). It creates a `level` variable, which contains the depth of the `<tei-div>` containing the `<tei-head>`, creates an `<h[level]>` element corresponding to the level, copies the content of the current element into it, and returns the new header element. CETEIcean will hide the content of the `<tei-head>` and show the heading element instead. Note that the code shown here has a potential bug: a very deeply nested document might produce, e.g. an `<h7>` element, which is not valid HTML. Our current source doesn't go more than three levels deep, but we might want to add a check ensure we don't go beyond `<h6>`.

CETEIcean has a number of built-in behaviors, which is why it was able to deal with TEI `<graphic>`s, for example, without any work on our part. You can replace or switch off built-in behaviors by adding matches for them. If you want to display the contents of the TEI Header, which is hidden by default, you can add:
```js
  "teiHeader": null,
```
to your behaviors object. You will want to add CSS styles or behaviors to cope with the header contents if you do so. 

We will not work through all of the possibilites for our source document in this tutorial. You should experiment and decide how you want to represent the source's markup. A more fully worked out example is available in the [example/](example) folder, and the original HTML version and TEI P4 source may be found at <https://docsouth.unc.edu/fpn/washington/menu.html>.







