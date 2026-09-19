# わり算クエスト

小学生向けの、10問で完結するわり算ドリルです。問題は進むほど少しずつ難しくなり、スコアとベスト記録はブラウザのローカルストレージにだけ保存されます。

## 使い方

`index.html` をブラウザで開くだけで遊べます。パッケージのインストールやサーバーは必要ありません。

## GitHub Pages への公開

`.github/workflows/deploy-pages.yml` は、`main` ブランチへの push 時に GitHub Pages へ公開します。PR を `main` にマージすると自動で実行されます。

最初の一度だけ、リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** に設定してください。