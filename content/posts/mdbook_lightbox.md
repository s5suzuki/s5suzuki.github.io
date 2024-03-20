+++
title = "mdBookでクリックしたら拡大画像をポップアップで表示するやつ"
date = 2024-03-20
[taxonomies]
categories = ["posts"]
tags = ["mdBook", "Lightbox2"]
+++

mdBookでクリックしたら拡大画像をポップアップで表示するやつをを実現する.

といっても, 難しいことはなく, mdBookは追加のJavaScriptを読み込むことができるので, それを使う.

[Lightbox2](https://github.com/lokesh/lightbox2/releases)をダウンロードしてきて, `lightbox-plus-jquery.min.js`と`lightbox.css`の2つのファイルを適当なディレクトリに置く.
あとは, `book.toml`に以下のように書けば導入は完了.

```toml
[output.html]
additional-js = ["./lightbox-plus-jquery.min.js"]
additional-css = ["./lightbox.css"]
```

> NOTE: ファイルパスは`book.toml`からの相対パスで指定する.

あとは, ポップアップで拡大画像を表示したいところに以下のように書けばOK.

```markdown
<a href="path/to/image" data-lightbox="image"><img src="path/to/image"/></a>
```
