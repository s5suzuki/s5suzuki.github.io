+++
title = "C++のプロジェクトをZigでビルドする"
date = 2025-05-18
[taxonomies]
categories = ["posts"]
tags = ["C++", "Zig"]
[extra]
toc = true
+++

C++のプロジェクトをZigでビルドする備忘録.

Googletestを使ったテストや, Eigen 3のようなサードパーティライブラリを使う場合の方法も記載する.

Zigのバージョンは0.14.0を使用する.

# プロジェクトの作成

サンプルとして, 以下のようなC++プロジェクトを用意する.

```bash
mkdir cpp-build-by-zig
cd cpp-build-by-zig
mkdir include
mkdir lib
mkdir example
touch include/lib.hpp
touch lib/lib.cpp
touch example/main.cpp
```

- include/lib.hpp
```cpp
#include <cstdint>

int32_t add(int32_t, int32_t);
```

- lib/lib.cpp
```cpp
#include "lib.hpp"

int32_t add(int32_t a, int32_t b) { return a + b; }
```

- example/main.cpp
```cpp
#include <iostream>

#include "lib.hpp"

int main() {
  int32_t a = 5;
  int32_t b = 10;
  int32_t result = add(a, b);
  std::cout << a << " + " << b << " = " << result << std::endl;
  return 0;
}
```

Zigでビルドするために`build.zig`を作成する.

```bash
touch build.zig
```

- build.zig

```zig
const std = @import("std");

pub fn build(b: *std.Build) void {

    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    const lib = b.addLibrary(.{ .linkage = std.builtin.LinkMode.static, .name = "lib", .root_module = b.createModule(.{
        .target = target,
        .optimize = optimize,
    }) });

    lib.addCSourceFiles(.{ .files = &.{"lib/lib.cpp"} });
    lib.addIncludePath(b.path("include"));
    lib.linkLibC();
    if (target.query.abi != std.Target.Abi.msvc) {
        lib.linkLibCpp();
    }
    lib.installHeadersDirectory(b.path("include"), ".", .{
        .include_extensions = &.{ "h", "hpp" },
    });
    b.installArtifact(lib);

    const exe = b.addExecutable(.{
        .name = "main",
        .target = target,
        .optimize = optimize,
    });

    exe.addCSourceFiles(.{ .files = &.{"example/main.cpp"} });
    exe.linkLibrary(lib);
    b.installArtifact(exe);
}
```

基本的には, 書かれている意味の通りである.

これであとは,
```bash
zig build
```
とすると, `zig-out`以下にビルドされたライブラリと実行ファイルができる.
なお, WindowsでMinGWではなくmsvcでビルドする場合は
```bash
zig build -Dtarget=native-native-msvc
```
のようにすれば良い.

なお,
```zig
    if (target.query.abi != std.Target.Abi.msvc) {
        lib.linkLibCpp();
    }
```
の部分は, Windowsでmsvcを使う場合の処理である.
[Zig 0.14.0ではmsvcで`libcxx`をビルドできないらしい.](https://github.com/ziglang/zig/issues/18685)

また,
```zig
    lib.installHeadersDirectory(b.path("include"), ".", .{
        .include_extensions = &.{ "h", "hpp" },
    });
```
の部分は, `CMake`でいうところの`PUBLIC|INTERFACE`指定みたいなもので, これをやっておくと, `exe.linkLibrary(lib)`で`exe`ターゲットに自動的に`include`がインクルードパスとして追加される.
また, `zig-out`以下に`include`ディレクトリが作成され, そこにヘッダファイルがコピーされるようになる.
なお, デフォルトだと, `.include_extensions`は`h`のみになっているので注意.

# サンプルを実行するコマンドを追加する

`build.zig::build`の末尾に以下を追加すると, `zig build run`で`exe`ターゲットを実行できるようになる.

```zig
    const run_cmd = b.addRunArtifact(exe);
    const run_step = b.step("run", "Run example");
    run_step.dependOn(&run_cmd.step);
```

# Eigen 3を使う

Eigen 3などのライブラリは以下のコマンドで依存関係として追加できる.

```bash
zig fetch --save=eigen git+https://gitlab.com/libeigen/eigen.git#3.4.0
```

Eigen 3はヘッダーオンリーのライブラリなので, 以下のようにするだけで良い.

```zig
    const eigen3_dep = b.dependency("eigen", .{});
    lib.addIncludePath(eigen3_dep.path("."));

    ...

    exe.addIncludePath(eigen3_dep.path("."));
```

なお, `installHeadersDirectory`を使うと, `zig-out`以下に`Eigen 3`のファイルがコピーされてしまうので, ここでは`exe`ターゲットにも`addIncludePath`で明示的にインクルードパスを追加している.

これで, 以下のように`Eigen 3`が使えるようになる.

- include/lib.hpp
```cpp
#include <cstdint>

#include "Eigen/Dense"

int32_t add(int32_t, int32_t);
Eigen::Vector3d add(const Eigen::Vector3d&, const Eigen::Vector3d&);
```

- lib/lib.cpp
```cpp
#include "lib.hpp"

int32_t add(int32_t a, int32_t b) { return a + b; }
Eigen::Vector3d add(const Eigen::Vector3d& a, const Eigen::Vector3d& b) { return a + b; }
```

# Googletestを使う

まずは, テスト用のコードを用意する.

```bash
mkdir tests
touch tests/main.cpp
touch tests/test.cpp
```

- tests/main.cpp
```cpp
#include "gtest/gtest.h"

int main(int argc, char** argv) {
  testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();
}
```

- test/test.cpp
```cpp
#include "gtest/gtest.h"
#include "lib.hpp"

TEST(Lib, AddInt32) { EXPECT_EQ(add(1, 2), 3); }
TEST(Lib, AddVector3d) { EXPECT_EQ(add(Eigen::Vector3d(0, 1, 2), Eigen::Vector3d(3, 4, 5)), Eigen::Vector3d(3, 5, 7)); }
```

次に, [googletest](https://github.com/google/googletest)を依存関係として追加する.
なお, ここでは, gitリポジトリではなく, アーカイブファイルを指定してみる.

```bash
zig fetch --save=googletest https://github.com/google/googletest/archive/refs/tags/v1.17.0.tar.gz
```

`build.zig::build`の最後に以下を追加する.

```zig
    const googletest_dep = b.dependency("googletest", .{});

    const gtest = b.addLibrary(.{ .linkage = std.builtin.LinkMode.static, .name = "gtest", .root_module = b.createModule(.{
        .target = target,
        .optimize = optimize,
    }) });
    gtest.linkLibC();
    if (target.query.abi != std.Target.Abi.msvc) {
        gtest.linkLibCpp();
    }
    gtest.addCSourceFile(.{
        .file = googletest_dep.path("googletest/src/gtest-all.cc"),
    });
    gtest.addIncludePath(googletest_dep.path("googletest/include"));
    gtest.addIncludePath(googletest_dep.path("googletest"));
    gtest.installHeadersDirectory(googletest_dep.path("googletest/include"), ".", .{});

    const gtest_main = b.addLibrary(.{ .linkage = std.builtin.LinkMode.static, .name = "gtest_main", .root_module = b.createModule(.{
        .target = target,
        .optimize = optimize,
    }) });
    gtest_main.linkLibC();
    if (target.query.abi != std.Target.Abi.msvc) {
        gtest_main.linkLibCpp();
    }
    gtest_main.addCSourceFile(.{
        .file = googletest_dep.path("googletest/src/gtest_main.cc"),
    });
    gtest_main.addIncludePath(googletest_dep.path("googletest/include"));
    gtest_main.addIncludePath(googletest_dep.path("googletest"));
    gtest_main.installHeadersDirectory(googletest_dep.path("googletest/include"), ".", .{});

    const exe_tests = b.addExecutable(.{
        .name = "test",
        .target = target,
        .optimize = optimize,
    });
    exe_tests.addCSourceFiles(.{ .files = &.{ "tests/main.cpp", "tests/test.cpp" } });
    exe_tests.linkLibrary(lib);
    exe_tests.linkLibrary(gtest);
    exe_tests.linkLibrary(gtest_main);
    exe_tests.addIncludePath(eigen3_dep.path("."));

    const run_test_cmd = b.addRunArtifact(exe_tests);
    const test_step = b.step("test", "Run unit tests");
    test_step.dependOn(&run_test_cmd.step);
```

Zig用のテストコードではないので, サンプルの実行と同様にカスタムコマンドを設定している.

これで, 
```bash
zig build test
```
でテストが実行できるようになる.
