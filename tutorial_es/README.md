# Getting Started with CETEIcean
# Introducción a la publicación de archivos TEI con CETEIcean

Nota: para comprender este tutorial, debes saber qué es el lenguaje de marcado XML-TEI desarrollado por la [Text Encoding Initiative o TEI] (https://tei-c.org/) y cuál es su función como lenguaje estándar en la edición digital académica de textos de Ciencias Sociales y Humanidades. Algunos recursos en español sobre la TEI en [TTHub] (https://tthub.io/).

Este tutorial te guiará a través de los pasos necesarios para publicar un archivo TEI en línea utilizando [CETEIcean] (https://github.com/TEIC/CETEIcean), una librería de Javascript que permite que los documentos TEI se muestren en un navegador web sin transformarlos primero a HTML. CETEIcean funciona cargando el archivo TEI dinámicamente, cambiando el nombre de los elementos para seguir las convenciones de elementos personalizados y registrándolos con el navegador. Comenzaremos con un archivo simple (aunque un tanto extenso) en formato TEI P5, `fpn-washington.xml`, que queremos hacer visible en un navegador web.

En primer lugar, una aclaración sobre la visualización de tu trabajo: El método por defecto de CETEIcean para mostrar archivos TEI consiste en cargar los archivos desde otra ubicación. No todos los navegadores te permitirán hacer esto cuando abras un archivo HTML directamente en el explorador de archivos de tu computadora. Puedes hacer el intento, pero si eso no funciona, tendrás que generar un servidor local, colocar los archivos en un servidor en línea, o utilizar un editor de texto con funciones de previsualización. El editor de texto [Atom](https://atom.io), con el plugin `atom-html-preview` es el ejemplo que utilizaremos para este tutorial, pero existen otras opciones. Debes descargar e instalar Atom, o algún editor de texto equivalente, antes de comenzar este tutorial. Un editor de texto es diferente de otros procesadores de texto usuales, como LibreOffice o Word, ya que, a diferencia de los segundos, los primeros editan solo archivos de texto plano.

Comenzaremos por establecer una estructura de directorios para nuestros archivos. Puedes copiar la estructura de este tutorial, que se ve de la siguiente forma:

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


En el directorio raíz crea un archivo `index.html`, con el siguiente contenido:

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

Este archivo servirá como una estructura en la cual pondremos las instrucciones para mostrar nuestro archivo TEI. Al igual que en TEI, los archivos HTML tienen un encabezado, llamado `head` y un cuerpo de texto, llamado `body`.  Agregaremos enlaces a nuestra [CSS] (Cascading Style Sheets, en español, hoja de estilo u hoja de estilos en cascada) (https://es.wikipedia.org/wiki/Hoja_de_estilos_en_cascada) y a archivos de [JavaScript] (https://es.wikipedia.org/wiki/JavaScript), y escribiremos un poco de JavaScript para hacer que CETEIcean funcione. En la primera línea vacía del `<head>`, escribe:

```html
  <link rel="stylesheet" href="css/tei.css">
```


Esto conectará nuestro archivo CSS con nuestra página HTML, dándole acceso a las directivas de estilo que este contiene (solo hay unas pocas, pero añadiremos más). A continuación, incluiremos la librería de CETEIcean, añadiendo la siguiente línea luego del enlace a la hoja de estilo:

```html
  <script src="js/CETEI.js"></script>
```


Ahora ya estamos listos para cargar el archivo. Añade otro elemento `<script></script>` a tu archivo `index.html`, esta vez sin el atributo `@src` (porque vamos a poner el script dentro de él). 

En el interior de tu nuevo elemento 'script', añade estas líneas:

```js
  let c = new CETEI();
  c.getHTML5('fpn-washington.xml', function(data) {
    document.getElementsByTagName("body")[0].appendChild(data);
  });
```

No necesitas ser un experto en JavaScript para usar CETEIcean, pero aprender su funcionamiento básico puede ser de utilidad. Si deseas incluir funciones avanzadas, tendrás que aprender JavaScript. En la red para desarrolladores de Mozilla puede encontrarse una excelente [guía de JavaScript](https://developer.mozilla.org/es/docs/Web/JavaScript/Guide) en varias lenguas, incluido el español. Las líneas de código que añadimos hacen varias cosas: en primer lugar, una variable, `c` es definida como un nuevo objeto CETEI. Esto hará el trabajo de cargar y darle estilo a nuestro archivo fuente. A continuación, le indicaremos a `c` que cargue el archivo fuente y lo convierta en HTML (Custom Elements), y también le daremos una función que tomará los resultados y los pondrá en el `<body>`de nuestro archivo index.html. `document.getElementsByTagName('body')` llama a una función disponible en objeto `document` (`document` es el documento HTML cargado en el navegador) que busca todos los elementos 'body' y los devuelve en la forma de una lista ordenada (una lista a través de la cual se puede acceder a los miembros que la componen a través de su número índice). Solo hay un elemento 'body', por lo que obtendremos una sola entrada en nuestra lista, con el índice 0. Este ítem, que es un elemento HTML, queda adjunto como un hijo del documento TEI que acabamos de cargar. 

En este punto, si estás usando Atom, deberías poder ejecutar una previsualización del HTML desde el menú *Packages* y así ver tu documento. Si no estás usando Atom, puedes hacer esto colocando tus archivos en un servidor web. Si conoces el funcionamiento de GitHub, puedes utilizar GitHub Pages (aquí tienes un [tutorial](https://guides.github.com/features/pages/) en inglés) y crear un repositorio. Si tienes instalado Python en tu computadora, puedes ejecutar un servidor web simple en el directorio de este tutorial con el comando: 

```bash
python -m SimpleHTTPServer
```

También es posible que tu computadora ya tenga los programas necesarios para ejecutar un servidor web, o puedes instalar [MAMP](https://www.mamp.info) o algún otro programa similar.

Esta primera visualización tendrá varios errores que deberemos arreglar. Comenzaremos por añadir una hoja de estilo o CSS para manipular los elementos de TEI en nuestro archivo y luego añadiremos funciones de CETEIcean para hacer modificaciones más complejas. Si todavía no le has echado un vistazo al archivo fuente XML, es un buen momento para hacerlo, para ver lo que CETEIcean ya está haciendo y lo que no. Notarás que las imágenes con gráficos están siendo cargadas correctamente (siempre que estés en línea, ya que las imágenes están alojadas en un sitio web). Podemos ver que el contenido del `teiHeader` no está siendo mostrado, y tampoco los comienzos de página y comienzos de línea, pero los elementos `div` y `p` están siendo formateados como bloques. Con un poco de investigación sobre las posibilidades de codificación de la TEI, verás que hay 19 tipos de elementos TEI en el 'body' de nuestro documento fuente:  

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
 

Algunos de estos elementos pueden no necesitar estilos o comportamientos especiales, pero otros definitivamente lo necesitarán.
Echa un vistazo al archivo `tei.css` de la carpeta `css/`. Como puedes ver, por ahora tiene unas pocas reglas:

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


Algunas cosas para tener en cuenta: los nombres de los elementos en nuestros selectores CSS tienen el prefijo “tei-”, esto es necesario para que CETEIcean pueda convertir los elementos de TEI en elementos personalizados (Custom Elements) de HTML. Estas reglas establecen que los elementos div se visualicen como bloques (empiezan en una nueva línea y terminan con un corte), lo mismo sucede con los párrafos, que también tienen un espaciado superior y posterior. Decidir qué estilos aplicar a los elementos que todavía no tienen reglas de estilo puede no resultar sencillo, pero podemos comenzar eligiendo algunos de los casos más simples. El documento fuente utiliza listas para la tabla de contenido y los índices, siempre con el atributo `@type="simple"`. Podemos usar CSS para darle formato a esas listas. Añade lo siguiente en el archivo `tei.css`:

```css
tei-list[type=simple] {
  list-style-type: none;
}
tei-list[type=simple]>tei-item {
  display: list-item;
}
```
The first selector will match `<tei-list type="simple">` elements and specifies that list items should not be decorated with bullets or numbers. The second identifies `<tei-item>` elements as list items (like `<li>` in HTML). If you make this change and reload your preview, you will see that the table of contents is now formatted as a list. You can experiment with adding margins and other styles to make it look better. The `<hi rend="italics">` elements can be dealt with easily too:

El primer selector encuentra los elementos `<tei-list type="simple">` y especifica que los ítems de la lista no deben estar decorados con viñetas ni números. El segundo identifica los elementos `<tei-item>` como ítems de lista (como `<li>` en HTML). Si recargas la visualización de tu archivo en el navegador luego de realizar estos cambios, verás que el contenido de las tablas ahora tiene el formato de una lista. Puedes experimentar añadiendo márgenes y otras reglas de estilo para hacer que la presentación del archivo se vea mejor. También puedes darle formato al elemento `<hi rend="italics">`fácilmente: 

```css
tei-hi[rend=italics] {
  font-style: italic;
}
```
Line beginnings are a little trickier, and require a CSS "pseudo-selector":

Los comienzos de línea son un poco más complicados y requieren un “pseudo-selector” CSS:

```css
tei-lb:before {
  white-space: pre;
  content: "\A";
}
```
This tells the browser to insert a new-line character (the "\A") before each `<tei-lb>` and to treat it as preformatted text (as you would a block of code, for example). We have to do this because in HTML new lines are normally ignored for formatting purposes. There's more we can do with CSS, but this is a good point to look at where you might use CETEIcean behaviors for formatting instead. HTML has an element equivalent to `<lb/>`, the `<br>` element. What if we just put a `<br>` inside our `<tei-lb>`? We can do that by adding some behaviors. In your index.html, add the following between the first and second lines of the code in the `<script></script>` tags:

Esto le indica al navegador que inserte un carácter de nueva línea ("\A") por cada `<tei-lb>` y que lo trate como texto sin formato (como lo harías con una sección de código, por ejemplo). Tenemos que hacer esto porque en HTML las nuevas líneas son normalmente ignoradas a los propósitos del formato. Hay más cosas que se pueden hacer con CSS, pero este es un buen punto para ver en qué casos también podemos utilizar los comportamientos (behavoirs) de CETEIcean para dar formato. HTML tiene un elemento equivalente a `<lb/>`, el elemento `<br>` ¿Por qué no simplemente colocar un `<br>` en nuestro `<tei-lb>`? Podemos hacer esto añadiendo algunos comportamientos. En tu archivo index.html añade lo siguiente entre la primera y la segunda línea del código que se encuentra entre as etiquetas `<script></script>`:

```js
  let behaviors = {
    "tei": {
      "lb": ["<br>"],
    }
  };
  c.addBehaviors(behaviors);
```
What this will do is create a Javascript object and assign it to a variable, `behaviors`, which we then pass to the `CETEI` object we created earlier, using the `addBehaviors` method. Inside that behaviors object, we have a section labeled "tei" (which is the prefix for all of our Custom Elements), and inside that, we define behaviors for elements. When CETEIcean sees a match for an element name, like "lb" (note that it uses the un-prefixed TEI name), it applies what it finds. For "lb", it sees an Array with one element, `<br>`, so it will insert that `<br>` tag before the content of any `<tei-lb>` element it finds. `<tei-lb>` is an empty element anyway, so the final result as seen by the browser will be

Esto creará un objeto Javascript y le asignará la variable `behaviors`, que luego enlazaremos con el objeto `CETEI` que creamos antes, usando el método `addBehaviors`. En el interior de ese objeto tenemos una sección etiquetada como “tei” (que es el prefijo para todos nuestros elementos personalizados), y dentro de esta se definen los comportamientos para los elementos. Cuando CETEIcean encuentra una coincidencia para el nombre de un elemento, como “lb” (ten en cuenta que se utiliza el nombre de TEI sin el prefijo), aplica los comportamientos que encuentra. Para “lb”, por ejmplo, encuentra un vector (Array) con otro elemento, `<br>`, por lo que insertará la etiqueta `<br>` antes de contenido de cualquier elemento `<tei-lb>` que encuentre. `<tei-lb>` es un elemento vacío de cualquier forma, por lo que el resultado final para el navegador será:

```html
<tei-lb><br></tei-lb>
```

The browser will not know what to do with `<tei-lb>` and so will ignore it, but it will know what to do with `<br>`, and will display it as a new line. Note that if you use the behavior, you won't want the CSS rule for `tei-lb`, or you'll get two line breaks for every one in your source.

El navegador no sabrá qué hacer con el elmento `<tei-lb>`, así que lo ignorará, pero sí sabe cómo interpretar el elemento `<br>` y lo mostrará como una nueva línea. Ten en cuenta que si utilizas este comportamiento, no debes añadir una regla CSS para `tei-lb`, o terminarás obteniendo dos líneas nuevas por cada una en tu documento fuente.

Behaviors can get more complex than this. You may have noticed that our source document has `<div>` elements, which nest, and which may have `<head>` elements. In HTML, the convention is to represent different levels of header with `h1`, `h2`, `h3`, and so on (up to `h6`). We can do this using a more sophisticated behavior:

Los comportamientos puedes ser más complejos que esto. Quizás hayas notado que nuestro documento fuente tiene elementos `<div>` que contienen otros `<div>` y pueden tener elementos `<head>`. En HTML, la convención es representar los diferentes niveles de encabezados con los elementos `h1`, `h2`, `h3`, etc. (hasta `h6`). Podemos lograr esto utilizando un comportamiento más complejo:

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

Este nuevo comportamiento para encabezados está haciendo algo diferente. Toma una función de JavaScript en lugar de un vector. Lo que hace que el elemento sea procesado como un parámetro (el `e`). Esto crea la variable `level`, que contiene el nivel de encabezamiento de la `<tei-div>` que contiene el `<tei-head>`, crea un elemento `<h[nivel]>` con el nivel correspondiente, y copia el contenido del elemento original en el nuevo elemento de encabezado. CETEIcean esconderá el contenido de `<tei-head>` y en cambio mostrará el contenido del nuevo elemento de encabezado. Te en cuenta que este código tiene un problema potencial: un documento con muchas divisiones anidadas unas dentro de otras podría llegar a producir un elemento de encabezado superior al límite admitido por HTML (por ejemplo un elemento `<h7>`). Nuestro documento fuente no tiene más de tres niveles de anidamiento, pero para utilizarlo en otras fuentes sería prudente revisar que el anidamiento no supere el nivel del elemento `<h6>`.

CETEIcean has a number of built-in behaviors, which is why it was able to deal with TEI `<graphic>`s, for example, without any work on our part. You can replace or switch off built-in behaviors by adding matches for them. If you want to display the contents of the TEI Header, which is hidden by default, you can add:

CETEIcean posee una cantidad de comportamientos integrados, esto le permite procesar los elementos `<graphic>` de TEI, por ejemplo, sin necesidad de ninguna modificación de nuestra parte. Puedes reemplazar o desactivar estos comportamientos integrados añadiéndoles valores. Si deseas mostrar el contenido del TEI Header, que está oculto por defecto, puedes añadir: 

```js
  "teiHeader": null,
```
to your behaviors object. You will want to add CSS styles or behaviors to cope with the header contents if you do so. 

a tus objetos de comportamiento. Si haces esto, puede que desees agregar estilos de CSS o comportamientos para elegir la forma en la que se visualizará el contenido del TEI Header en el navegador.

We will not work through all of the possibilites for our source document in this tutorial. You should experiment and decide how you want to represent the source's markup. A more fully worked out example is available in the [example/](example) folder, and the original HTML version and TEI P4 source may be found at <https://docsouth.unc.edu/fpn/washington/menu.html>.

En este tutorial no agotamos todas las posibilidades de trabajo con nuestro documento fuente. Te recomendamos que experimentes por tu cuenta en las diferentes formas en las que un marcado de TEI puede visualizarse en un navegador usando CETEICean. Puedes encontrar un ejemplo más acabado en la carpeta [example/](example), y la versión HTML y la fuente TEI P4 están disponibles en <https://docsouth.unc.edu/fpn/washington/menu.html>. 
