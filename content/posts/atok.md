+++
title = "USキーボード使用時のATOKの日本語入力ON/OFFをCtrl+`に割り当てる"
date = 2022-08-29
[taxonomies]
categories = ["posts"]
tags = ["ATOK", "PowerToys"]
[extra]
toc = false
+++

[以前](https://sssssssuzuki.github.io/posts/winterm-build/), Google日本語入力を使用している際にWindows Terminalの入力モードが半角英数になってしまう問題について述べた.

これを回避するためにWindows Terminalを修正して自分でビルドしたが, アップデートがあるたびにビルドし直すのも正直面倒くさく, どうしたものかと思っていたところ, ATOKならこの問題が発生しないことに気がついた.

そこで, ATOKを使用することにしたのだが, USキーボードを使用している場合 (私はHHKB Professional HYBRID Type-Sを使用している), Google日本語入力で日本語入力をON/OFFするには<code>Ctrl+\`</code>を使用していた.
一方, ATOKはデフォルトだと<code>Alt+\`</code>で日本語入力のON/OFFを行う.

`Ctrl+Space`を割り当てる人も多いらしいが, 慣れている<code>Ctrl+\`</code>を使いたいので設定しようとしたところ, なぜか動かない.
ATOKプロパティ上では, <code>Ctrl+\`</code>は「半角/全角」キーとして扱われるらしいが, これを設定しても動かない.

そこで[PowerToys](https://github.com/microsoft/PowerToys)に付属している, "Keyboard Manager"を使用して, <code>Ctrl+\`</code>を<code>Alt+\`</code>にマッピングすることにした.

具体的にはKeyboard Managerにて`VK 244`と`VK 243`を`IME Kanji`に割り当てた. 
そして, ATOKにて, 日本語入力ON/OFFに`Ctrl+変換`を割り当てた.
これで, <code>Ctrl+\`</code>で日本語入力のON/OFFを切り替えられるようになった.
