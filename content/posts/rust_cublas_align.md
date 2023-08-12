+++
title = "[Rust] cuda_sys::cublas使用時にSTATUS_ACCESS_VIOLATIONが出るときの対策"
date = 2023-08-12
[taxonomies]
categories = ["posts"]
tags = ["Rust"]
[extra]
toc = true
+++

TL;DR: alignmentに気をつけよう.

crate.ioに公開されている`cuda_sys`クレートにはバグが有り, `cuDoubleComplex`のアライメントが指定されていない.
そのため, 場合によっては, アライメントがずれて`STATUS_ACCESS_VIOLATION`が出ることがある.

例えば, 以下のコードは`STATUS_ACCESS_VIOLATION`が出る (環境によると思う).

```rust
use cuda_sys::cublas::*;

struct Wraper {
    handle: cublasHandle_t,
}

impl Wraper {
    fn new() -> Self {
        let mut handle: cublasHandle_t = std::ptr::null_mut();
        unsafe {
            cublasCreate_v2(&mut handle as _);
        }
        Self { handle }
    }

    fn zscal(&self, n: usize, r: f64, x: *mut cuDoubleComplex) {
        let align: f64 = 0.;
        dbg!(&align as *const _);
        let alpha = cuDoubleComplex { x: r, y: align };
        dbg!(&alpha as *const _);
        unsafe {
            cublasZscal_v2(self.handle, n as _, &alpha as *const _ as _, x as _, 1);
        }
    }
}

fn main() {
    let w = Wraper::new();

    let mut p = vec![cuDoubleComplex { x: 1., y: 2. }];
    unsafe {
        let mut dp: *mut cuDoubleComplex = std::ptr::null_mut();
        cuda_sys::cudart::cudaMalloc(
            &mut dp as *mut _ as _,
            std::mem::size_of::<cuDoubleComplex>() * p.len(),
        );
        cuda_sys::cudart::cudaMemcpy(
            dp as _,
            p.as_ptr() as _,
            std::mem::size_of::<cuDoubleComplex>() * p.len(),
            cuda_sys::cudart::cudaMemcpyKind_cudaMemcpyHostToDevice,
        );

        w.zscal(p.len(), 2., dp);

        cuda_sys::cudart::cudaMemcpy(
            p.as_mut_ptr() as _,
            dp as _,
            std::mem::size_of::<cuDoubleComplex>() * p.len(),
            cuda_sys::cudart::cudaMemcpyKind_cudaMemcpyDeviceToHost,
        );
    }

    dbg!(p);
}
```

`zscal`内の, `align`変数を消すと, 正常に動作する.

```diff
-        let align: f64 = 0.;
-        dbg!(&align as *const _);
-        let alpha = cuDoubleComplex { x: r, y: align };
+        // let align: f64 = 0.;
+        // dbg!(&align as *const _);
+        let alpha = cuDoubleComplex { x: r, y: 0. };
```

`cuda-sys` version 0.3.0-alphaでは, この問題は修正されているようだが, crate.ioにはまだ公開されていない.
簡単な解決策は, アライメントを指定した構造体でラップすること.

```rust
#[repr(C)]
#[repr(align(16))]
struct CuDoubleComplexWrapper(cuDoubleComplex);

...

        let align: f64 = 0.;
        dbg!(&align as *const _);
        let alpha = CuDoubleComplexWrapper(cuDoubleComplex { x: r, y: align });

```
