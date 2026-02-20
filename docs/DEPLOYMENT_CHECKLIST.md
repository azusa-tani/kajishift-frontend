# デプロイ前チェックリスト

最終更新日: 2026年2月18日

## 📋 概要

このドキュメントは、KAJISHIFTフロントエンドをWebサーバーにデプロイする前に確認・修正が必要な項目をまとめたものです。

---

## ✅ 実装済み項目

以下の項目は既に実装済みです：

- ✅ `js/api.js`の`baseURL`を環境変数対応に修正
- ✅ `js/socket.js`の`serverURL`を環境変数対応に修正
- ✅ `service-worker.js`のエラーページパスを`/errors/`に修正
- ✅ `js/config.js`設定ファイルを作成

---

## 🔴 必須修正項目（デプロイ時）

### 1. 環境設定ファイルの編集

**ファイル**: `js/config.js`

**デプロイ時に編集が必要**:

本番環境にデプロイする際は、`js/config.js`ファイルを編集して、本番環境のURLを設定してください。

```javascript
// 本番環境の設定例
window.API_BASE_URL = 'https://api.kajishift.jp/api';
window.SOCKET_SERVER_URL = 'https://api.kajishift.jp';
```

**開発環境**: このファイルを編集する必要はありません（デフォルト値が使用されます）

**確認項目**:
- [ ] `js/config.js`を本番環境のURLに変更
- [ ] すべてのHTMLファイルで`config.js`を読み込んでいるか確認（`api.js`と`socket.js`の前に読み込む）
- [ ] HTTPSを使用しているか確認（本番環境では必須）

**注意**: 現在、`config.js`は作成済みですが、各HTMLファイルで読み込む必要があります。既存のHTMLファイルで`config.js`を読み込んでいない場合は、以下のように追加してください：

```html
<!-- config.jsをapi.jsとsocket.jsの前に読み込む -->
<script src="../js/config.js"></script>
<script src="../js/api.js" defer></script>
<script src="../js/socket.js" defer></script>
```

---

### 2. Service Workerのキャッシュクリア

**デプロイ後**: ユーザーのブラウザでService Workerのキャッシュをクリアする必要があります。

**確認項目**:
- [ ] デプロイ後にService Workerのバージョンが更新されているか確認
- [ ] ブラウザのキャッシュをクリアして動作確認

---

## 🟡 設定確認項目

### 4. バックエンドのCORS設定

**バックエンドの`.env`ファイル**を確認・更新：

```env
# 本番環境のフロントエンドURLを許可
CORS_ORIGIN=https://kajishift.jp

# または複数のオリジンを許可する場合
# CORS_ORIGIN=https://kajishift.jp,https://www.kajishift.jp
```

**確認項目**:
- [ ] バックエンドの`.env`ファイルで`CORS_ORIGIN`を設定
- [ ] 本番環境のフロントエンドURLが含まれているか確認
- [ ] バックエンドサーバーを再起動

---

### 5. HTTPS設定

**必須**: 本番環境ではHTTPSを使用してください。

**理由**:
- JWTトークンのセキュリティ
- Service Workerの動作要件
- ブラウザのセキュリティポリシー

**確認項目**:
- [ ] SSL証明書が設定されているか
- [ ] HTTPからHTTPSへのリダイレクトが設定されているか
- [ ] すべてのリソースがHTTPSで配信されているか

---

### 6. エラーページのサーバー設定

**Webサーバー設定**でエラーページを指定：

**Apache (.htaccess)**:
```apache
ErrorDocument 404 /errors/404.html
ErrorDocument 500 /errors/500.html
ErrorDocument 403 /errors/403.html
```

**Nginx (nginx.conf)**:
```nginx
error_page 404 /errors/404.html;
error_page 500 /errors/500.html;
error_page 403 /errors/403.html;
```

**確認項目**:
- [ ] サーバー設定でエラーページのパスを指定
- [ ] エラーページが正しく表示されるか確認

---

### 7. robots.txtとsitemap.xmlの確認

**確認項目**:
- [ ] `robots.txt`が正しく配置されているか
- [ ] `sitemap.xml`が正しく配置されているか
- [ ] 本番環境のURLに更新されているか（必要に応じて）

---

## 🟢 デプロイ方法

### 方法1: 静的ホスティングサービス（推奨）

#### Netlify

**詳細は[Netlifyデプロイ手順](NETLIFY_DEPLOY.md)を参照してください。**

1. **Netlifyアカウント作成**
   - https://app.netlify.com/ でアカウント作成

2. **プロジェクトをGitHubにプッシュ**（GitHub連携を使用する場合）
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repository-url>
   git push -u origin main
   ```

3. **Netlifyでプロジェクトをインポート**
   - Netlifyダッシュボードで「New site from Git」を選択
   - GitHubリポジトリを選択
   - ビルド設定：
     - **Build command**: （空欄 - 静的サイトのため不要）
     - **Publish directory**: `.`（ルートディレクトリ）

4. **設定ファイルの確認**
   - `netlify.toml`が正しく設定されているか確認
   - `_redirects`ファイルが存在するか確認

5. **環境変数の設定**（オプション）
   - 現在、`js/api.js`と`js/socket.js`は環境に応じて自動的にURLを切り替えるため、環境変数の設定は不要です
   - バックエンドURL: `https://kajishift-api.onrender.com`

6. **カスタムドメイン設定**（オプション）
   - Site settings → Domain management
   - カスタムドメインを追加

#### Vercel

1. **Vercelアカウント作成**
   - https://vercel.com/ でアカウント作成

2. **プロジェクトをGitHubにプッシュ**
   - 上記と同じ手順

3. **Vercelでプロジェクトをインポート**
   - Vercelダッシュボードで「New Project」を選択
   - GitHubリポジトリを選択
   - フレームワーク: **Other**（静的サイト）

4. **環境変数の設定**（オプション）
   - Project settings → Environment Variables
   - `API_BASE_URL`: `https://api.kajishift.jp/api`
   - `SOCKET_SERVER_URL`: `https://api.kajishift.jp`

#### GitHub Pages

1. **GitHubリポジトリを作成**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repository-url>
   git push -u origin main
   ```

2. **GitHub Pagesを有効化**
   - Repository settings → Pages
   - Source: `main`ブランチ、`/`（ルート）

3. **制限事項**
   - HTTPSは自動で有効
   - カスタムドメイン設定可能
   - API URLは環境変数で設定できないため、直接コードを修正する必要があります

---

### 方法2: 従来のWebサーバー（FTP/SFTP）

1. **ファイルのアップロード**
   - FTP/SFTPクライアント（FileZilla、WinSCPなど）を使用
   - すべてのファイルをサーバーのルートディレクトリにアップロード

2. **ファイル構造の確認**
   ```
   /public_html/  (または /www/ など)
   ├── index.html
   ├── admin/
   ├── customer/
   ├── worker/
   ├── css/
   ├── js/
   ├── images/
   ├── docs/
   ├── tests/
   ├── scripts/
   ├── errors/
   └── ...
   ```

3. **サーバー設定**
   - エラーページの設定（上記参照）
   - HTTPSの設定
   - ディレクトリインデックスの無効化（必要に応じて）

---

## 📝 デプロイチェックリスト

### デプロイ前

- [x] `js/api.js`の環境変数対応（実装済み）
- [x] `js/socket.js`の環境変数対応（実装済み）
- [x] `service-worker.js`のエラーページパス修正（実装済み）
- [x] `js/config.js`設定ファイル作成（実装済み）
- [ ] **`js/config.js`を本番環境のURLに編集**
- [ ] すべてのHTMLファイルで`config.js`を読み込んでいるか確認
- [ ] バックエンドのCORS設定を更新
- [ ] HTTPSが使用可能か確認
- [ ] エラーページのサーバー設定を確認
- [ ] robots.txtとsitemap.xmlを確認
- [ ] 画像パスが正しいか確認

### デプロイ後

- [ ] トップページが正しく表示されるか
- [ ] ログインページが正しく表示されるか
- [ ] API接続が正常に動作するか（ブラウザの開発者ツールで確認）
- [ ] WebSocket接続が正常に動作するか
- [ ] エラーページ（404、500、403）が正しく表示されるか
- [ ] HTTPSでアクセスできるか
- [ ] Service Workerが正常に動作するか
- [ ] モバイル表示が正しいか
- [ ] すべてのページのリンクが正しく動作するか

---

## 🔍 トラブルシューティング

### CORSエラーが発生する場合

**症状**: ブラウザのコンソールにCORSエラーが表示される

**原因**: バックエンドのCORS設定でフロントエンドのURLが許可されていない

**解決方法**:
1. バックエンドの`.env`ファイルで`CORS_ORIGIN`を確認
2. フロントエンドのURLが含まれているか確認
3. バックエンドサーバーを再起動

---

### API接続エラーが発生する場合

**症状**: APIリクエストが失敗する

**原因**: APIのベースURLが正しく設定されていない

**解決方法**:
1. ブラウザの開発者ツール（F12）でネットワークタブを確認
2. リクエストURLが正しいか確認
3. `js/api.js`の`baseURL`を確認
4. 本番環境のAPIサーバーが起動しているか確認

---

### WebSocket接続エラーが発生する場合

**症状**: チャットや通知がリアルタイムで更新されない

**原因**: WebSocketサーバーURLが正しく設定されていない

**解決方法**:
1. ブラウザの開発者ツール（F12）でコンソールを確認
2. WebSocket接続エラーの詳細を確認
3. `js/socket.js`の`serverURL`を確認
4. 本番環境のWebSocketサーバーが起動しているか確認

---

### エラーページが表示されない場合

**症状**: 404エラー時にデフォルトのエラーページが表示される

**原因**: サーバー設定でエラーページのパスが指定されていない

**解決方法**:
1. サーバー設定ファイル（`.htaccess`、`nginx.conf`など）を確認
2. エラーページのパスを`/errors/404.html`などに設定
3. サーバーを再起動

---

### Service Workerが動作しない場合

**症状**: オフライン対応が機能しない

**原因**: Service Workerの登録に失敗している

**解決方法**:
1. ブラウザの開発者ツール（F12）でApplicationタブを確認
2. Service Workersセクションでエラーを確認
3. HTTPSが使用されているか確認（Service WorkerはHTTPS必須）
4. `service-worker.js`のパスが正しいか確認

---

### 画像が表示されない場合

**症状**: 画像が読み込まれない

**原因**: 画像パスが正しくない

**解決方法**:
1. ブラウザの開発者ツール（F12）でネットワークタブを確認
2. 404エラーになっている画像のパスを確認
3. 実際のファイルパスと一致しているか確認
4. 相対パスが正しいか確認（`../images/common/`など）

---

## 📚 参考資料

- [引継ぎメモ](HANDOVER.md) - プロジェクト概要、構造
- [実装状況](IMPLEMENTATION_STATUS.md) - フロントエンド・バックエンドの実装状況
- [連携状況](INTEGRATION_STATUS.md) - フロントエンド・バックエンド連携状況
- [サーバー起動方法](README_SERVER.md) - 開発環境でのサーバー起動方法

---

## 🔐 セキュリティ注意事項

### 本番環境での必須設定

1. **HTTPSの使用**
   - JWTトークンのセキュリティのため必須
   - Service Workerの動作要件
   - ブラウザのセキュリティポリシー

2. **CORS設定**
   - 本番環境では適切なオリジンのみを許可
   - ワイルドカード（`*`）の使用は避ける

3. **環境変数の管理**
   - API URLなどの機密情報は環境変数で管理
   - コードに直接書き込まない

4. **エラーメッセージ**
   - 本番環境では詳細なエラーメッセージを表示しない
   - ユーザー向けの分かりやすいメッセージを表示

---

## 📞 サポート

デプロイ中に問題が発生した場合は、以下を確認してください：

1. **ブラウザの開発者ツール**
   - ネットワークタブでリクエストのステータスを確認
   - コンソールタブでエラーメッセージを確認

2. **サーバーログ**
   - Webサーバーのエラーログを確認
   - バックエンドサーバーのログを確認

3. **APIドキュメント**
   - Swagger UI: `https://api.kajishift.jp/api-docs`（本番環境のURL）

---

**最終更新**: 2026年2月18日
**作成者**: AI Assistant (Cursor)
