# KAJISHIFT フロントエンド

家事代行マッチングサービス「KAJISHIFT」のフロントエンドプロジェクトです。

## 📁 プロジェクト構造

```
kajishift-frontend/
├── admin/              # 管理者向けページ
├── customer/           # 顧客向けページ
├── worker/             # ワーカー向けページ
├── css/                # スタイルシート
├── js/                 # JavaScriptファイル
├── images/             # 画像ファイル
├── docs/               # ドキュメント
│   ├── HANDOVER.md
│   ├── IMPLEMENTATION_STATUS.md
│   ├── INTEGRATION_STATUS.md
│   ├── INTEGRATION_COMPLETE.md
│   ├── README_START.md
│   └── README_SERVER.md
├── tests/              # テストチェックリスト
│   ├── admin/
│   ├── customer/
│   └── worker/
├── scripts/            # サーバー起動スクリプト
│   ├── start-server.bat
│   └── start-server.ps1
├── errors/             # エラーページ
│   ├── 403.html
│   ├── 404.html
│   └── 500.html
├── index.html          # トップページ
├── manifest.json       # PWAマニフェスト
├── service-worker.js   # サービスワーカー
├── robots.txt          # SEO設定
└── sitemap.xml         # サイトマップ
```

## 🚀 クイックスタート

### サーバー起動

#### 方法1: バッチファイル（推奨）
```bash
scripts\start-server.bat
```

#### 方法2: PowerShellスクリプト
```powershell
.\scripts\start-server.ps1
```

#### 方法3: 手動起動
```bash
# Python 3を使用
python -m http.server 5500

# または Node.jsを使用
npx --yes http-server -p 5500
```

### アクセスURL

- トップページ: `http://localhost:5500/`
- 依頼者ログイン: `http://localhost:5500/customer/login.html`
- ワーカーログイン: `http://localhost:5500/worker/login.html`
- 管理者ログイン: `http://localhost:5500/admin/login.html`

## 📚 ドキュメント

### 主要ドキュメント

- **[引継ぎメモ](docs/HANDOVER.md)** - プロジェクト概要、構造、認証システム
- **[実装状況](docs/IMPLEMENTATION_STATUS.md)** - フロントエンド・バックエンドの実装状況
- **[連携状況](docs/INTEGRATION_STATUS.md)** - フロントエンド・バックエンド連携状況
- **[連携完了](docs/INTEGRATION_COMPLETE.md)** - 連携完了時の設定方法
- **[サーバー起動方法](docs/README_SERVER.md)** - サーバー起動の詳細手順
- **[デプロイ前チェックリスト](docs/DEPLOYMENT_CHECKLIST.md)** - Webデプロイ前の確認・修正項目
- **[Vercelデプロイ手順](docs/VERCEL_DEPLOY.md)** - Vercelへのデプロイ手順

### テストチェックリスト

- **[管理者テストチェックリスト](tests/admin/TEST_CHECKLIST.md)**
- **[顧客テストチェックリスト](tests/customer/TEST_CHECKLIST.md)**
- **[ワーカーテストチェックリスト](tests/worker/TEST_CHECKLIST.md)**

## 🔧 技術スタック

- **HTML5** - セマンティックHTML
- **CSS3** - カスタムプロパティ、BEM記法
- **JavaScript (ES6+)** - バニラJS（フレームワーク不使用）
- **PWA** - Service Worker、Web App Manifest

## 🔐 認証

- JWT認証（`localStorage`にトークン保存）
- 認証チェック: `js/auth.js`の`checkAuth(role)`関数を使用
- APIクライアント: `js/api.js`の`ApiClient`クラス

## 🚀 本番環境

### フロントエンド
- **本番URL**: https://kajishift-frontend.vercel.app
- **デプロイ先**: Vercel
- **CI/CD**: GitHub push → 自動デプロイ

### バックエンド
- **本番URL**: https://kajishift-backend-production.up.railway.app
- **Swaggerドキュメント**: https://kajishift-backend-production.up.railway.app/api-docs

## ⚙️ 環境設定

### 開発環境

開発環境では、デフォルト設定（`http://localhost:3000`）が使用されます。追加の設定は不要です。

### 本番環境へのデプロイ

本番環境にデプロイする際は、`js/config.js`ファイルを編集して、本番環境のURLを設定してください：

```javascript
// js/config.js
window.API_BASE_URL = 'https://kajishift-backend-production.up.railway.app/api';
window.SOCKET_SERVER_URL = 'https://kajishift-backend-production.up.railway.app';
```

詳細は[デプロイ前チェックリスト](docs/DEPLOYMENT_CHECKLIST.md)を参照してください。

## 📝 開発ガイド

### ファイル構成

- **ページファイル**: `admin/`, `customer/`, `worker/`フォルダ内
- **共通スタイル**: `css/style.css`
- **共通スクリプト**: `js/`フォルダ内
- **画像**: `images/`フォルダ内

### パス参照

- サブディレクトリからCSS: `../css/style.css`
- サブディレクトリからJS: `../js/api.js`
- サブディレクトリから画像: `../images/common/`

## 🐛 トラブルシューティング

### 404エラーが発生する場合

1. サーバーのルートディレクトリが`kajishift-frontend`フォルダになっているか確認
2. ブラウザのキャッシュをクリア
3. サーバーを再起動

### CORSエラーが発生する場合

1. バックエンドの`.env`ファイルで`CORS_ORIGIN`を確認
2. フロントエンドのポートと一致しているか確認
3. バックエンドサーバーを再起動

詳細は[README_SERVER.md](docs/README_SERVER.md)を参照してください。

## 📞 サポート

問題が発生した場合は、以下を確認してください：

1. **バックエンドサーバー**: `http://localhost:3000`で起動しているか
2. **ブラウザの開発者ツール**: ネットワークタブとコンソールを確認
3. **Swagger UI**: `http://localhost:3000/api-docs`でAPI仕様を確認

---

**最終更新**: 2026年3月

### 2026年3月の更新内容

- ✅ フロントエンド本番公開完了
  - NetlifyからVercelへ移行（クレジット問題回避）
  - 公開URL: https://kajishift-frontend.vercel.app
  - GitHubとVercelの連携設定完了（CI/CD構築）
  - 静的HTMLサイトとして正常にデプロイ（Application Preset: Other）
  - 3ロールログイン画面確認完了（依頼者・ワーカー・管理者）
  - 利用規約・プライバシーポリシー・特定商取引法ページ公開完了

### 2026年3月23日の更新内容

- ✅ バックエンドをRenderからRailwayへ移行し、接続設定を更新
  - APIベースURLをRailwayエンドポイントへ更新: `https://kajishift-backend-production.up.railway.app/api`
  - WebSocketサーバーURLをRailwayエンドポイントへ更新: `https://kajishift-backend-production.up.railway.app`
  - READMEおよび連携ドキュメント内の本番バックエンドURL表記をRailwayへ更新
  - `customer/select-worker.html` の予約ID取得ロジックを修正（`id` / `bookingId` 両対応、文字列 `"undefined"` を無効として扱うガードを追加）
  - 同ページの `loadBooking` にデバッグ出力を追加（`console.log('Fetching Booking ID:', ...)` と `console.dir(error)`）

### 2026年3月2日の更新内容

- ✅ トップページのUI改善
  - 「ご利用の流れ」ボタンのスタイル改善（`index.html`、`css/style.css`）
    - ボタンサイズを拡大（パディング: `16px 32px`、フォントサイズ: `var(--font-size-lg)`）
    - 中央配置を確実にするため`justify-content: center`と`margin: 0 auto`を追加
    - 矢印アイコンのサイズを`1em`（テキストと同じサイズ）に調整
  - 特徴カードのアイコンを画像に変更（`index.html`、`css/style.css`）
    - お金のアイコン（💰）→ `object_gamaguchi.png`
    - カレンダーのアイコン（📅）→ `business_karenda.png`
    - 盾のアイコン（🛡️）→ `business_tate.png`
    - アイコンサイズを`3.5rem`（56px）に設定し、中央配置を実装

### 2026年2月25日の更新内容

- ✅ ヘッダー・フッターのナビゲーションとスタイルを更新
  - ヘッダー: 「依頼者ログイン」「ワーカーログイン」に変更（`index.html`）
  - フッター: 「管理者」リンクを追加（`index.html`）
  - ロゴ: マークをKAJISHIFTテキストの中央上部に配置、サイズを48pxに拡大（`css/style.css`）
  - ヘッダーリンクの文字色を調整（見やすくするため）
  - ヒーローセクションのサブタイトルを白文字に変更（テキストシャドウ付き）
  - フッターリンクのスタイルを統一

### 2026年2月24日の更新内容

- ✅ 管理者登録機能追加（既存管理者のみが新しい管理者を登録可能）
  - `admin/users.html`に管理者登録モーダルとボタンを追加
  - `js/api.js`に`registerAdmin`メソッドを追加
  - `css/style.css`にモーダルのスタイルを追加
  - セキュリティ強化: `admin/login.html`から新規登録リンクを削除

### 2026年2月18日の更新内容

- ✅ デプロイ前の必須修正完了（環境自動切り替え、Service Workerパス修正）
- ✅ Vercelデプロイ設定完了（`vercel.json`作成）
- ✅ 管理者登録機能追加（`admin/register.html`作成）

**作成者**: AI Assistant (Cursor)
