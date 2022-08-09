+++
title = "RustでRaspberry Pi Picoの開発 (Windows + VSCode + OpenOCD + GDB)"
date = 2022-08-09
[taxonomies]
categories = ["blog"]
tags = ["Picoprobe", "OpenOCD", "Windows", "Raspberry Pi Pico", "Rust", "VSCode", "GDB"]
[extra]
toc = true
+++


以下は, [この記事](https://sssssssuzuki.github.io/blog/picoprobe-openocd-win/)に従ってOpenOCDがインストールされていることが前提である.

# 事前準備

## Raspberry Pi Picoの用意

ここでは, Raspberry Pi Picoを二台用意し, 片方に`Picoprobe`を書き込み, これを使用してもう一台の開発を行うことにする.

[Picoprobeは公式にuf2ファイルが用意されている](https://www.raspberrypi.com/documentation/microcontrollers/raspberry-pi-pico.html#software-utilities)ので, これを使用すれば良い.

あとは, [ドキュメント](https://datasheets.raspberrypi.com/pico/getting-started-with-pico.pdf)のAppendix Aに従って, 二台のRasberry Pi Picoを接続しておく.

## 必要なツールのインストール

次に, コンパイルに必要なRustのツールチェインとツールをインストールする.

```
rustup target install thumbv6m-none-eabi
cargo install flip-link elf2uf2-rs
```

あと, templateを使用するために, `cargo-generate`もインストールする.

```
cargo install cargo-generate
```

また, デバッグ用に`gdb`もインストールしておく, これはMSYSで行う.

```
pacman -S mingw-w64-x86_64-gdb-multiarch
```

# テンプレートのビルド

Raspberry Pi Pico用のテンプレートが存在するので, これを利用する.

```
cargo generate --git https://github.com/rp-rs/rp2040-project-template --name pico-blink
cd pico-blink
cargo build
```

すると, `target/thumbv6m-none-eabi/debug/rp2040-project-template` (ELF形式) が生成される.

# OpenOCDで書き込み

上記のELFファイルをOpenOCDで書き込む.

```
openocd -f interface/picoprobe.cfg -f target/rp2040.cfg -s C:/openocd/tcl -c "program target/thumbv6m-none-eabi/debug/rp2040-project-template verify reset exit"
```

# VSCode + GDBを使用してデバッグ

VSCodeとgdbを使用してデバッグするには, まず, 以下の拡張機能をインストールする必要がある.

[Native Debug](https://marketplace.visualstudio.com/items?itemName=webfreak.debug)

次に, `.vscode/launch.json`を書き換える. デフォルトのままだと動かないので適当に書き換えた.

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "rp2040-project",
            "preLaunchTask": "rust: cargo build",
            "type": "gdb",
            "request": "attach",
            "executable": "target/thumbv6m-none-eabi/debug/rp2040-project-template",
            "cwd": "${workspaceFolder}",
            "target": ":3333",
            "remote": true,
            "gdbpath": "gdb-multiarch",
            "autorun": [
                "target remote :3333",
                "mon reset init",
                "load",
            ],
        }
    ]
}
```

あとは, terminalでOpenOCDを起動し,

```
openocd -f interface/picoprobe.cfg -f target/rp2040.cfg -s C:/openocd/tcl
```

あとは, `main.rs`を開き, 適当なところにブレークポイントを貼り, `F5`を押せばデバッグが始まる.

# UF2を書き込む

UF2を書き込む場合は, BOOTSELボタンを押した状態でRaspberry Pi Picoを接続しておく.

また, `.cargo/config.toml`を書き換え, `runner = "probe-run --chip RP2040"`をコメントアウトし, `runner = "elf2uf2-rs -d"`のコメントを外す.

```
# runner = "probe-run --chip RP2040"
# runner = "cargo embed"
runner = "elf2uf2-rs -d"
```

この状態で, `cargo run`するとuf2が自動的に書き込まれる.
