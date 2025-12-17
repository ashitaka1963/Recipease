# RecipeEase

レシピ管理アプリです。

## 概要

本アプリケーションでは、主に以下の機能を提供しています。

- **買い物リスト管理**: 必要な食材をリスト化し、買い物をサポートします。
- **食材管理**: 家にある食材の在庫を管理できます。
- **レシピ管理**: レシピの閲覧・詳細確認が可能です。
- **献立カレンダー**: 日々の献立をカレンダー形式で管理・確認できます。
- **CSV インポート**: 外部データ等を CSV 形式で取り込むことができます。

## 技術スタック

- **Frontend**: Vue 3 + Vite (Hosted on GitHub Pages)
- **Backend**: Supabase
- **Language**: TypeScript

## おすすめの IDE セットアップ

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (Vetur は無効化) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## プロジェクトのセットアップ

```sh
npm install
```

### 開発用サーバの起動 (ホットリロード)

```sh
npm run dev
```

### 本番用ビルドと型チェック

```sh
npm run build
```

### 単体テスト (Vitest)

```sh
npm run test:unit
```

### E2E テスト (Cypress)

```sh
npm run test:e2e:dev
```

このコマンドは Vite 開発サーバーに対して E2E テストを実行します。本番ビルドよりも高速です。

デプロイ前 (CI 環境など) には本番ビルドでのテストが推奨されます:

```sh
npm run build
npm run test:e2e
```

### Lint (ESLint)

```sh
npm run lint
```
