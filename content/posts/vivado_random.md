+++
title = "Vivado simulationでランダムな値を発生させる"
date = 2022-09-15
[taxonomies]
categories = ["posts"]
tags = ["Vivado"]
+++

VivadoのSimulationでランダムな値を生成するには`$rand`を使えばいい.
ただし, シードが固定または未指定だと, 毎回同じ値になる.

これを回避するために, Cのように現在時刻をシードにしようとしたが, Verilogの`$time`はシミュレーション時間であり, C言語のような現在時刻ではない.

そのため, tclで適当な乱数を作って, それをVivadoのSimulation時に読み込み, シードにすることにした.

まず, 以下のようなtclスクリプトを作っておく.
```tcl
set max 0x7FFFFFFF
set r [expr ($max*rand() + 1)]
set f [open rand.txt w]
puts $f [format "%s" [expr int($r)] ]
close $f
```

そして, "Tools"→"Settings"→"Project Settings/Simulation"の"Compilation"タブで`xsim.compile.tcl.pre`の項目に上記のtclファイルを指定する.
あるいは, 以下のようにTcl Console設定することもできる (ここでは, `./src/sim_1/new/rand.tcl`が上記のtclスクリプトである前提.)
```tcl
set_property -name {xsim.compile.tcl.pre} -value "./src/sim_1/new/rand.tcl" -objects [get_filesets sim_1]
```
これでシミュレーションの前に上記のスクリプトが実行され, 乱数が書かれた`rand.txt`が生成される.

あとは, これを読み込んで, シードにすればいい.

私は以下のようなヘルパーモジュールを作って利用することにしている.

```systemverilog
`timescale 1ns / 1ps
module random_helper;

  int seed = 0;

  task init();
    int p_file;
    int result;
    int r;
    p_file = $fopen("rand.txt", "r");
    result = $fscanf(p_file, "%d", seed);
    $fclose(p_file);
    r = $random(seed);
  endtask

  function automatic longint range(longint max, longint min);
    automatic longint r = $random();
    range = ($unsigned(r) % (max - min + 1)) + min;
  endfunction

endmodule
```

他に何かいい方法があれば教えてほしい.
