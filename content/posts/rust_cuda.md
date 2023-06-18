+++
title = "[Rust] CUDA/cuBLAS/cuSOLVERを使う"
date = 2023-06-12
[taxonomies]
categories = ["posts"]
tags = ["Rust"]
[extra]
toc = true
+++

RustでCUDA/cuBLAS/cuSOLVERを使う備忘録.

ソースは[ここ](https://github.com/s5suzuki/cuda-sample).

# CUDA

Rustの`cc` crateはCUDAのコンパイルに対応している.
また, CUDAのAPI bindingである`cuda-sys` crateもあるので比較的簡単にCUDAを使用する事ができる.

まず, 適当なプロジェクトを作成する.

```rust
cargo new --bin cuda-sample
cd cuda-sample
cargo add cc --build
cargo add cuda-sys
```

次に, `kernal.cu`を作成し, CUDAのコードを書く.
```cpp
#include <cstdint>

__global__ void add_kernel(const double *x, double *y, int n) {
  int i = blockDim.x * blockIdx.x + threadIdx.x;
  if (i < n) {
    y[i] += x[i];
  }
}

#include <cstdint>

#ifdef __cplusplus
extern "C" {
#endif

void cu_add(const double *x, double *y, const int32_t len) {
  int threadsPerBlock = 256;
  int blocksPerGrid = (len + threadsPerBlock - 1) / threadsPerBlock;
  add_kernel<<<blocksPerGrid, threadsPerBlock>>>(x, y, len);
}

#ifdef __cplusplus
}
#endif
```

次に, `build.rs`を作成する.

```rust
fn main() {
    println!("cargo:rerun-if-changed=kernel.cu");
    println!("cargo:rerun-if-changed=build.rs");

    cc::Build::new()
        .cuda(true)
        .flag("-allow-unsupported-compiler")
        .flag("-cudart=shared")
        .flag("-gencode=arch=compute_75,code=sm_75")
        .flag("-gencode=arch=compute_80,code=sm_80")
        .flag("-gencode=arch=compute_86,code=sm_86")
        .flag("-gencode=arch=compute_87,code=sm_87")
        .file("kernel.cu")
        .compile("my_kernel");
}
```

なお, nvccのフラグは[この記事](https://arnon.dk/matching-sm-architectures-arch-and-gencode-for-various-nvidia-cards/)などを参考に, 使用するGPUに合わせる.

あとは普通に外部ライブラリとしてリンクして使用できる.

```rust
use std::mem::size_of;

use cuda_sys::cudart::{
    cudaMalloc,
    cudaMemcpy,
    cudaMemcpyKind_cudaMemcpyDeviceToHost,
    cudaMemcpyKind_cudaMemcpyHostToDevice,
    cudaMemset,
};

#[link(name = "my_kernel", kind = "static")]
extern "C" {
    fn cu_add(x: *const f64, y: *mut f64, n: i32);
}

macro_rules! alloc {
    ($ty:ty, $r:expr, $c:expr) => {{
        let mut v: *mut $ty = std::ptr::null_mut();
        cudaMalloc(&mut v as *mut *mut $ty as _, size_of::<$ty>() * $r * $c);
        cudaMemset(v as _, 0, size_of::<$ty>() * $r * $c);
        (v, $r, $c)
    }};
}

macro_rules! free {
    ($p:expr) => {{
        cuda_sys::cudart::cudaFree($p.0 as _)
    }};
}

fn main() {
    unsafe {
        let m = 2;
        let n = 1024;

        let one = 1.0;
        let zero = 0.0;
        let a_ = vec![one; m * n];

        let a = alloc!(f64, m, n);
        let c = alloc!(f64, m, m);
        cudaMemcpy(
            a.0 as _,
            a_.as_ptr() as _,
            m * n * size_of::<f64>(),
            cudaMemcpyKind_cudaMemcpyHostToDevice,
        );

        cu_add(a.0, c.0, (m * m) as _);

        let mut c_: Vec<f64> = vec![zero; m * m];
        cudaMemcpy(
            c_.as_mut_ptr() as _,
            c.0 as _,
            c_.len() * size_of::<f64>(),
            cudaMemcpyKind_cudaMemcpyDeviceToHost,
        );
        println!("{:?}", c_);

        free!(a);
        free!(c);
    }
}
```

# cuBLAS

`cuda-sys` crateはcuBLASのAPI bindingも提供している.

```rust
use std::mem::size_of;

use cuda_sys::{
    cublas::{
        cublasCreate_v2, cublasDestroy_v2, cublasHandle_t, cublasOperation_t,
        cublasOperation_t_CUBLAS_OP_N,
    },
    cudart::{
        cudaMalloc, cudaMemcpy, cudaMemcpyKind_cudaMemcpyDeviceToHost,
        cudaMemcpyKind_cudaMemcpyHostToDevice, cudaMemset,
    },
};

#[link(name = "my_kernel", kind = "static")]
extern "C" {
    fn cu_add(x: *const f64, y: *mut f64, n: i32);
}

macro_rules! alloc {
    ($ty:ty, $r:expr, $c:expr) => {{
        let mut v: *mut $ty = std::ptr::null_mut();
        cudaMalloc(&mut v as *mut *mut $ty as _, size_of::<$ty>() * $r * $c);
        cudaMemset(v as _, 0, size_of::<$ty>() * $r * $c);
        (v, $r, $c)
    }};
}

macro_rules! free {
    ($p:expr) => {{
        cuda_sys::cudart::cudaFree($p.0 as _)
    }};
}

fn mat_mul(
    handle: cublasHandle_t,
    transa: cublasOperation_t,
    transb: cublasOperation_t,
    alpha: *const f64,
    a: (*mut f64, usize, usize),
    b: (*mut f64, usize, usize),
    beta: *const f64,
    c: (*mut f64, usize, usize),
) {
    unsafe {
        cuda_sys::cublas::cublasDgemm_v2(
            handle,
            transa,
            transb,
            c.1 as _,
            c.2 as _,
            if transa == cublasOperation_t_CUBLAS_OP_N {
                a.2
            } else {
                a.1
            } as _,
            alpha,
            a.0,
            a.1 as _,
            b.0,
            b.1 as _,
            beta,
            c.0,
            c.1 as _,
        );
    }
}

fn main() {
    unsafe {
        let m = 2;
        let n = 1024;

        let one = 1.0;
        let zero = 0.0;
        let a_ = vec![one; m * n];
        let b_ = vec![one; m * n];

        let a = alloc!(f64, m, n);
        let b = alloc!(f64, n, m);
        let c = alloc!(f64, m, m);
        cudaMemcpy(
            a.0 as _,
            a_.as_ptr() as _,
            m * n * size_of::<f64>(),
            cudaMemcpyKind_cudaMemcpyHostToDevice,
        );
        cudaMemcpy(
            b.0 as _,
            b_.as_ptr() as _,
            m * n * size_of::<f64>(),
            cudaMemcpyKind_cudaMemcpyHostToDevice,
        );

        let mut handle: cublasHandle_t = std::ptr::null_mut();
        cublasCreate_v2(&mut handle as *mut _);

        mat_mul(
            handle,
            cublasOperation_t_CUBLAS_OP_N,
            cublasOperation_t_CUBLAS_OP_N,
            &one,
            a,
            b,
            &zero,
            c,
        );

        cu_add(a.0, c.0, (m * m) as _);

        cublasDestroy_v2(handle);

        let mut c_: Vec<f64> = vec![zero; m * m];
        cudaMemcpy(
            c_.as_mut_ptr() as _,
            c.0 as _,
            c_.len() * size_of::<f64>(),
            cudaMemcpyKind_cudaMemcpyDeviceToHost,
        );
        println!("{:?}", c_);

        free!(a);
        free!(b);
        free!(c);
    }
}
```

# cuSOLVER

残念ながら, `cuda-sys` crateはcuSOLVERのAPI bindingを提供していない.
そのため, 自分でbindingを作成する必要がある.
手作業で作るのは苦痛なので, [bindgen](https://github.com/rust-lang/rust-bindgen)などを使うと良い.

また, `cusolver`ライブラリをリンクする必要がある.
まず, `cuda_config` crateを追加しておく.
```
cargo add cuda-config --build
```
次に, `build.rs`を更新して, 以下のようにする.
```rust
use cuda_config::*;

fn main() {
    println!("cargo:rerun-if-changed=kernel.cu");
    println!("cargo:rerun-if-changed=build.rs");

    cc::Build::new()
        .cuda(true)
        .flag("-allow-unsupported-compiler")
        .flag("-cudart=shared")
        .flag("-gencode=arch=compute_75,code=sm_75")
        .flag("-gencode=arch=compute_80,code=sm_80")
        .flag("-gencode=arch=compute_86,code=sm_86")
        .flag("-gencode=arch=compute_87,code=sm_87")
        .file("kernel.cu")
        .compile("my_kernel");

    if cfg!(target_os = "windows") {
        println!(
            "cargo:rustc-link-search=native={}",
            find_cuda_windows().display()
        );
    } else {
        for path in find_cuda() {
            println!("cargo:rustc-link-search=native={}", path.display());
        }
    };

    println!("cargo:rustc-link-lib=dylib=cusolver");
}
```

これで, 無事にcuSOLVERを使うことができる.

```rust
#[allow(non_camel_case_types)]
#[allow(dead_code)]
#[allow(deref_nullptr)]
mod cusolver;

use std::mem::size_of;

use cuda_sys::{
    cublas::{
        cublasCreate_v2, cublasDestroy_v2, cublasHandle_t, cublasOperation_t,
        cublasOperation_t_CUBLAS_OP_N,
    },
    cudart::{
        cudaMalloc, cudaMemcpy, cudaMemcpyKind_cudaMemcpyDeviceToDevice,
        cudaMemcpyKind_cudaMemcpyDeviceToHost, cudaMemcpyKind_cudaMemcpyHostToDevice, cudaMemset,
    },
};
use cusolver::{
    cudaDataType_t::CUDA_R_64F, cusolverDnCreate, cusolverDnDestroy, cusolverDnHandle_t,
    cusolverEigMode_t::CUSOLVER_EIG_MODE_VECTOR,
};

#[link(name = "my_kernel", kind = "static")]
extern "C" {
    fn cu_add(x: *const f64, y: *mut f64, n: i32);
}

macro_rules! alloc {
    ($ty:ty, $r:expr, $c:expr) => {{
        let mut v: *mut $ty = std::ptr::null_mut();
        cudaMalloc(&mut v as *mut *mut $ty as _, size_of::<$ty>() * $r * $c);
        cudaMemset(v as _, 0, size_of::<$ty>() * $r * $c);
        (v, $r, $c)
    }};
}

macro_rules! free {
    ($p:expr) => {{
        cuda_sys::cudart::cudaFree($p.0 as _)
    }};
}

fn mat_mul(
    handle: cublasHandle_t,
    transa: cublasOperation_t,
    transb: cublasOperation_t,
    alpha: *const f64,
    a: (*mut f64, usize, usize),
    b: (*mut f64, usize, usize),
    beta: *const f64,
    c: (*mut f64, usize, usize),
) {
    unsafe {
        cuda_sys::cublas::cublasDgemm_v2(
            handle,
            transa,
            transb,
            c.1 as _,
            c.2 as _,
            if transa == cublasOperation_t_CUBLAS_OP_N {
                a.2
            } else {
                a.1
            } as _,
            alpha,
            a.0,
            a.1 as _,
            b.0,
            b.1 as _,
            beta,
            c.0,
            c.1 as _,
        );
    }
}

unsafe fn svd(
    handle: cusolverDnHandle_t,
    src: (*mut f64, usize, usize),
) -> (
    (*mut f64, usize, usize),
    (*mut f64, usize, usize),
    (*mut f64, usize, usize),
) {
    let m = src.1;
    let n = src.2;

    let s_size = m.min(n);

    let u = alloc!(f64, m, m);
    let s = alloc!(f64, s_size, 1);
    let vt = alloc!(f64, n, n);

    let lda = m;
    let ldu = m;
    let ldv = n;

    let mut workspace_in_bytes_on_device: u64 = 0;
    let mut workspace_in_bytes_on_host: u64 = 0;
    cusolver::cusolverDnXgesvdp_bufferSize(
        handle,
        std::ptr::null_mut(),
        CUSOLVER_EIG_MODE_VECTOR,
        0,
        m as _,
        n as _,
        CUDA_R_64F,
        src.0 as _,
        lda as _,
        CUDA_R_64F,
        s.0 as _,
        CUDA_R_64F,
        u.0 as _,
        ldu as _,
        CUDA_R_64F,
        vt.0 as _,
        ldv as _,
        CUDA_R_64F,
        &mut workspace_in_bytes_on_device as _,
        &mut workspace_in_bytes_on_host as _,
    );

    let workspace_buffer_on_device = alloc!(u8, workspace_in_bytes_on_device as usize, 1);
    let mut workspace_buffer_on_host_v = vec![0u8; workspace_in_bytes_on_host as usize];
    let workspace_buffer_on_host = if workspace_in_bytes_on_host > 0 {
        workspace_buffer_on_host_v.as_mut_ptr()
    } else {
        std::ptr::null_mut()
    };

    let info = alloc!(i32, 1, 1);

    let mut h_err_sigma = 0.;
    cusolver::cusolverDnXgesvdp(
        handle,
        std::ptr::null_mut(),
        CUSOLVER_EIG_MODE_VECTOR,
        0,
        m as _,
        n as _,
        CUDA_R_64F,
        src.0 as _,
        lda as _,
        CUDA_R_64F,
        s.0 as _,
        CUDA_R_64F,
        u.0 as _,
        ldu as _,
        CUDA_R_64F,
        vt.0 as _,
        ldv as _,
        CUDA_R_64F,
        workspace_buffer_on_device.0 as _,
        workspace_in_bytes_on_device,
        workspace_buffer_on_host as _,
        workspace_in_bytes_on_host,
        info.0 as _,
        &mut h_err_sigma as _,
    );

    free!(info);
    free!(workspace_buffer_on_device);

    (u, s, vt)
}

fn main() {
    unsafe {
        let m = 2;
        let n = 1024;

        let one = 1.0;
        let zero = 0.0;
        let a_ = vec![one; m * n];
        let b_ = vec![one; m * n];

        let a = alloc!(f64, m, n);
        let b = alloc!(f64, n, m);
        let c = alloc!(f64, m, m);
        cudaMemcpy(
            a.0 as _,
            a_.as_ptr() as _,
            m * n * size_of::<f64>(),
            cudaMemcpyKind_cudaMemcpyHostToDevice,
        );
        cudaMemcpy(
            b.0 as _,
            b_.as_ptr() as _,
            m * n * size_of::<f64>(),
            cudaMemcpyKind_cudaMemcpyHostToDevice,
        );

        let mut handle: cublasHandle_t = std::ptr::null_mut();
        cublasCreate_v2(&mut handle as *mut _);

        mat_mul(
            handle,
            cublasOperation_t_CUBLAS_OP_N,
            cublasOperation_t_CUBLAS_OP_N,
            &one,
            a,
            b,
            &zero,
            c,
        );

        cu_add(a.0, c.0, (m * m) as _);

        let mut handle_s: cusolverDnHandle_t = std::ptr::null_mut();
        cusolverDnCreate(&mut handle_s as *mut _);

        let (u, s, vt) = svd(handle_s, c);

        let sm = alloc!(f64, m, m);
        cudaMemcpy(
            sm.0 as _,
            s.0 as _,
            size_of::<f64>(),
            cudaMemcpyKind_cudaMemcpyDeviceToDevice,
        );
        cudaMemcpy(
            sm.0.add(2) as _,
            s.0.add(1) as _,
            size_of::<f64>(),
            cudaMemcpyKind_cudaMemcpyDeviceToDevice,
        );

        let tmp = alloc!(f64, m, m);
        mat_mul(
            handle,
            cublasOperation_t_CUBLAS_OP_N,
            cublasOperation_t_CUBLAS_OP_N,
            &one,
            u,
            sm,
            &zero,
            tmp,
        );
        mat_mul(
            handle,
            cublasOperation_t_CUBLAS_OP_N,
            cublasOperation_t_CUBLAS_OP_N,
            &one,
            tmp,
            vt,
            &zero,
            c,
        );

        cublasDestroy_v2(handle);
        cusolverDnDestroy(handle_s);

        let mut c_: Vec<f64> = vec![zero; m * m];
        cudaMemcpy(
            c_.as_mut_ptr() as _,
            c.0 as _,
            c_.len() * size_of::<f64>(),
            cudaMemcpyKind_cudaMemcpyDeviceToHost,
        );
        println!("{:?}", c_);

        free!(a);
        free!(b);
        free!(c);
        free!(u);
        free!(s);
        free!(vt);
    }
}
```
