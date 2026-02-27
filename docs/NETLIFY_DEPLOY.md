# Netlifyデプロイ手順

最終更新日: 2026年2月24日

## 📋 概要

このドキュメントは、KAJISHIFTフロントエンドをNetlifyにデプロイする手順を説明します。

---

## ✅ デプロイ前の準備

### 1. バックエンドのデプロイ確認

- [x] バックエンドAPIがデプロイ済みであること
- [x] バックエンドのURL: `https://kajishift-api.onrender.com`
- [ ] バックエンドのCORS設定でフロントエンドのNetlify URLが許可されていること

**重要**: バックエンドのCORS設定を更新する必要があります。Renderの環境変数で`CORS_ORIGIN`に複数のURLをカンマ区切りで設定してください：

```
CORS_ORIGIN=http://localhost:5500,https://kajishift-frontend.netlify.app
```

または、カスタムドメインを使用する場合：

```
CORS_ORIGIN=http://localhost:5500,https://kajishift-frontend.netlify.app,https://kajishift.jp
```

設定後、Renderでサービスを再デプロイしてください。

### 2. フロントエンドの設定確認

以下のファイルが正しく設定されているか確認：

- [x] `js/api.js` - 環境に応じた自動切り替え（実装済み）
- [x] `js/socket.js` - 環境に応じた自動切り替え（実装済み）
- [x] `service-worker.js` - エラーページパス修正（実装済み）
- [x] `netlify.toml` - Netlify設定ファイル（作成済み）
- [x] `_redirects` - リダイレクトルール（作成済み）

**注意**: `js/api.js`と`js/socket.js`は、環境に応じて自動的にAPI URLを切り替えます：
- `localhost`の場合: `http://localhost:3000`
- それ以外（Netlify）: `https://kajishift-api.onrender.com`

---

## 🚀 Netlifyデプロイ手順

### 方法1: Netlify CLIを使用（推奨）

#### 1. Netlify CLIのインストール

```bash
npm install -g netlify-cli
```

#### 2. Netlifyにログイン

```bash
netlify login
```

#### 3. サイトの初期化

```bash
netlify init
```

以下の質問に答えます：
- **Create & configure a new site**: Yes
- **Team**: 選択
- **Site name**: `kajishift-frontend`（任意）
- **Build command**: （空欄のままEnter - 静的サイトなので不要）
- **Directory to deploy**: `.`（現在のディレクトリ）

#### 4. デプロイ

```bash
netlify deploy --prod
```

### 方法2: GitHub連携を使用（推奨）

#### 1. GitHubリポジトリにプッシュ

```bash
git init
git add .
git commit -m "Initial commit for Netlify deployment"
git branch -M main
git remote add origin <your-github-repository-url>
git push -u origin main
```

#### 2. Netlifyでサイトを作成

1. [Netlify](https://app.netlify.com/)にログイン
2. **Add new site** → **Import an existing project**
3. **GitHub**を選択してリポジトリを選択
4. **Deploy settings**:
   - **Build command**: （空欄のまま）
   - **Publish directory**: `.`（ルートディレクトリ）
5. **Deploy site**をクリック

#### 3. サイト設定の確認

**Site settings** → **Build & deploy**:
- **Build command**: （空欄）
- **Publish directory**: `.`

---

## ⚙️ Netlify設定

### カスタムドメインの設定（オプション）

1. **Site settings** → **Domain management**
2. **Add custom domain**をクリック
3. ドメイン名を入力（例: `kajishift.jp`）
4. DNS設定を確認

### 環境変数の設定（オプション）

現在、`js/api.js`と`js/socket.js`は環境に応じて自動的にURLを切り替えるため、環境変数の設定は不要です。

ただし、明示的に設定したい場合は：

1. **Site settings** → **Environment variables**
2. 以下の変数を追加（通常は不要）:
   - `API_BASE_URL`: `https://kajishift-api.onrender.com/api`
   - `SOCKET_SERVER_URL`: `https://kajishift-api.onrender.com`

---

## 🔍 デプロイ後の確認

### 1. 基本動作確認

- [ ] トップページが正しく表示されるか
- [ ] ログインページが正しく表示されるか
- [ ] すべてのページのリンクが正しく動作するか
- [ ] HTTPSでアクセスできるか

### 2. API接続確認

1. ブラウザの開発者ツール（F12）を開く
2. **Network**タブを開く
3. ログインを試行
4. APIリクエストが`https://kajishift-api.onrender.com/api`に送信されているか確認
5. エラーが発生していないか確認

### 3. WebSocket接続確認

1. ログイン後、チャット機能を開く
2. ブラウザの開発者ツール（F12）を開く
3. **Console**タブで`Socket.io接続成功`のメッセージを確認
4. WebSocket接続が`https://kajishift-api.onrender.com`に確立されているか確認

### 4. Service Worker確認

1. ブラウザの開発者ツール（F12）を開く
2. **Application**タブ → **Service Workers**を確認
3. Service Workerが登録されているか確認

### 5. エラーページ確認

以下のURLにアクセスして、エラーページが正しく表示されるか確認：
- `/errors/404.html`
- `/errors/500.html`
- `/errors/403.html`

---

## 🔧 トラブルシューティング

### CORSエラーが発生する場合

**症状**: ブラウザのコンソールにCORSエラーが表示される

**原因**: バックエンドのCORS設定でフロントエンドのNetlify URLが許可されていない

**解決方法**:
1. Renderダッシュボードで`kajishift-api`サービスの「Environment」タブを開く
2. `CORS_ORIGIN`環境変数を確認・更新
3. 複数のURLをカンマ区切りで設定（例: `http://localhost:5500,https://kajishift-frontend.netlify.app`）
4. 「Save changes」をクリックして再デプロイ
5. デプロイ完了後、再度フロントエンドからアクセスを試す

### API接続エラーが発生する場合

**症状**: APIリクエストが失敗する

**確認項目**:
1. ブラウザの開発者ツール（F12）でネットワークタブを確認
2. リクエストURLが`https://kajishift-api.onrender.com/api`になっているか確認
3. バックエンドAPIサーバーが起動しているか確認
4. `js/api.js`の環境判定ロジックが正しく動作しているか確認

### WebSocket接続エラーが発生する場合

**症状**: チャットや通知がリアルタイムで更新されない

**確認項目**:
1. ブラウザの開発者ツール（F12）でコンソールを確認
2. WebSocket接続エラーのメッセージを確認
3. `js/socket.js`の環境判定ロジックが正しく動作しているか確認
4. バックエンドのWebSocketサーバーが起動しているか確認

### 404エラーが発生する場合

**症状**: ページ遷移時に404エラーが表示される

**確認項目**:
1. `netlify.toml`のリダイレクトルールが正しく設定されているか確認
2. `_redirects`ファイルがルートディレクトリに存在するか確認
3. Netlifyのデプロイログでエラーがないか確認

---

## 📝 デプロイチェックリスト

### デプロイ前

- [x] `js/api.js`の環境自動切り替え（実装済み）
- [x] `js/socket.js`の環境自動切り替え（実装済み）
- [x] `service-worker.js`のエラーページパス修正（実装済み）
- [x] `netlify.toml`の作成（完了）
- [x] `_redirects`ファイルの作成（完了）
- [x] バックエンドのCORS設定を複数オリジン対応に更新（完了）
- [ ] バックエンドのRender環境変数でNetlify URLを許可
- [ ] GitHubリポジトリにプッシュ（GitHub連携を使用する場合）

### デプロイ後

- [ ] トップページが正しく表示されるか
- [ ] ログインページが正しく表示されるか
- [ ] API接続が正常に動作するか
- [ ] WebSocket接続が正常に動作するか
- [ ] エラーページが正しく表示されるか
- [ ] HTTPSでアクセスできるか
- [ ] Service Workerが正常に動作するか
- [ ] モバイル表示が正しいか

---

## 🔗 関連ドキュメント

- [デプロイ前チェックリスト](DEPLOYMENT_CHECKLIST.md)
- [実装状況](IMPLEMENTATION_STATUS.md)
- [連携状況](INTEGRATION_STATUS.md)

---

**最終更新**: 2026年2月24日

### 2026年2月24日の更新内容

- ✅ 管理者登録機能のセキュリティ強化
  - `admin/login.html`から新規登録リンクを削除（セキュリティ強化）
  - `admin/users.html`に管理者登録モーダルを追加（既存管理者のみが新しい管理者を登録可能）
