# CETEIcean と TEI Publishing を始めるにあたって

[CETEIcean](https://github.com/TEIC/CETEIcean) は JavaScript のプログラムであり、Webでの (Text Encoding Initiative XML)[https://tei-c.org/release/doc/tei-p5-doc/en/html/index.html]  のファイル公開を簡単にできるようにするためのものです。CETEIceanが何をしているかを理解するためには、TEIとその活用に関する若干の背景知識が必要になります。入門的な資料は、 [TEI by Example](https://teibyexample.org/) でみつけられるはずです。 

このチュートリアルでは、CETEIceanを用いてTEIファイルを公開するための一連のステップを解説します。TEI P5の形式の（大きいですが）単純なファイル、`fpn-washington.xml`を用いて解説を始めます。我々はこのファイルをWebブラウザに表示することを目指します。

はじめに、作業結果の表示に関して留意していただきたい点があります。CETEIceanのデフォルトのTEI表示方法は、別の場所からTEIファイルを読み込むことに依存しています。この場合、ローカルのファイルシステム上のHTMLファイルを直接表示することになりますので、ブラウザによっては許可しない場合があります。まずは試してみていただくとよいのですが、うまくいかない場合は、Webサーバーを動かすか、ファイルをWebサーバーに置くか、プレビュー機能のあるテキストエディタを使うことになります。このチュートリアルでは、[Visual Studio Codo](https://code.visualstudio.com/) の `Html Preview` プラグインを使用しますが、他にも多くの選択肢があります。このチュートリアルを始める前に、Visual Studio Code または同等のテキストエディタをダウンロードし、インストールしておく必要があります。（あるいはPythonのような簡易HTTPサーバを稼働できるプログラミング言語でもよいです。）テキストエディタは、LibreOfficeやWordのような「テキスト」を編集するためのプログラムとは異なり、プレーンテキストファイルのみを編集するものです。

まず、今回のファイルのためのディレクトリ構造を設定することから始めましょう。このチュートリアルの構造をコピーして、次のようにするとよいでしょう。

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
       --- meros.xml       
       --- README.md (the file you are reading)
```

ルートのディレクトリ（フォルダ）に`index.html` というファイルを作成して、内容を以下のようにしてみてください：

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

これは、TEIファイルを表示するための命令を入れるシェルとして機能します。TEIと同様に、HTMLファイルには`head`と呼ばれるヘッダーと`body`があります。CSS (Cascading Style Sheets)とJavaScriptファイルへのリンクを置き、CETEIceanを動かすためのJavaScriptを少し書きます。では、`<head>`以下の最初の空白行に以下のように記述してください：

```html
  <link rel="stylesheet" href="css/tei.css">
```

これはCSSファイルをHTMLページにリンクし、そこに用意されたスタイル命令にアクセスできるようにします（まだ少ししかありませんが、これから追加していきます）。次に、スタイルシートのリンクの後に次の行を追加して、CETEIceanライブラリをリンクします：

```html
  <script src="js/CETEI.js"></script>
```

これでファイルを読み込む準備ができました。index.html` ファイルにもう一つ `<script></script>` 要素を追加します。ただし、今回は `@src` 属性は付けません (この中にスクリプトを入れるからです)。

今回作成した`<script>`エレメントの内側に、以下の行を追記してください：

```js
  let c = new CETEI();
  c.getHTML5('fpn-washington.xml', function(data) {
    document.getElementsByTagName("body")[0].appendChild(data);
  });
```

CETEIceanを使うにあたっては、JavaScriptの専門家である必要はありませんが、基本的な動作を学んでおくことは有用です。もし、高度な動作をさせたいのであれば、JavaScriptの知識が必要でしょう。優れたガイドが[Mozilla Developer Network](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide) (MDN)から多くの言語で提供されています。

では、上のコードの行を簡単に解説しておきましょう。上の行はいくつかのことを行っています：まず、変数 `c` が新しいCETEIオブジェクトとして定義されています。このオブジェクトはソースファイルの読み込みとスタイル指定を行なってくれます。次に、`c`にソースファイルを読み込んでHTMLカスタム要素に変換するように指示し、その結果を受け取ってindex.htmlファイルの`<body>`に配置する関数も与えています。`document.getElementsByTagName('body')` は組み込みの `document` オブジェクト (`document` はブラウザに読み込まれた HTML ドキュメント) で利用できる関数を呼び出して、すべての body 要素を見つけて Array (インデックス番号でアクセスできるリスト。Pythonで言うリストとほぼ同じ。) で返しています。body 要素はひとつだけなので、Array の1つ目（0から数えるので0番）にある項目を取得します。その項目であるHTML要素に、先ほど読み込んだTEIドキュメントを子要素として追加しています。

## TEI/XMLファイルをindex.htmlのJavscriptに読み込む

この時点で、Visual Studio Codeを使用している場合は、ctrl+shift+v か cmd+shift+v でHTMLプレビューを実行し、文書を見ることができるようになっているはずです。この機能を使用しようとしてプロンプトが表示されることがあれば、セキュリティ設定を無効にする必要がある場合があります。 Visual Studio Code を使っていない場合は、ドキュメントをウェブサーバーに置いてみるとよいでしょう。GitHub の使用に慣れているなら、GitHub Pages ([tutorial](https://guides.github.com/features/pages/)-テーマのステップをスキップして、読んでいるチュートリアルが入っているリポジトリだけを使うことができます) を使用することができます。Python 3がインストールされていれば、tutorialディレクトリで簡単なWebサーバをコマンドで実行することができます。

```bash
python3 -m http.server
```

あるいは、もし NodeJS をインストールしてある場合は以下のようにすることもできます：

```bash
npx serve
```

また、お使いのコンピュータにウェブサーバー機能が組み込まれている場合もありますし、[MAMP](https://www.mamp.info)などをインストールすることもできます。

現時点でのプレビューには様々な不具合があり、それを修正する必要があります。まず、CSSを追加してファイル内のTEI要素を処理することから始め、その後、CETEIceanの動作を追加してより洗練されたことを行うことにしましょう。もしまだXMLソースファイルをご覧になっていなければ、今すぐご覧になって、CETEIceanがすでに行っていることと、行っていないことを確認されるとよいでしょう。そうするとまず、画像付きの図が適切に読み込まれていることに気づくでしょう（画像がウェブサイトにホストされているため、オンラインの場合の話ですが）。teiHeader` のコンテンツは表示されないはずです。ページの始まりや行の始まりは無視されますが、`div`要素や`p`要素はブロックとしてフォーマットされます。少し調べると、ソースファイルの本文には19種類の要素があることがわかります：

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
 
これらの中には、特別なスタイルや動作が必要ないものと、絶対に必要なものがあります：

`css/` フォルダにある `tei.css` ファイルを見てみましょう。ご覧のように、今のところ2つのルールしかありません：

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
CSSセレクタの要素名には "tei "が付いていますが、これはCETEIceanがTEI要素をHTMLカスタム要素に変換するために行っていることです。これらのルールは、divがブロックとして表示され（新しい行で始まり、最後に改行される）、段落と同様に、後者も前後に多少のスペースを持つことを意味します。現在スタイルが設定されていない要素にどのようなスタイルを適用するかを決めるのは必ずしも容易ではありませんが、まずは簡単なケースをいくつか挙げてみましょう。ソースのXML文書では、目次と索引にリストを使っており、それらには常に `@type="simple"` が付いています。CSSを使って、これらをリストとしてフォーマットすることができます。以下を `tei.css` ファイルに追加してください：

```css
tei-list[type=simple] {
  list-style-type: none;
}
tei-list[type=simple]>tei-item {
  display: list-item;
}
```

上記のCSSの最初のセレクタ（tei-list[type=simple]の部分）は `<tei-list type="simple">` 要素にマッチし、リストアイテムが箇条書きや数字で装飾されてはならないことを「list-style-type: none」で指定しています。2 番目のセレクタ（tei-list[type=simple]>tei-itemの部分）は `<tei-list>` 要素をリストアイテムとして識別します (HTML の `<li>` と同じです)。この変更を行ってからプレビューを再読み込みすると、目次がリストとしてフォーマットされているのがわかると思います。余白や別のスタイルを追加して、見栄えをよくするために実験することもできます。また、`<hi rend="italics">` の要素も同様にして簡単に扱うことができます：
```css
tei-hi[rend=italics] {
  font-style: italic;
}
```

改行（Line beginning）はちょっとややこしく、CSSの「擬似セレクタ」が必要です：

```css
tei-lb:before {
  white-space: pre;
  content: "\A";
}
```

上記のものは、各 `<tei-lb>` の前に改行文字 (「 \A 」) を挿入し、(例えばコードのブロックのように) 整形されたテキストとして扱うようにブラウザに指示するものです。HTMLでは通常、改行は書式設定のために無視されるため、このようにしなければなりません。CSSでできることは他にもありますが、これはCETEIceanの振る舞い（behaviors）を書式設定のために使うことができるかどうかを検討する良いポイントになります。HTMLには`<lb/>`に相当する要素、`<br>`があります。もし、`<tei-lb>`の中に`<br>`を入れたらどうでしょうか？それは、いくつかの behaviors を追加することで可能です。index.html の `<script></script>` タグ内のコードの1行目と2行目の間に、次のように追加します：

```js
  let behaviors = {
    "tei": {
      "lb": ["<br>"],
    }
  };
  c.addBehaviors(behaviors);
```

上記のものは、Javascriptオブジェクトを作成し、変数 `behaviors` に代入しています。そして、 `addBehaviors` メソッドを使用して、先ほど作成した `CETEI` オブジェクト（つまり、変数 `c` ）にそれを渡します。behaviorsオブジェクトの中に、"tei"（すべてのカスタム要素のプレフィックス）というラベルの付いたセクションがあり、その中で要素のbehaviorsを定義しています。CETEIceanは "lb "のような要素名（接頭辞のないTEI名を使用していることに注意）にマッチするものを見つけると、それを適用します。`<lb/>`の場合には、1つの `<br>` 要素を含むリストを探し、そして、見つかった `<tei-lb>` 要素のコンテンツの前に `<br>` タグを挿入します。そして、ブラウザから見た最終的な結果は次のようになります：

```html
<tei-lb><br></tei-lb>
```
ブラウザは `<tei-lb>` が何をするものかわからないので無視しますが、`<br>` は何をするのかわかるので、改行として表示します。この挙動を利用する場合、`tei-lb`に対するCSSルールは必要ないことと、ソースファイルの中のすべての改行に対して2つの改行が付いてしまうことに注意してください。

Behaviors はこれよりもっと複雑にすることもできます。ソースファイルには `<div>` 要素があり、それらは入れ子になっていて、さらに `<head>` 要素を持つ場合があることにお気づきでしょう。HTML では、異なるレベルのヘッダーを `h1`、`h2`、`h3` などで表現します（最大で `h6` まで）。これをより洗練された動作で行うことができます。

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

上記の新しい「head」behaviorsは何か異なることをしています。Array の代わりに JavaScript の関数を使用し、パラメータとして処理される要素（`e`）を取得します。それは `<tei-head>` を含む `<tei-div>` の深さを含む `level` 変数を作り、そのレベルに対応する `<h[level]>` 要素を作り、現在の要素の内容をそこにコピーし、新しい header 要素を返します。CETEIceanは `<tei-head>` の内容を隠し、代わりにheading要素を表示します。ここで示したコードには潜在的なバグがあることに注意してください：非常に深くネストされたドキュメントでは、例えば `<h7>` 要素が生成されるかもしれませんが、それは有効なHTMLではありません。現在のソースは3階層以上にはなりませんが、`<h6>` 以上にならないようにするためのチェックを追加するとよいでしょう。

CETEIceanは多くのビルトイン動作を備えており、例えばTEIの`<graphic>`は、我々の側で何もしなくても処理されます。ビルトインされた動作にマッチを追加することで、ビルトインされた動作を置き換えたり、オフにしたりすることができます。もし、デフォルトでは隠されているTEI Headerの内容を表示したいのであれば、次の…

```js
  "teiHeader": null,
```

…をbehaviorsオブジェクトに追加してください。その際、ヘッダーの内容に対応するCSSスタイルやbehaviorsを追加しておくとよいでしょう。

## 日本語ファイルのための補足

`<ruby>`を適切に表示させたい場合、一度生成したHTMLを修正して表示する方法を`example/index_ja.html`に示してあります。もっと良い方法があるかもしれませんが、とりあえず一例として参照してください。


このチュートリアルでは、ソースファイルに関するすべての可能性を検討するわけではありません。ソースのマークアップをどのように表現するかは、実験して決めてください。より完全な例は [example/](example) フォルダーにあります。また、オリジナルの HTML バージョンと TEI P4 ソースは <https://docsouth.unc.edu/fpn/washington/menu.html> で見ることができます。
