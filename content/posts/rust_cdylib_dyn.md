+++
title = "[Rust] cdylibでGenericなstructを扱う"
date = 2023-06-11
[taxonomies]
categories = ["posts"]
tags = ["Rust"]
[extra]
toc = true
+++

Rustは`crate-type`に`cdylib`を指定することで, C ABIで呼び出すことのできる動的ライブラリとしてコンパイルすることができる.
しかし, RustのGenericなstructはC ABIで直接扱うことができない.

例えば, 以下のような`trait`と`struct`があったとする.
```rust
pub trait Print {
    fn print(&self);
}

pub struct FooPrint {}

impl Print for FooPrint {
    fn print(&self) {
        println!("foo");
    }
}

pub struct BarPrint {}

impl Print for BarPrint {
    fn print(&self) {
        println!("bar");
    }
}

pub struct Printer<P: Print> {
    printer: P,
}

impl<P: Print> Printer<P> {
    pub fn new(printer: P) -> Self {
        Self { printer }
    }

    pub fn print(&self) {
        self.printer.print();
    }
}
```

これを動的ライブラリとして公開しようとするとGenericな関数はC ABIで扱うことができないため, 以下のようになる (警告はでるが).

```rust
#[no_mangle]
pub unsafe extern "C" fn create_foo_print() -> FooPrint {
    FooPrint {}
}

#[no_mangle]
pub unsafe extern "C" fn create_bar_print() -> BarPrint {
    BarPrint {}
}

#[no_mangle]
pub unsafe extern "C" fn create_foo_printer(print: FooPrint) -> Printer<FooPrint> {
    Printer::new(print)
}

#[no_mangle]
pub unsafe extern "C" fn create_bar_printer(print: BarPrint) -> Printer<BarPrint> {
    Printer::new(print)
}

#[no_mangle]
pub unsafe extern "C" fn printer_foo_print(printer: Printer<FooPrint>) {
    printer.print();
}

#[no_mangle]
pub unsafe extern "C" fn printer_bar_print(printer: Printer<BarPrint>) {
    printer.print();
}
```

これだと, `Print` traitを実装しているstruct毎にAPIを作成しなくてはならない.

これを解決するためには, trait objectを使用すればよい.
以下のようにすることで, GenericなstructをC ABIで扱うことができるようになる.

まず, `Print`traitを`Box<dyn Print>`に実装する.
```rust
impl Print for Box<dyn Print> {
    fn print(&self) {
        self.as_ref().print()
    }
}
```
これにより, `Printer`の型を`Printer<Box<dyn Print>>`と固定できる.

よって, 以下のようなAPIを作成すればいい.
```rust
use libc::c_void;

#[no_mangle]
pub unsafe extern "C" fn create_foo_print() -> *const c_void {
    let print: Box<Box<dyn Print>> = Box::new(Box::new(FooPrint {}));
    Box::into_raw(print) as _
}

#[no_mangle]
pub unsafe extern "C" fn create_bar_print() -> *const c_void {
    let print: Box<Box<dyn Print>> = Box::new(Box::new(BarPrint {}));
    Box::into_raw(print) as _
}

#[no_mangle]
pub unsafe extern "C" fn create_printer(print: *const c_void) -> *const c_void {
    let print: Box<dyn Print> = *Box::from_raw(print as *mut Box<dyn Print>);
    let printer: Box<Printer<Box<dyn Print>>> = Box::new(Printer::new(print));
    Box::into_raw(printer) as _
}

#[no_mangle]
pub unsafe extern "C" fn printer_print(printer: *const c_void) {
    (printer as *const Printer<Box<dyn Print>>)
        .as_ref()
        .unwrap()
        .print();
}
```

これで, 以下のように使用することができる.
```c
void* print = create_foo_print();
void* printer = create_printer(print);
printer_print(printer); // foo
```

```c
void* print = create_bar_print();
void* printer = create_printer(print);
printer_print(printer); // foo
```

ポイントとしては, trait objectはfat pointerなので, `Box<Box<dyn Print>>`のように`Box`を二重にしなくてはならない点である.

## 補足1: 外部crateで定義されるtraitの場合

`Print` traitが外部のcrateで定義されている場合は, `Print`を`Box<dyn Print>`に実装することができない.
その場合は, 以下のように, `Box<dyn Print>`をラップする構造体を作ればいい.

```rust
pub struct BoxPrint {
    print: Box<dyn Print>,
}

impl Print for BoxPrint {
    fn print(&self) {
        self.print.print()
    }
}

#[no_mangle]
pub unsafe extern "C" fn create_foo_print() -> *const c_void {
    let print: Box<Box<dyn Print>> = Box::new(Box::new(FooPrint {}));
    Box::into_raw(print) as _
}

#[no_mangle]
pub unsafe extern "C" fn create_bar_print() -> *const c_void {
    let print: Box<Box<dyn Print>> = Box::new(Box::new(BarPrint {}));
    Box::into_raw(print) as _
}

#[no_mangle]
pub unsafe extern "C" fn create_printer(print: *const c_void) -> *const c_void {
    let print: Box<dyn Print> = *Box::from_raw(print as *mut Box<dyn Print>);
    let printer: Box<Printer<BoxPrint>> = Box::new(Printer::new(BoxPrint { print }));
    Box::into_raw(printer) as _
}

#[no_mangle]
pub unsafe extern "C" fn printer_print(printer: *const c_void) {
    (printer as *const Printer<BoxPrint>)
        .as_ref()
        .unwrap()
        .print();
}
```

## 補足2: ポインタの所有権に関する注意

`printer_print`の中身は
```rust
#[no_mangle]
pub unsafe extern "C" fn printer_print(printer: *const c_void) {
    Box::from_raw(printer as *mut Printer<BoxPrint>).print();
}
```
と書くこともできるが, この場合, `printer`は解放されてしまうので注意されたい.
つまり, この関数を一度呼び出したら, その後`printer`を使用することはできない.
