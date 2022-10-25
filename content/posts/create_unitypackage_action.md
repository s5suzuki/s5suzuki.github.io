+++
title = "GitHub actionで作ったunitypackageが\"Failed to copy package\"と出て読み込めなかった"
date = 2022-10-26
[taxonomies]
categories = ["posts"]
tags = ["Windows", "Unity", "GitHub action"]
+++

- TL;DR: パスの区切りがバックスラッシュになっているのが問題だった.

GitHub actionでunitypackageを作成し, それをReleasesページで配布していた.

このために, [pCYSl5EDgo/create-unitypackage](https://github.com/pCYSl5EDgo/create-unitypackage)を使用させていただいていた.
このサンプルでは`ubuntu-latest`が使用されており, その場合は全く問題なく動いていた.
しかし, 諸事情により`windows-latest`を使用する必要が出てきたため, `windows-latest`で動かしたところ, 作成したパッケージをUnityでimportしようとすると, "Failed to copy package"というエラーによりimportできなかった.

unitypackageをunzipして中身を確認してみても, 特に間違っているようには見えない.
そこで, 適当にミニマルなパッケージを作成し, `ubuntu-latest`と`windows-latest`で作成したunitypackageを比較してみると, pathnameの記述で, ubuntuがスラッシュ (/) を使用しているのに対して, Windowsの方はバックスラッシュ (\\) になっていた.

`*.meta`ファイルを列挙する部分を, Windowsに合わせて以下のようにしていたが, これだとバックスラッシュが使われてしまうようだ.

```
Get-ChildItem -Recurse -Filter '*.meta' -Name >> metaList
```

そこで, 以下のように\\を/に置換するようにしたところ, 無事importできるようになった. 

```
Get-ChildItem -Recurse -Filter '*.meta' -Name | ForEach-Object {$_ -replace '[\\]', '/'} >> metaList
```
