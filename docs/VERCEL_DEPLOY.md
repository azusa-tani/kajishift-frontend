# Vercelデプロイ手順

最終更新日: 2026年3月（最新）

## 📋 概要

このドキュメントは、KAJISHIFTフロントエンドをVercelにデプロイする手順を説明します。

---

## ✅ デプロイ完了状況

### 1. フロントエンドの本番公開 ✅ 完了

**構成**:
```
GitHub
  └ kajishift-frontend
        ↓
Vercel
  └ https://kajishift-frontend.vercel.app
```

**結果**: ✅ フロントエンド公開成功

### 2. GitHubとVercelの連携設定 ✅ 完了

- GitHub Appを設定
- `kajishift-frontend`リポジトリをVercelに連携
- `kajishift-backend`リポジトリもVercelに連携（将来のデプロイ用）

**結果**: ✅ CI/CD構築完了（GitHub push → 自動デプロイ）

### 3. 静的HTMLサイトとしてデプロイ ✅ 完了

- **Application Preset**: Other
- 静的HTMLサイトとして正常にデプロイ

**結果**: 
- ✅ `index.html` - 正常表示
- ✅ `/customer/login.html` - 正常表示
- ✅ `/worker/login.html` - 正常表示
- ✅ `/admin/login.html` - 正常表示

### 4. 3ロールログイン画面確認 ✅ 完了

**公開確認済み**:
- ✅ 依頼者: `/customer/login.html`
- ✅ ワーカー: `/worker/login.html`
- ✅ 管理者: `/admin/login.html`

**結果**: ✅ UI正常表示

### 5. 利用規約・法務ページ公開 ✅ 完了

以下をHTML化して公開:
- ✅ 利用規約 (`terms.html`)
- ✅ プライバシーポリシー (`privacy.html`)
- ✅ 特定商取引法 (`legal.html`)

**結果**: ✅ 法務ページ完成

**備考**: これはStripe決済審査でも必要なものです。

### 6. サービス公開URL確立 ✅ 完了

**現在の公開URL**: 
- https://kajishift-frontend.vercel.app

---

## 🚀 Vercelデプロイ手順

### 方法1: GitHub連携（推奨・完了済み）

1. [Vercel](https://vercel.com/)にログイン
2. 「Add New Project」をクリック
3. GitHubリポジトリを選択（`kajishift-frontend`）
4. プロジェクト設定:
   - **Framework Preset**: Other
   - **Root Directory**: `.`（ルートディレクトリ）
   - **Build Command**: （空欄 - 静的サイトなので不要）
   - **Output Directory**: `.`（ルートディレクトリ）
5. 「Deploy」をクリック
6. デプロイ完了後、自動的にURLが発行される

### 方法2: Vercel CLI

```bash
# Vercel CLIのインストール
npm install -g vercel

# ログイン
vercel login

# デプロイ
vercel

# 本番環境にデプロイ
vercel --prod
```

---

## ⚙️ 環境設定

### バックエンドAPI URL

フロントエンドは環境に応じて自動的にAPI URLを切り替えます：
- 開発環境: `http://localhost:3000`
- 本番環境（Vercel）: `https://kajishift-backend-production.up.railway.app`

`js/api.js`と`js/socket.js`で自動判定されています。

### CORS設定

バックエンドのCORS設定で、VercelのURLを許可する必要があります：

```
CORS_ORIGIN=http://localhost:5500,https://kajishift-frontend.vercel.app
```

---

## 📝 確認事項

### デプロイ後の確認

- [x] トップページが正常に表示される
- [x] 各ログインページが正常に表示される
- [x] 法務ページが正常に表示される
- [x] API接続が正常に動作する
- [x] WebSocket接続が正常に動作する

### 確認済みページ

- ✅ `index.html` - トップページ
- ✅ `/customer/login.html` - 依頼者ログイン
- ✅ `/worker/login.html` - ワーカーログイン
- ✅ `/admin/login.html` - 管理者ログイン
- ✅ `/terms.html` - 利用規約
- ✅ `/privacy.html` - プライバシーポリシー
- ✅ `/legal.html` - 特定商取引法に基づく表記

---

## 🔄 CI/CD

### 自動デプロイ設定

GitHubとVercelを連携することで、以下のフローが自動化されています：

1. GitHubにコードをプッシュ
2. Vercelが自動的に変更を検知
3. 自動的にビルド・デプロイが実行される
4. デプロイ完了後、自動的にURLが更新される

### ブランチ戦略

- `main`ブランチ: 本番環境に自動デプロイ
- その他のブランチ: プレビューデプロイ（自動的にURLが発行される）

---

## 📚 参考資料

- [Vercel公式ドキュメント](https://vercel.com/docs)
- [Vercel静的サイトデプロイ](https://vercel.com/docs/deployments/overview)

---

**最終更新**: 2026年3月
**デプロイ状況**: ✅ 完了
**公開URL**: https://kajishift-frontend.vercel.app
