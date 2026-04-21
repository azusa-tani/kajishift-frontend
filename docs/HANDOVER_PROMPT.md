# 引継ぎプロンプト（新規チャット用）

以下のブロックを **そのままコピー** し、Cursor の新規チャットの先頭に貼り付けてください。続けて具体的な依頼（例: 「admin/payments.html を API 連携する」）を書いてください。

---

## コピー用プロンプト（ここから）

あなたは **KAJISHIFT（家事代行マッチング）** のフロントエンド担当として、`kajishift-frontend` リポジトリで作業する。

### プロジェクト概要

- **形態**: バニラ HTML / CSS / JS の静的サイト（フレームワークなし）。
- **利用者**: 依頼者 `customer/`、ワーカー `worker/`、運営 `admin/` の各サブディレクトリにページがある。
- **バックエンド**: 別リポジトリ **kajishift-backend**（Node / Express / Prisma / PostgreSQL）。本番は Railway 等にデプロイ。フロントは `js/config.js` と `js/api.js` の `ApiClient` で REST API と通信する。
- **認証**: JWT を `localStorage` に保存。`js/auth.js` の `checkAuth('customer'|'worker'|'admin')` でガード。`js/api.js` の `token` / `getUser()` / `setUser()` と連動。**`docs/HANDOVER.md` など古い記述で sessionStorage のみと書いてある場合は現状と不一致なので、`auth.js` と各ページの実装を正とする。**

### このリポジトリで触る主なファイル

| 領域 | パス |
|------|------|
| 共通スタイル | `css/style.css`（巨大。ページ固有は `.customer-page` 等でスコープすることが多い） |
| API クライアント | `js/api.js`（`ApiClient`。管理者用は `/admin/*` や `/admin/reports/*` 等） |
| 認証ヘルパー | `js/auth.js`（`showError` / `showSuccess` は画面上のアラート表示。管理画面ではローカルで上書きしない） |
| 環境・API ベース URL | `js/config.js` |
| リアルタイム通知（Socket.IO） | `js/socket.js`（通知バッジ・一覧の一部ページで利用） |

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

### 管理者画面（admin/）の実装メモ（2026年4月頃・要コード確認）

- **`admin/dashboard.html`**: KPI はレポート API（`getAdminUserReport` 等）で埋めたうえで、**`api.getAdminStats()`**（`GET /admin/stats`）が成功すれば数値のみ上書き。今日の予約テーブルは **最大5件**。「今日の予約」「審査待ち」等は `unwrapApiPayload` で `bookings` / `workers` / `tickets` を取り出し。
- **`admin/users.html` / `workers.html`**: `getAdminUsers` / `getAdminWorkers` に検索条件を渡す。CSV/Excel は `downloadCSV` / `downloadExcel`（`get*ExportParams()` で現在フィルターを反映）。
- **`admin/bookings.html`**: ステータスタブは HTML の tbody id（`confirmed-table-body` 等）と API の `CONFIRMED` 等を **マッピング**（`BOOKING_STATUS_TAB`）。件数表示は **`pagination.total`** を優先。
- **`js/api.js`**: **`getAdminStats()`** が追加されている（バックエンド未実装ならダッシュボードはレポートのみで表示）。

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
- 長いタスク全文（画面単位の仕様書）は **このファイルに貼りすぎず**、必要なら `docs/` に別ファイルを切るか、チケットに残す。
