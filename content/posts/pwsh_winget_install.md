+++
title = "wingetでインストールされてないプログラムのみインストールする (PowerShell)"
date = 2022-09-07
[taxonomies]
categories = ["posts"]
tags = ["winget", "PowerShell", "Windows"]
+++


`winget list`でインストールされているパッケージを表示できる.
インストールされていない場合, エラーを返すので, 以下のようにすれば, インストールされてない場合だけインストールできる.

```powershell
function install_if_not_installed($name) {
    winget list -q $name | Out-Null
    if ($?) {
        echo "$name is already installed"
    } else {
        winget install $name
    }
}
```
