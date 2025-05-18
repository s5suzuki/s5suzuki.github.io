+++
title = "C++のプロジェクトをZigでビルドする"
date = 2025-05-18
[taxonomies]
categories = ["posts"]
tags = ["C++", "Zig"]
[extra]
toc = false
+++


```
mkdir cpp-build-by-zig
cd cpp-build-by-zig
%% git init
touch .gitignore
echo ".zig-cache/\nzig-out/" > .gitignore %%
mkdir include
mkdir lib
mkdir example
touch include/lib.hpp
touch lib/lib.cpp
touch example/main.cpp
touch build.zig
```

- include/lib.hpp
```
#include <cstdint>

int32_t add(int32_t, int32_t);
```
- lib/lib.cpp
```
#include "lib.hpp"

int32_t add(int32_t a, int32_t b) { return a + b; }
```
- example/main.cpp
```
#include <iostream>

#include "lib.hpp"

int main() {
  int32_t a = 5;
  int32_t b = 10;
  int32_t result = add(a, b);
  std::cout << a << " + " << b << " = " << result << std::endl;
}
```
- build.zig
```
const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    const lib = b.addStaticLibrary(.{
        .name = "lib",
        .target = target,
        .optimize = optimize,
    });

    lib.addCSourceFiles(.{ .files = &.{"lib/lib.cpp"} });
    lib.addIncludePath(b.path("include"));
    lib.linkLibC();
    if (target.query.abi != std.Target.Abi.msvc) {
        lib.linkLibCpp();
    }
    b.installArtifact(lib);

    const exe = b.addExecutable(.{
        .name = "main",
        .target = target,
        .optimize = optimize,
    });

    exe.addCSourceFiles(.{ .files = &.{"example/main.cpp"} });
    exe.linkLibrary(lib);
    exe.addIncludePath(b.path("include"));
    b.installArtifact(exe);
}
```

であとは
```
zig build
```
でビルドできる.

なお, WindowsでMinGWではなくmsvcでビルドする場合は
```
zig build -Dtarget=native-native-msvc
```
のようにすれば良い.

## Googletestを使う

```
mkdir test
touch test/test.cpp
```

- Add deps
```
zig fetch --save=googletest https://github.com/google/googletest/archive/refs/tags/v1.17.0.tar.gz
```

```
const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    const lib = b.addStaticLibrary(.{
        .name = "lib",
        .target = target,
        .optimize = optimize,
    });
    lib.linkLibC();
    if (target.query.abi != std.Target.Abi.msvc) {
        lib.linkLibCpp();
    }
    lib.addCSourceFiles(.{ .files = &.{"lib/lib.cpp"} });
    lib.addIncludePath(b.path("include"));
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

    const googletest_dep = b.dependency("googletest", .{});

    const gtest = b.addStaticLibrary(.{
        .name = "gtest",
        .target = target,
        .optimize = optimize,
    });
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

    const gtest_main = b.addStaticLibrary(.{
        .name = "gtest_main",
        .target = target,
        .optimize = optimize,
    });
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
    exe_tests.addCSourceFiles(.{ .files = &.{ "test/main.cpp", "test/test.cpp" } });
    exe_tests.linkLibrary(lib);
    exe_tests.linkLibrary(gtest);
    exe_tests.linkLibrary(gtest_main);

    const run_cmd = b.addRunArtifact(exe_tests);

    const test_step = b.step("test", "Run unit tests");
    test_step.dependOn(&run_cmd.step);
}

```
