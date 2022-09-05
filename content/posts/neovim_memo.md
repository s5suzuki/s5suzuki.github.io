+++
title = "Windows開発環境設定メモ"
date = 2022-09-04
[taxonomies]
categories = ["posts"]
tags = ["Neovim", "WezTerm", "nu"]
[extra]
toc = true
+++

随時アップデート予定.

# WezTerm

[ドキュメント](https://wezfurlong.org/wezterm/index.html)が充実しているので, これを読めば大丈夫.

## Install

```
winget install wez.wezterm
```

## Setting

設定ファイルは`~/.config/wezterm/wezterm.lua`に書く.

```lua
local wezterm = require 'wezterm';
local mux = wezterm.mux

wezterm.on('gui-startup', function(cmd)
  local tab, pane, window = mux.spawn_window(cmd or {})
  window:gui_window():set_position(200, 200)
  window:gui_window():set_inner_size(1280, 640)
  pane:split { size = 0.7, direction = 'Top'  }
end)

return {
  font = wezterm.font('HackGenNerd Console'),
  use_ime = true,
  font_size = 12.0,
  color_scheme = 'VSCodeDark+ (Gogh)',
  hide_tab_bar_if_only_one_tab = true,
  adjust_window_size_when_changing_font_size = false,
  default_prog = { 'nu' },
  window_close_confirmation = 'NeverPrompt',
  skip_close_confirmation_for_processes_named = {
    'nu.exe',
  },
  keys = {
    { key = ';', mods = 'CTRL', action = wezterm.action.ActivatePaneDirection 'Next' },
  },
}
```

WezTermを開いたときにPaneを上下に分割するようにしてある.

また, Shellは[nu](https://github.com/nushell/nushell)を使っているので, それをデフォルトにしてある.
設定しない場合, `cmd.exe`になる.

フォントやカラースキームは適当に選ぶ.

あと, 終了時に確認が求められるが, 面倒なのでスキップするようにした.

さらに, `Ctrl+;`でPane間を遷移できるようにしてある.

## Usage

使い方は, ドキュメントを参照.

よく使うコマンドをいかに抜粋する.

|  Keybinding             |  Command            |
| --------------------    | --------------      |
|  `Ctrl-Shift-Alt-%`     |  Pane水平分割       |
|  `Ctrl-Shift-Alt-"`     |  Pane垂直分割       |
|  `Ctrl-Shift-ArrowKey`  |  Pane間移動         |
|  `Ctrl-Shift-t`         |  新しいタブを開く   |
|  `Ctrl-Shift-w`         |  現在のタブを閉じる |
|  `Ctrl-Tab`             |  次のタブに移動     |
|  `Ctrl-Shift-Tab`       |  前のタブに移動     |

# Neovim

neovimの設定ファイルは`~/AppData/Local/nvim/init.lua`となる.

## Install

```
winget install neovim
```

## Plugins

### [packer.nvim](https://github.com/wbthomason/packer.nvim)

プラグインを管理するためのプラグイン.

PowerShellで以下のコマンドを入力し, インストールする.

```
git clone https://github.com/wbthomason/packer.nvim "~\AppData\Local\nvim-data\site\pack\packer\start\packer.nvim"
```

また, `init.lua`に以下を書く.

- `init.lua`

  ```lua
  require('plugins')
  ```

さらに, `~/AppData/Local/nvim/lua/plugins.lua`ファイルを作り, ここにプラグインの設定を書いていく.

- `lua/plugins.lua`

  ```lua
  vim.cmd [[packadd packer.nvim]]
  return require('packer').startup(function()    
      use('wbthomason/packer.nvim')
  end)
  ```

プラグインのインストールは, `plugins.lua`に追記した後, Neovimを開き,
```
:PackerInstall
```
で行う.

### [fern.vim](https://github.com/lambdalisue/fern.vim)

ファイラープラグイン.

```lua
    use('lambdalisue/fern.vim')
    use('lambdalisue/fern-git-status.vim')
    use('lambdalisue/nerdfont.vim')
    use('lambdalisue/fern-renderer-nerdfont.vim')
    use('lambdalisue/glyph-palette.vim')
    use('antoinemadec/FixCursorHold.nvim')
```

2番目は, gitの情報を表示するためのもの.
3-5番目のやつは, アイコンを表示するためのもの.

最後のプラグインに関しては,
> Neovim users SHOULD add [antoinemadec/FixCursorHold.nvim](https://github.com/antoinemadec/FixCursorHold.nvim) for now (See [#120](https://github.com/lambdalisue/fern.vim/issues/120))
となっていたので.

- `Ctrl+n`でファイラーの表示非表示の切り替るようにする. また, アイコン用の設定もする.

  ```lua
  vim.keymap.set('n', '<C-n>', ':Fern . -reveal=% -drawer -toggle -width=30<CR>')
  vim.g['fern#renderer'] = 'nerdfont'
  vim.cmd('augroup my-glyph-palette')
  vim.cmd('autocmd! *')
  vim.cmd('autocmd FileType fern call glyph_palette#apply()')
  vim.cmd('autocmd FileType nerdtree,startify call glyph_palette#apply()')
  vim.cmd('augroup END')
  ```

|  Keybinding             |  Command            |
| --------------------    | --------------      |
|  `l`                    |  フォルダを開く     |
|  `h`                    |  フォルダを閉じる   |
|  `e`                    |  ファイルを開く     |
|  `Ctrl-m`               |  フォルダへ移動     |
|  `Ctrl-h`               |  親フォルダへ移動   |
|  `N`                    |  ファイル新規作成   |
|  `K`                    |  フォルダ新規作成   |
|  `D`                    |  ファイル削除       |
|  `R`                    |  リネーム           |
|  `m`                    |  移動               |

### [lualine.nvim](https://github.com/nvim-lualine/lualine.nvim)

ステータスラインの見た目変更.

```lua
    use {
        'nvim-lualine/lualine.nvim',
        requires = { 'kyazdani42/nvim-web-devicons', opt = true }
    }
```

見た目の設定は適当に選ぶ.

- `lua/lualine_config.lua`

  ```lua
  require('lualine').setup {
      options = {
          icons_enabled = true,
          theme = 'nord',
          component_separators = { left = '', right = '' },
          section_separators = { left = '', right = '' },
          disabled_filetypes = {},
          always_divide_middle = true,
          globalstatus = false,
      },
      sections = {
          lualine_a = { 'mode' },
          lualine_b = { 'branch', 'diff', 'diagnostics' },
          lualine_c = { 'filename' },
          lualine_x = { 'encoding', 'fileformat', 'filetype' },
          lualine_y = { 'progress' },
          lualine_z = { 'location' }
      },
      inactive_sections = {
          lualine_a = {},
          lualine_b = {},
          lualine_c = { 'filename' },
          lualine_x = { 'location' },
          lualine_y = {},
          lualine_z = {}
      },
      tabline = {},
      extensions = {}
  }
  ```

### [telescope.nvim](https://github.com/nvim-telescope/telescope.nvim)

ファジーファインダー.

```lua
    use('nvim-lua/plenary.nvim')
    use('nvim-telescope/telescope.nvim')
```

`Ctrl-p`で曖昧検索, `Ctrl-g`でgrep検索

```lua
vim.keymap.set('n', '<C-p>', ':Telescope find_files<CR>')
vim.keymap.set('n', '<C-g>', ':Telescope live_grep<CR>')
```

### LSP

Language Server Protocol系.

```lua
    use('neovim/nvim-lspconfig')
    use('williamboman/mason.nvim')
    use('williamboman/mason-lspconfig.nvim')
    use('hrsh7th/nvim-cmp')
    use('hrsh7th/cmp-nvim-lsp')
    use('hrsh7th/vim-vsnip')
```

- `lua/lsp_config.lua`

  ```lua
  require('mason').setup()
  require('mason-lspconfig').setup_handlers({ function(server)
      local opt = {
          capabilities = require('cmp_nvim_lsp').update_capabilities(
              vim.lsp.protocol.make_client_capabilities()
          )
      }
      require('lspconfig')[server].setup(opt)
  end })

  vim.keymap.set('n', 'K', '<cmd>lua vim.lsp.buf.hover()<CR>')
  vim.keymap.set('n', 'gf', '<cmd>lua vim.lsp.buf.formatting()<CR>')
  vim.keymap.set('n', 'gr', '<cmd>lua vim.lsp.buf.references()<CR>')
  vim.keymap.set('n', 'gd', '<cmd>lua vim.lsp.buf.definition()<CR>')
  vim.keymap.set('n', 'gD', '<cmd>lua vim.lsp.buf.declaration()<CR>')
  vim.keymap.set('n', 'gi', '<cmd>lua vim.lsp.buf.implementation()<CR>')
  vim.keymap.set('n', 'gt', '<cmd>lua vim.lsp.buf.type_definition()<CR>')
  vim.keymap.set('n', 'gn', '<cmd>lua vim.lsp.buf.rename()<CR>')
  vim.keymap.set('n', 'ga', '<cmd>lua vim.lsp.buf.code_action()<CR>')
  vim.keymap.set('n', 'ge', '<cmd>lua vim.diagnostic.open_float()<CR>')
  vim.keymap.set('n', 'g]', '<cmd>lua vim.diagnostic.goto_next()<CR>')
  vim.keymap.set('n', 'g[', '<cmd>lua vim.diagnostic.goto_prev()<CR>')

  vim.lsp.handlers["textDocument/publishDiagnostics"] = vim.lsp.with(
      vim.lsp.diagnostic.on_publish_diagnostics, { virtual_text = false }
  )

  vim.cmd [[
  set updatetime=500
  highlight LspReferenceText  cterm=underline ctermfg=1 ctermbg=8 gui=underline guifg=#A00000 guibg=#104040
  highlight LspReferenceRead  cterm=underline ctermfg=1 ctermbg=8 gui=underline guifg=#A00000 guibg=#104040
  highlight LspReferenceWrite cterm=underline ctermfg=1 ctermbg=8 gui=underline guifg=#A00000 guibg=#104040
  augroup lsp_document_highlight
    autocmd!
    autocmd CursorHold,CursorHoldI * lua vim.lsp.buf.document_highlight()
    autocmd CursorMoved,CursorMovedI * lua vim.lsp.buf.clear_references()
  augroup END
  ]]

  local cmp = require("cmp")
  cmp.setup({
      snippet = {
          expand = function(args)
              vim.fn["vsnip#anonymous"](args.body)
          end,
      },
      sources = {
          { name = "nvim_lsp" },
      },
      mapping = cmp.mapping.preset.insert({
          ["<C-p>"] = cmp.mapping.select_prev_item(),
          ["<C-n>"] = cmp.mapping.select_next_item(),
          ['<C-l>'] = cmp.mapping.complete(),
          ['<C-e>'] = cmp.mapping.abort(),
          ["<CR>"] = cmp.mapping.confirm { select = true },
      }),
      experimental = {
          ghost_text = true,
      },
  })
  ```

Language Serverのインストールは

```
:Mason
```

から行う.

## Settings

### 行番号表示

```lua
vim.wo.number = true
```

### カラースキーム変更

VSCodeライクにする.

```
mkdir ~/AppData/Local/nvim/colors
git clone https://github.com/tomasiser/vim-code-dark.git ~/.vim/bundle/vim-code-dark.git
cp ~/.vim/bundle/vim-code-dark.git/colors/codedark.vim ~/AppData/Local/nvim/colors
```

```lua
vim.cmd 'colorscheme codedark'
```

### jjでインサートモードを抜ける

```lua
vim.api.nvim_set_keymap('i', 'jj', '<ESC>', { noremap = true, silent = true })
```

### 行頭で左に移動すると前行末尾に, 行末で右に移動すると次行先頭に移動する

```lua
vim.opt.whichwrap = "b,s,h,l,<,>,[,],~"
```

### マウス操作を有効にする

```lua
vim.opt.mouse = 'a'
```


# 参考サイト

- [How to set up Neovim 0.5 + Modern plugins (LSP, Treesitter, Fuzzy finder, etc)](https://blog.inkdrop.app/how-to-set-up-neovim-0-5-modern-plugins-lsp-treesitter-etc-542c3d9c9887)
- [VimをVSCodeライクにする](https://qiita.com/youichiro/items/b4748b3e96106d25c5bc)
- [Vim で ESC キーの代わりに jj でインサートモードから抜けるには](https://www.mitomex.blog/vim-esc-jj/)
- [Neovim+LSPをなるべく簡単な設定で構築する](https://zenn.dev/botamotch/articles/21073d78bc68bf#.config%2Fnvim%2Finit.lua)
- [vimrcのwhichwrapオプションについて](https://ruicc.hatenablog.jp/entry/20090615/1245086039)
- [vimでマウスを有効にする方法](https://kaworu.jpn.org/vim/vim%E3%81%A7%E3%83%9E%E3%82%A6%E3%82%B9%E3%82%92%E6%9C%89%E5%8A%B9%E3%81%AB%E3%81%99%E3%82%8B%E6%96%B9%E6%B3%95)
- [Neovimのステータスラインをlualine.nvimにする](https://homaju.hatenablog.com/entry/2022/06/12/092136)
- [WINDOWS の NEOVIM に COLORSCHEME を適用する](https://anadigilogic.sub.jp/2021/01/23/windows-%E3%81%AE-neovim-%E3%81%AB-colorscheme-%E3%82%92%E9%81%A9%E7%94%A8%E3%81%99%E3%82%8B/)
