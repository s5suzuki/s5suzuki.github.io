+++
title = "MSVC 19.44.35207.1のよくわからないエラー[C2102/C1907]"
date = 2025-05-28
[taxonomies]
categories = ["posts"]
tags = ["C++", "C++20"]
[extra]
toc = false
+++

以下のコードで, `fooArrNG`だけがコンパイルエラーになる.

```cpp
#include <array>

struct Foo {
  int value = 0;
};

struct FooArray {
  std::array<Foo, 1> arr = {};
};

struct Bar {
  int value;
};

struct BarArray {
  std::array<Bar, 1> arr = {};
};

int main() {
  auto arr = std::array{Foo{.value = 0}};  // OK
  auto fooArr = FooArray{.arr = arr};      // OK

  //auto fooArrNG = FooArray{.arr = std::array{Foo{.value = 0}}}; // NG

  auto fooArrOK = FooArray{.arr = {Foo{.value = 0}}}; // OK
  
  auto barArrOK = BarArray{.arr = std::array{Bar{.value = 0}}}; // OK
}
```

> fatal  error C1907: 直前のエラーを修復できません。コンパイルを中止します。

> error C2102: '&' に左辺値がありません。

初期化のときに`std::array`を書かないか, `Bar`のように初期値を指定しないかで回避できる.

少なくともちょっと前のバージョンではエラーにならなかったはず.
これがC++の仕様なのかは不明だが, バグな気がする. 少なくともエラーメッセージは意味不明である.
