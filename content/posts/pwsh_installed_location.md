+++
title = "PowerShellでプログラムのインストールフォルダを見つける"
date = 2022-09-08
[taxonomies]
categories = ["posts"]
tags = ["PowerShell", "Windows"]
+++

`7-zip`をシェルから使いたかったが, PATHに入ってなかった.
わざわざ, PATHに追加するのも面倒なので, PowerShellで`7-zip`の実行ファイルの場所を検索して, 一時的にPATHに追加することにした.

インストール先を探すには, レジストリを見て, 正規表現でマッチする要素を取り出せば良さそう.

```powershell
function FindInstallPath($name) {
    $reg = Get-ChildItem HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall | ForEach-Object { Get-ItemProperty $_.PsPath } | Where-Object DisplayName -match $name | Select-Object -first 1
    if ($reg) {
        return $reg.InstallLocation
    }
    else {
        return "NULL"
    }
}
```

例えば, 以下のように使える.

```powershell
$7zip_path = FindInstallPath '7-Zip'
$env:Path = "$env:Path;$7zip_path"
```
