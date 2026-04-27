# 引継ぎプロンプト（新規チャット用）

以下のブロックを **そのままコピー** し、Cursor の新規チャットの先頭に貼り付けてください。続けて具体的な依頼（例: 「admin/payments.html を API 連携する」）を書いてください。

---

## コピー用プロンプト（ここから）

あなたは **KAJISHIFT（家事代行マッチング）** のフロントエンド担当として、`kajishift-frontend` リポジトリで作業する。（フルスタック依頼のときは同じマシン上の **`kajishift-backend`** を開き、API や Prisma も編集する。）

### プロジェクト概要

- **形態**: バニラ HTML / CSS / JS の静的サイト（フレームワークなし）。
- **利用者**: 依頼者 `customer/`、ワーカー `worker/`、運営 `admin/` の各サブディレクトリにページがある。
- **バックエンド**: 別リポジトリ **kajishift-backend**（Node / Express / Prisma / PostgreSQL）。本番は Railway 等。フロントは `js/config.js` の `window.API_BASE_URL` と `js/api.js` の `ApiClient` で REST と通信する。
- **認証**: JWT を `localStorage` に保存。`js/auth.js` の `checkAuth('customer'|'worker'|'admin')` でガード。`js/api.js` の `token` / `getUser()` / `setUser()` と連動。**`docs/HANDOVER.md` などで sessionStorage のみと書いてある記述は古い。`auth.js` と各ページを正とする。**

### このリポジトリ（フロント）で触る主なファイル

| 領域 | パス |
|------|------|
| 共通スタイル | `css/style.css`（巨大。ページ固有は `.customer-page` 等でスコープすることが多い） |
| API クライアント | `js/api.js`（`ApiClient`。管理者用は `/admin/*` や `/admin/reports/*` 等） |
| 認証ヘルパー | `js/auth.js`（画面上の `showError` / `showSuccess` と名前が被る場合あり。フィールド直下のエラーは `js/validation.js` 側を確認） |
| フォーム共通バリデーション | `js/validation.js` |
| 環境・API ベース URL | `js/config.js`（本番例: `https://kajishift-backend-production.up.railway.app/api`） |
| リアルタイム通知（Socket.IO） | `js/socket.js` |

### バックエンドリポジトリ（`kajishift-backend`）の実装メモ

- **予約・決済 API**: `bookingService.js` / `paymentService.js` で、レスポンスの `booking.worker` に **`profileImageUrl`**（プロフィール画像の公開 URL。`File` の `PROFILE_IMAGE` から生成）を付与。`serializeBooking` / `WORKER_PROFILE_FILES` を `bookingService` からエクスポートし決済側でも利用。
- **認証登録**: `authController.js` / `authService.js`。メール重複などクライアント起因は **`httpError` / 400** や Prisma `P2002` 処理で返す実装がある。**変更前に現行コードを読むこと。**
- **予約詳細の権限**: 権限・存在エラーは **403 / 404** で返す整理が入っている（コミット例: `fix(bookings): 予約詳細の権限エラーを403/404で返すよう整理`）。

### ドキュメント（優先して読むとよいもの）

- `docs/HANDOVER.md` … サイト構造・歴史的メモ（**一部古い記述あり**。実装はコード優先）。
- `docs/INTEGRATION_STATUS.md` … フロントとバックエンドの連携・URL 変更履歴。
- `docs/IMPLEMENTATION_STATUS.md` … 機能一覧・実装状況。
- `docs/TASKS_REALTIME_PRODUCTION.md` … 本番での Socket / CORS 等の注意。
- `docs/dfd-kajishift.md` … データフロー（Mermaid）。
- ローカル確認: `docs/README_START.md`（静的サーバの起動方法）。

### 開発時の注意

- **相対パス**: `customer/` からは `../css/style.css` / `../js/api.js` など。
- **レスポンス形**: エンドポイントによって `{ data: ... }` ネストの有無が混在しうる。**一覧・ダッシュボードでは `response.data !== undefined ? response.data : response` 相当の正規化（ページ内の `unwrapApiPayload` 等）を既存パターンに合わせる。**
- **デプロイ**: フロントは Vercel 想定の記述が多い。`config.js` の本番 API URL とバックエンドの `CORS_ORIGIN` を整合させること（詳細は `TASKS_REALTIME_PRODUCTION.md`）。
- **管理画面のフィルター**: マークアップは **`admin-filter-section`** クラス。イベントは **`.filter-section` ではなく** `.admin-filter-section` 内のボタン／入力にバインドする。主要入力には **`id` を付けて取得**する方が安全。

### 管理者画面（admin/）の実装メモ（要コード確認）

- **`admin/dashboard.html`**: KPI はレポート API（`getAdminUserReport` 等）で埋めたうえで、**`api.getAdminStats()`**（`GET /admin/stats`）が成功すれば数値のみ上書き。今日の予約テーブルは **最大5件**。「今日の予約」「審査待ち」等は `unwrapApiPayload` で `bookings` / `workers` / `tickets` を取り出し。
- **`admin/users.html` / `workers.html`**: `getAdminUsers` / `getAdminWorkers` に検索条件を渡す。CSV/Excel は `downloadCSV` / `downloadExcel`（`get*ExportParams()` で現在フィルターを反映）。
- **`admin/bookings.html`**: ステータスタブは HTML の tbody id（`confirmed-table-body` 等）と API の `CONFIRMED` 等を **マッピング**（`BOOKING_STATUS_TAB`）。件数表示は **`pagination.total`** を優先。
- **`js/api.js`**: **`getAdminStats()`** が追加されている（バックエンド未実装ならダッシュボードはレポートのみで表示）。

### 依頼者 UI メモ（要コード確認）

- **`customer/notifications.html`**: 通知はカード型 UI。HTML は **`buildNotificationCardHTML()`** で生成。スタイルは `css/style.css` の **Customer notifications** 付近（`.customer-page .notification-card` 等）。空一覧は `.notifications-empty`。

### ユーザーからの要望（会話スタイル）

- 回答は **日本語**。
- 依頼範囲外のリファクタや、**依頼のない Markdown 更新は避け**、依頼に必要な差分に留める。

以上を前提に、次のタスクを実行してください：

**（ここに具体的な依頼を書く）**

---

## コピー用プロンプト（ここまで）

---

## 依頼の書き方の例（短くてよい）

```
admin/support.html を getSupportTickets と連携し、未読フィルターと詳細リンク（?id=）を動かして。
```

```
customer/booking-detail.html のワーカー画像が出ない。Network と api.js の getBookingById レスポンス形を確認して表示を直して。
```

---

## メンテナンス用メモ（このファイル自体の更新）

- 大きな機能追加・デプロイ先変更・認証方式の変更があったら、上記ブロック内の該当箇所を更新する。
- `HANDOVER.md` の記述と矛盾したら **コードと INTEGRATION_STATUS を正** とし、本プロンプト側を直す。
- 長いタスク全文（画面単位の仕様書）は **このファイルに貼りすぎず**、必要なら `docs/` に別ファイルを切るか、チケットに残す。コピー用ブロック末尾は常に **「（ここに具体的な依頼を書く）」** のプレースホルダに戻す。
