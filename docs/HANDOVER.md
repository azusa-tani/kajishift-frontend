# KAJISHIFT プロジェクト引継ぎメモ

新規担当者や AI チャットへの引継ぎ用に、**そのまま貼れる短いプロンプト**を [`HANDOVER_PROMPT.md`](./HANDOVER_PROMPT.md) にまとめています。

## 📋 プロジェクト概要

家事代行マッチングサービス「KAJISHIFT」の静的HTMLサイトです。
依頼者（customer）、ワーカー（worker）、運営者（admin）の3つのユーザータイプに対応したページ構成になっています。

> 2026年6月11日確認: この文書には初期実装時の履歴が含まれます。現行コード上は JWT / `localStorage` を中心にした認証ヘルパーがあり、一部ページで `sessionStorage` も併用されています。実装判断では `js/auth.js`、`js/api.js`、各HTMLの読み込み順を優先して確認してください。

## 📁 サイト構造

```
kajishift-frontend/
├── index.html                    # 共通TOPページ（ランディングページ）
├── errors/                       # エラーページ
│   ├── 404.html                  # 404エラーページ（ページが見つからない）
│   ├── 500.html                  # 500エラーページ（サーバーエラー）
│   └── 403.html                  # 403エラーページ（アクセス権限なし）
├── docs/                         # ドキュメント
│   ├── HANDOVER.md
│   ├── IMPLEMENTATION_STATUS.md
│   ├── INTEGRATION_STATUS.md
│   ├── dfd-kajishift.md          # DFD（Mermaid・デマルコ式）
│   ├── TASKS_REALTIME_PRODUCTION.md  # 本番リアルタイムUIギャップ・優先度
│   └── ...
├── tests/                        # テストチェックリスト
│   ├── admin/
│   ├── customer/
│   └── worker/
├── scripts/                      # サーバー起動スクリプト
│   ├── start-server.bat
│   └── start-server.ps1
├── css/
│   └── style.css                 # メインスタイルシート（全ページ共通、TOPページ含む）
├── js/
│   └── validation.js              # フォームバリデーション共通関数
├── images/                       # 画像ファイル
│   ├── common/                   # 共通画像フォルダ（全ページで使用可能）
│   │   └── README.md             # 共通画像の使用方法
│   ├── customer.png/             # 依頼者関連画像
│   ├── worker.png/               # ワーカー関連画像
│   └── hero.jpg/                 # ヒーロー画像
├── customer/                     # 依頼者向けページ（現行コード上は12ファイル）
│   ├── dashboard.html            # マイページ（認証必須）
│   ├── login.html                # ログイン画面
│   ├── register.html             # 登録画面
│   ├── booking.html              # 予約フォーム
│   ├── bookings.html             # 予約一覧
│   ├── booking-detail.html       # 予約詳細
│   ├── select-worker.html        # ワーカー選択
│   ├── payment.html               # 決済・履歴
│   ├── chat.html                 # チャット
│   ├── favorites.html            # お気に入り
│   ├── notifications.html        # 通知一覧
│   └── customer-profile.html     # 依頼者プロフィール
├── worker/                       # ワーカー向けページ（現行コード上は13ファイル）
│   ├── dashboard.html            # ダッシュボード（認証必須）
│   ├── login.html                # ログイン画面
│   ├── register.html             # 登録画面
│   ├── jobs.html                 # 仕事一覧
│   ├── job-detail.html           # 仕事詳細
│   ├── calendar.html             # カレンダー
│   ├── rewards.html              # 報酬管理
│   ├── profile.html              # プロフィール
│   ├── notifications.html        # 通知一覧
│   ├── notification-settings.html # 通知設定
│   ├── screening-test.html       # 審査テスト
│   ├── chat.html                 # チャット
│   └── password-change.html      # プロフィールへリダイレクトする旧導線
└── admin/                        # 運営者向けページ（現行コード上は14ファイル）
    ├── login.html                # ログイン画面
    ├── dashboard.html            # ダッシュボード
    ├── users.html                # 利用者管理
    ├── workers.html               # ワーカー管理
    ├── bookings.html              # 予約管理
    ├── payments.html              # 決済・売上管理
    ├── support.html               # 問い合わせ管理
    ├── settings.html              # マスタ・設定管理
    ├── user-detail.html           # 利用者詳細
    ├── worker-detail.html         # ワーカー詳細
    ├── booking-detail.html        # 予約詳細
    ├── worker-test-submissions.html # ワーカーテスト審査一覧
    └── worker-test-submission-detail.html # ワーカーテスト審査詳細
```

## 🔐 認証システム

### 実装方法
- **現行コード上の中心**: JWT を `localStorage` に保存し、`js/auth.js` の `checkAuth(role)` と `js/api.js` のトークン処理で認証状態を確認
- **互換・画面個別の状態**: 一部ページで `customerLoggedIn` / `workerLoggedIn` / `adminLoggedIn` などの `sessionStorage` フラグを併用している可能性があります
- **注意**: 認証方式を変更する場合は、ログイン画面、保護ページ、Socket、401時のリダイレクト挙動をまとめて確認してください

### 認証フロー

#### 依頼者（customer）
1. `customer/login.html` または `customer/register.html` でログイン/登録
2. 現行コード上は JWT / ユーザー情報を保存して認証状態を管理
3. `customer/dashboard.html` などの保護ページで認証チェック
   - 未認証の場合、`login.html` にリダイレクト
4. ログアウト時にトークン・ユーザー情報をクリア

#### ワーカー（worker）
1. `worker/login.html` または `worker/register.html` でログイン/登録
2. 現行コード上は JWT / ユーザー情報に加え、一部で `sessionStorage` フラグも併用
3. `worker/dashboard.html` や審査テスト画面などで認証チェック
   - 未認証の場合、`login.html` にリダイレクト
4. ログアウト時にトークン・ユーザー情報・必要に応じて互換フラグをクリア

#### 運営者（admin）
1. `admin/login.html` でログイン
2. 現行コード上は JWT / ユーザー情報を保存して認証状態を管理
3. すべての管理画面ページ（`dashboard.html`, `users.html`, `workers.html`, `bookings.html`, `payments.html`, `support.html`, `settings.html`）で認証チェック
   - 未認証の場合、`login.html` にリダイレクト
4. ログアウト時にトークン・ユーザー情報をクリア

## 🎨 デザイン仕様

### 技術スタック
- **HTML5**: セマンティックHTML
- **CSS3**: カスタムプロパティ（CSS変数）使用
- **JavaScript**: バニラJS（フレームワーク不使用）
- **レスポンシブ**: モバイルファースト設計

### デザインシステム

#### ブレークポイント
- モバイル: デフォルト（〜767px）
- タブレット: `min-width: 768px`
- デスクトップ: `min-width: 1024px`

#### 命名規則
- **BEM記法**: `block__element--modifier`
- 例: `header__nav`, `btn btn--primary`, `card-list__item`

#### CSS変数（デザイントークン）
`css/style.css` の `:root` で定義:
- カラー: プライマリ、セカンダリ、アクセント、テキスト、背景など
- スペーシング: 余白の統一値
- ボーダー: 半径、影
- コンテナ: 最大幅

### スタイルシート構成
- `css/style.css`: 全ページ共通スタイル（customer, worker, admin, TOPページ含む）
  - TOPページ専用スタイル（`.header`, `.hero`, `.category-card`など）も含む

## 🔗 リンク構造

### 共通TOP（index.html）
- ヘッダーナビゲーション:
  - `customer/dashboard.html` - 依頼者向け
  - `worker/dashboard.html` - ワーカー向け
  - `admin/login.html` - ログイン
- ヒーローセクション:
  - `customer/login.html` - 依頼者として始める
  - `worker/login.html` - ワーカーとして始める
  - `worker/jobs.html` - 仕事を探す
- CTAセクション:
  - `customer/register.html` - 依頼者として登録
  - `worker/register.html` - ワーカーとして登録

### 内部リンクパターン
- **customer/内**: 相対パス（例: `dashboard.html`, `booking.html`）
- **worker/内**: 相対パス（例: `dashboard.html`, `jobs.html`）
- **admin/内**: 相対パス（例: `dashboard.html`, `users.html`）
- **CSS参照**: `../css/style.css`（サブディレクトリから）

## 📝 主要機能

### 依頼者（customer）機能
- ✅ ログイン/登録
- ✅ ダッシュボード（認証必須）
- ✅ 予約作成（ステップ形式）
- ✅ 予約一覧（今後の予約/過去の予約）
- ✅ 予約詳細表示（完了後の決済確定・領収書・支払い方法選択、レビュー星UI。2026-05-01）
- ✅ ワーカー選択
- ✅ 決済・履歴管理
- ✅ チャット機能

### ワーカー（worker）機能
- ✅ ログイン/登録
- ✅ ダッシュボード（認証必須）
- ✅ 仕事一覧・検索
- ✅ 仕事詳細表示
- ✅ カレンダー表示
- ✅ 報酬管理
- ✅ プロフィール管理

### 運営者（admin）機能
- ✅ ログイン/認証
- ✅ ダッシュボード（KPI表示、認証必須）
- ✅ 利用者管理（検索・フィルター、認証必須）
- ✅ ワーカー管理（審査・承認、認証必須）
- ✅ 予約管理（ステータス別タブ、認証必須）
- ✅ 決済・売上管理（レポート、認証必須）
- ✅ 問い合わせ管理（認証必須）
- ✅ マスタ・設定管理（サービス、エリア、システム設定、認証必須）

## ⚠️ 注意事項・既知の問題

### CSSファイル
- ✅ **統合完了**: すべてのページが `css/style.css` を参照
- TOPページ専用スタイル（`.header`, `.hero`, `.category-card`など）も `style.css` に統合済み

### 認証の制限
- フロント側のロールガードは UX 補助であり、最終的な認可はバックエンドの JWT / ロール検証が前提
- 現行コード上は `localStorage` の JWT と一部 `sessionStorage` が混在しているため、認証まわりの変更は要確認

### 未実装機能
- ✅ 管理画面の認証機能（実装完了）
- ✅ エラーページ（404、500、403）の作成（実装完了）
- ✅ フォームバリデーション強化（実装完了）
- 画像アップロード機能（チャットなど）
- 決済の本番運用（現行コード上は Stripe β / テストモードを含む実装あり。実課金・本番キー・PSP設定は要確認）
- メール通知機能
- プッシュ通知機能

### ファイル名の統一
- 一部のファイルで命名規則が統一されていない可能性
- 例: `customer-profile.html` が存在するか確認が必要

## 🚀 次のステップ（推奨）

### 優先度: 高
1. ✅ **CSSファイルの統合**: `styles.css` と `style.css` の統合完了
2. ✅ **管理画面認証**: すべての管理画面ページに認証機能を追加完了
3. ✅ **エラーハンドリング**: 404ページ、500ページ、403ページの作成完了
4. ✅ **画像パス確認**: すべての画像パスを確認・検証完了（問題なし）

### 優先度: 中
1. ✅ **フォームバリデーション**: クライアントサイドバリデーション強化完了
2. ✅ **アクセシビリティ**: ARIA属性の追加、キーボードナビゲーション改善完了
3. ✅ **パフォーマンス**: 画像最適化、リソース優先読み込み完了
4. ✅ **SEO**: メタタグ、構造化データ、robots.txt、sitemap.xml追加完了

### 優先度: 低
1. ✅ **PWA対応**: サービスワーカー、マニフェスト完了
2. **多言語対応**: 国際化（i18n）
3. **ダークモード**: テーマ切り替え機能

## 🔍 確認方法

### 認証のテスト
1. ブラウザの開発者ツールで `sessionStorage` を確認
2. `localStorage` の `token` / `user` と、必要に応じて `sessionStorage` の互換フラグを確認
3. 未ログイン状態で保護ページにアクセス → ログインページにリダイレクトされるか確認

### リンクの確認
1. 各ページのナビゲーションリンクが正しく動作するか
2. 相対パスが正しいか（特にサブディレクトリ間の移動）
3. CSSが正しく読み込まれているか

### レスポンシブの確認
1. ブラウザの開発者ツールで各ブレークポイントを確認
2. モバイル（〜767px）、タブレット（768px〜）、デスクトップ（1024px〜）

### 画像の配置と参照
1. **共通画像**: `images/common/` フォルダに配置
   - 全ページ（customer、worker、admin）で使用可能
   - 参照例: `<img src="../images/common/logo.png" alt="ロゴ">`
2. **専用画像**: 各フォルダ内に配置
   - 依頼者専用: `images/customer.png/`
   - ワーカー専用: `images/worker.png/`
3. **パス指定**:
   - `customer/`、`worker/`、`admin/` フォルダ内から: `../images/common/`
   - `index.html` から: `images/common/`
   - CSSファイルから: `../images/common/`
4. **画像パス確認結果**:
   - ✅ `index.html`: すべて正しいパス（`images/common/...`）
   - ✅ CSS: 正しいパス（`../images/common/...`）
   - ✅ すべての参照画像ファイルが存在することを確認済み

### エラーページ
- **errors/404.html**: ページが見つからない場合のエラーページ
  - ホームページへのリンク
  - 前のページに戻るボタン
  - 主要ページへのリンク
- **errors/500.html**: サーバーエラーが発生した場合のエラーページ
  - ホームページへのリンク
  - ページ再読み込みボタン
  - 主要ページへのリンク
- **errors/403.html**: アクセス権限がない場合のエラーページ
  - ホームページへのリンク
  - ログインページへのリンク
  - 各ユーザータイプのログインページへのリンク

## 📚 参考情報

### 使用技術
- HTML5
- CSS3（カスタムプロパティ、Flexbox、Grid）
- JavaScript（ES6+）
- フレームワーク: なし（バニラJS）

### フォームバリデーション
- **共通バリデーション関数**: `js/validation.js`
  - メールアドレス、パスワード、電話番号、カード番号などのバリデーション
  - リアルタイムバリデーション（入力中にエラー表示）
  - パスワード強度インジケーター
  - 自動フォーマット機能（電話番号、カード番号、有効期限）
- **実装済みフォーム**:
  - ✅ 依頼者ログイン/登録フォーム
  - ✅ ワーカーログイン/登録フォーム
  - ✅ 管理画面ログインフォーム
  - ✅ 予約フォーム

### SEO最適化
- **メタタグ**:
  - `description`: 各ページに適切な説明文を追加
  - `keywords`: 主要キーワードを設定（index.htmlのみ）
  - `robots`: ログインページやダッシュボードは`noindex, nofollow`に設定
- **Open Graph / Twitter Cards**:
  - `index.html`にOGPタグとTwitter Cardsを追加
  - SNSシェア時の表示を最適化
- **構造化データ（JSON-LD）**:
  - Organization（組織情報）
  - WebSite（サイト情報）
  - Service（サービス情報とカタログ）
- **Canonical URL**: 全ページにcanonical URLを設定
- **robots.txt**: 
  - 管理画面、ログインページ、ダッシュボードを除外
  - トップページのみインデックス許可
- **sitemap.xml**: 
  - トップページのみ含める
  - プライベートページは除外

### パフォーマンス最適化
- **画像の遅延読み込み**: 
  - ロゴ画像以外の画像に`loading="lazy"`を追加
  - ロゴ画像は`loading="eager"`で即座に読み込み
- **リソースの優先読み込み**:
  - CSSファイルに`<link rel="preload">`を追加
  - JavaScriptファイルに`defer`属性を追加
  - ヒーロー背景画像に`preload`を追加
- **最適化の推奨事項**:
  - 本番環境ではCSS/JSファイルの最小化を推奨
  - 画像のWebP形式への変換を推奨
  - CDNの利用を検討

### ブラウザ対応
- モダンブラウザ（Chrome, Firefox, Safari, Edge）
- モバイルブラウザ（iOS Safari, Chrome Mobile）

### 開発環境
- エディタ: Cursor
- OS: Windows 10
- ワークスペース: `C:\Users\谷口 梓\Desktop\家事代行_html`

## 📞 連絡事項

- プロジェクトは静的サイトとして完成
- バックエンドAPIとの連携は未実装
- 実際の運用にはサーバーサイドの実装が必要

---

## 📅 更新履歴（2026年4月8日）

- ✅ `worker/calendar.html` … カレンダー表示日のタイムゾーン修正（`formatLocalYMD`、API 月範囲もローカル日付で指定）
- ✅ `docs/dfd-kajishift.md` … フロントエンド全体のデータフロー図（レベル0〜2、運営向け要約、実装対応）
- ✅ `docs/TASKS_REALTIME_PRODUCTION.md` … 本番リアルタイム表示の未対応箇所と優先度（バックエンド Socket 前提）
- ✅ `.gitignore` … `.vercel` を除外

## 📅 更新履歴（2026年3月27日）

- ✅ `worker/dashboard.html` の安定化対応
  - ワーカー権限で失敗する API 呼び出しを整理
    - `api.getPayments({ limit: 100 })` を削除
    - 管理者用レポート（`getAdminWorkerReport`）フォールバック呼び出しを削除
  - 報酬サマリーは `payments = []` でも安全に描画されるように維持
- ✅ 「今日の予定（today-schedule）」を動的レンダリングへ変更
  - `api.getBookings({ status: 'CONFIRMED,IN_PROGRESS,COMPLETED', limit: 20 })` で取得
  - 当日分のみ抽出し、時間昇順でタイムライン表示
  - ステータスバッジを `CONFIRMED/IN_PROGRESS/COMPLETED` に対応（作業前/作業中/完了）
  - 予定なし時に「本日の予定はありません」を表示
- ✅ 「新しい仕事の依頼」の取得条件を調整
  - 一時的に `CREATED,PENDING` を試験した後、バックエンド `BookingStatus` 非対応により `PENDING` のみに戻して 500 エラーを解消

**最終更新**: 2026年4月8日
**作成者**: AI Assistant (Cursor)
