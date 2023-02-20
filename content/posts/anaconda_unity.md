+++
title = "Anaconda (Miniconda) をアンインストールしたらUnityが死んだ話"
date = 2023-02-20
[taxonomies]
categories = ["posts"]
tags = ["Anaconda", "Unity", "Windows"]
+++

# TL;DR

* PowerShellを管理者権限で実行し, 以下のコマンドを実行すると治った.
    ```
    C:\Windows\System32\reg.exe DELETE "HKCU\Software\Microsoft\Command Processor" /v AutoRun /f
    ```

# 現象

突如, Unityでプログラムの実行ができなくなった.
Editor上のログでは何も表示されない.
空のプロジェクトもだめで, Unityを再インストールしてもだめだった.

# 対策

そこで, [Unity Editorのログファイル](https://docs.unity3d.com/ja/2018.4/Manual/LogFiles.html)を確認してみると, 以下のような大量のエラーが表示されている.

```
## Script Compilation Error for: MovedFromExtractor Library/Bee/artifacts/mvdfrm/UnityEditor.GraphViewModule.dll_2847F2B0A8088E25.mvfrm
```

この下の行を見ると, なんらかのプログラムの実行がコマンドプロンプトから失敗しているようだ.
そこで, エラーの詳細を調べるために, コマンドプロンプトを起動し, 件のプログラムを実行しようとしたらコマンドプロンプトがそもそも起動しないことに気づいた.
例えば, PowerShellから`cmd`を実行すると, 終了コード1で終了する.

で, 色々調べてみると, StackOverflowで[Cmd crashes with exit code 1 after uninstalling anaconda](https://stackoverflow.com/questions/66335300/cmd-crashes-with-exit-code-1-after-uninstalling-anaconda)という記事を見つけた.
そういえば, Anaconda (Miniconda) を諸事情でアンインストールしていた.

これによると, "Computer\HKEY_CURRENT_USER\Software\Microsoft\Command Processor"というレジストリキーを削除すればいいらしい.

どうやら, Anacondaをインストールすると, AutoKeyというレジストリが設定され, コマンドプロンプト実行時に`conda_hook.bat`というバッチが実行されるようになるらしいが, これが存在しないので, エラーとなっていたようだ.
Anaconda (Miniconda) をアンインストールしても, このレジストリは消えないようだ.
そのため, このレジストリを手動で削除する必要があるらしい.
