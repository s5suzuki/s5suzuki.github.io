+++
title = "[Python] CとのFFI用の構造体の配列"
date = 2023-06-22
[taxonomies]
categories = ["posts"]
tags = ["Python"]
[extra]
toc = true
+++

PythonからCの関数を呼び出すとき, Cの関数の引数に構造体の配列を渡すことがある.
構造体は`ctypes.Structure`を継承したクラスを作ればいいというのはよく知られているが, その配列をどうやって作るかがあんまり調べても出てこなかったのでメモ.

結論から言うと, 普通に`numpy`の配列を使えば良い.
ただし, フィールドへのアクセスを文字列で行う必要がある.

```python
import ctypes
import numpy as np


class Point(ctypes.Structure):
    _fields_ = [("x", ctypes.c_double), ("y", ctypes.c_double)]


size = 2
points = np.zeros(size, dtype=Point)
for i in range(size):
    points[i]["x"] = 2 * i
    points[i]["y"] = 2 * i + 1

print(points)
# [(0., 1.) (2., 3.)]
```

これで作った配列は以下のようにポインタに変換できる.
これは, Cで言うところの`Point* ptr`に相当する.

```python
ptr = points.ctypes.data_as(ctypes.POINTER(Point))
```

## 補足

上記の`points`の各要素の型は`numpy.void`となっている.
そのため, `Point`の要素から直接は構成できない.

例えば, 以下のコードは`ValueError: could not convert string to float`というエラーを吐く.
(このエラーだいぶ分かりづらいな...)

```python
points = np.fromiter(map(lambda i: Point(2 * i, 2 * i + 1), range(size)), dtype=Point)
```

こういう場合は, `numpy.void`に明示的に変換する必要がある.

```python
points = np.fromiter(
    map(lambda i: np.void(Point(2 * i, 2 * i + 1)), range(size)), dtype=Point
)
```
