+++
title = "WindowsでPicoprobe用のOpenOCDをビルドする"
date = 2022-08-09
[taxonomies]
categories = ["blog"]
tags = ["Picoprobe", "OpenOCD", "Windows", "Raspberry Pi Pico"]
[extra]
toc = true
+++

基本的に[公式のドキュメント](https://datasheets.raspberrypi.com/pico/getting-started-with-pico.pdf)に従えば良いはずなのだが, ちょこちょこ環境依存なのかエラーが出たので備忘録として残しておく.

# MSYS2のインストール

まず, [MSYS2](https://www.msys2.org/)をダウンロードして, インストールする.

次に, MSYS2を起動し, パッケージやコアをアップデートする.

```
pacman -Syu
```

(ちなみに, ペーストはShift+Insなので注意)

アップデート中にMSYS2が終了した場合は, 再び起動して, 上記コマンドをもう一度実行する.

## 依存ライブラリのインストール

OpenOCDをビルドするのに必要なライブラリをインストールする.

```
pacman -S mingw-w64-x86_64-toolchain git make libtool pkg-config autoconf automake texinfo mingw-w64-x86_64-libusb
```

Toolchainはとりあえず全部インストールする.

一旦, MSYS2を終了し, MSYS2 MinGW x64を起動する.

> NOTE:
> MSYS2 MSYSではなく, MSYS2 MinGW x64を起動することに注意.
> 前者だと必要なPATHが通っていない. (自分でPATHを通しても良いが)

# OpenOCDをビルド

Raspberry PiのリポジトリからOpenOCDをクローンし, ビルドする.

```
git clone https://github.com/raspberrypi/openocd.git --branch rp2040 --depth=1
cd openocd
./bootstrap
./configure --enable-picoprobe --disable-werror
```

<details>
<summary>configureのエラー対処</summary>

以下のエラーが出た場合は`MSYS2 MinGW x64`を使っているかを確認すること.

```
configure: error: libusb-1.x is required for the Raspberry Pi Pico Probe
```

或いは, `PKG_CONFIG_PATH`を設定しても良い.

```
export PKG_CONFIG_PATH=/mingw64/lib/pkgconfig:/mingw64/share/pkgconfig
```

</details>

以上が終われば, あとはビルドするだけである.

```
make -j8
```

すると, `src/openocd.exe`が生成される.

# Install

これは趣味だが, Windowsから使いやすいように, `openocd.exe`を適当なところにコピーしておく.

ついでに, cfgファイル等が含まれる`tcl`フォルダと`libusb`のdllもコピーしておく.

ここでは, `C`直下に`openocd`というフォルダを作って, そこに置くことにする.

```
mkdir /c/openocd
cp src/openocd.exe /c/openocd
cp -r tcl/ /c/openocd/
cp /mingw64/bin/libusb-1.0.dll /c/openocd/
```

最後に, `C:\openocd`へWindowsのPATHを通しておく.
