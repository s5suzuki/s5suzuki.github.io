+++
title = "WinUIでContentDialogを出す"
date = 2022-08-21
[taxonomies]
categories = ["posts"]
tags = ["C#", "WinUI", "ContentDialog"]
+++

WinUIで`ContentDialog`を出そうとしたらハマったのでメモを残しておく.

[ドキュメント](https://docs.microsoft.com/en-US/windows/apps/design/controls/dialogs-and-flyouts/dialogs)をよく読むと分かるのだが, `XamlRoot`を設定しないとだめらしい.
Viewのコードに書く場合は

```C#
   var dialog = new ContentDialog
            {
                ...
                XamlRoot = Content.XamlRoot,
            };
```

のように, `Content.XamlRoot`で取得できるらしいが, ViewModelに書きたい.
そこで, 最初はView側のコンストラクタで`Content.XamlRoot`を取得しViewModelに設定しようとしたが, この場合は`Content.XamlRoot`が`null`になってしまいだめだった.

調べると, [`Loaded`イベントでやればいいという情報](https://stackoverflow.com/questions/68007005/uwp-how-to-pass-in-a-non-null-xamlroot-of-a-page-to-a-navigationservice-called)を見つけたので以下のようにしたところ正しく動いた.

* MyPage.xaml
    ```xml
    <Page
        ...
        Loaded="MyPage_OnLoaded"
        ...
        >
    ```
* MyPage.xaml.cs

    ```c#
    public sealed partial class MyPage : Page
    {
        public MyViewModel ViewModel
        {
            get;
        }

        public MyPage()
        {
            ViewModel = App.GetService<MyViewModel>();
            InitializeComponent();
        }

        private void MyPage_OnLoaded(object sender, RoutedEventArgs e)
        {
            ViewModel.XamlRoot = Content.XamlRoot;
        }
    }
    ```

* MyViewModel.cs

    ```c#
    public class MyViewModel : ObservableRecipient
    {
        public XamlRoot? XamlRoot
        {
            get;
            set;
        }

        public MyViewModel()
        {
            XamlRoot = null;
            
            ...
        }

        public void ShowDialog() {
            var dialog = new ContentDialog
                {
                    ...
                    XamlRoot = XamlRoot!,
                };
            ...
        }
    ```
