+++
title = "Windows WSL2でpico-dirtyJtagとUrJtagをインストールする"
date = 2023-04-06
[taxonomies]
categories = ["posts"]
tags = ["WSL2", "Windows", "pico-dirtyJtag", "UrJtag"]
[extra]
toc = true
+++

# 環境

* Windows 11
* Ubuntu 22.04.2 on WSL2

# UrJtag

1. 依存ツールのダウンロード
    ```
    sudo apt install build-essential autoconf autopoint libtool pkg-config python3-dev libusb-1.0-0-dev
    ```
1. UrJtagのビルド&インストール
    ```
    cd /tmp
    git clone https://git.code.sf.net/p/urjtag/git urjtag-git
    cd urjtag-git/urjtag
    ./autogen.sh
    make
    sudo make install
    ```
1. `jtag`コマンドが使えるかチェック
    ```
    jtag
    jtag>
    ```

    1. 私の環境だと, `libjtag.so.0`が見つからないというエラーが出たので, 以下のコマンドを実行した
    ```
    sudo ldconfig
    ```

# pico-dirtyJtag

1. 依存ツールのインストール

    ```
    sudo apt install cmake gcc-arm-none-eabi
    ```
1. pico-dirtyJtagのビルド

    ```
    git clone https://github.com/phdussud/pico-dirtyJtag.git
    cd pico-dirtyJtag
    mkdir build
    cd build
    cmake .. -DPICO_SDK_FETCH_FROM_GIT=ON
    cmake --build . --parallel 8
    ```
1. 以上で, `pico-dirtyJtag/build`以下に`dirtyJtag.uf2`が生成されるのでこれをRaspberry Pi Picoに書き込む.

# USBドライバのインストール

1. pico-dirtyJtagを書き込んだRaspberry Pi Picoを接続する
1. Windows側で[zadig](https://zadig.akeo.ie/)を使用し, 「dirtyJtag」のドライバとして, 「libusb-win32」をインストールする
1. これだけだと, WSL側で認識できないので, 追加で作業する. 詳しくは[Connect USB devices](https://learn.microsoft.com/en-us/windows/wsl/connect-usb)を参照.
    1. Windows側でUSBIPDをインストールする
        ```
        winget install --interactive --exact dorssel.usbipd-win
        ```
    1. WSL側でUSBIPツールをインストールする
        ```
        sudo apt install linux-tools-generic hwdata
        sudo update-alternatives --install /usr/local/bin/usbip usbip /usr/lib/linux-tools/*-generic/usbip 20
        ```
    1. Windows側でWSLにUSBデバイス一覧を確認. DirtyJtagの「busid」を確認しておく
        ```
        usbipd wsl list
        ```
    1. Windows側でUSBデバイスをWSLにアタッチする
        ```
        usbipd wsl attach --busid <busid>
        ```
1. 以上で, WSL2からDirtyJtagが見えるようになる
    ```
    sudo jtag
    jtag> cable dirtyjtag
    ```
    * 管理者権限なしだと, `cable dirtyjtag`でコケる
