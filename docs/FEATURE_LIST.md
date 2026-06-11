# KAJISHIFT 機能一覧（フロント + バックエンド対応表）

本書は **kajishift-frontend**（バニラ JS / 静的 HTML）および **kajishift-backend**（Express / Prisma / PostgreSQL）をソースに、機能・画面・API・実装ファイルを対応づけたものです。  
REST のパスはバックエンド `src/index.js` のマウントと各 `src/routes/*.js` に基づき **`/api` プレフィックス付き**で記載しています。

> 2026年6月11日確認: 本書は過去のバックエンド確認結果を含みます。現行コード上の新機能やβ運用中の決済については、フロントの呼び出し元とバックエンドルートを突合してから判断してください。

**リリース対象か**: 本番で利用想定の画面または API を原則 **対象**。運用専用・デバッグは **対象（運用／制限付き）**。フロントとバックで矛盾があるものは **要修正** と記載します。

---

| 大分類 | 中分類 | 機能名 | 機能概要 | 対象ユーザー | 関連画面（フロント） | 関連API（バックエンド） | 関連ファイル（主） | リリース対象か | 備考 |
|--------|--------|--------|----------|--------------|------------------------|--------------------------|---------------------|----------------|------|
| インフラ・運用 | ヘルス | API ヘルスチェック | サーバ生存確認 | 運用・監視 | （直接 HTTP） | `GET /api/health` | `kajishift-backend/src/index.js` | 対象（運用） | |
| インフラ・運用 | ヘルス | DB 診断 | DB 接続・テーブル・マイグレーション・ユーザー件数等 **※機密情報を返すため本番では制限推奨** | 運用 | （直接 HTTP） | `GET /api/health/db` | `kajishift-backend/src/index.js` | 対象（運用・制限付き） | 管理ツール向け。**推測**: 公開すると情報漏えいリスク |
| インフラ・運用 | ドキュメント | OpenAPI（Swagger UI） | REST 仕様の参照 | 開発者 | ブラウザ | `GET /api-docs` | `kajishift-backend/src/config/swagger.js` | 対象（開発） | **推測**: 本番では無効化または Basic 認証の検討 |
| インフラ・運用 | 静的配信 | アップロードファイル配信 | `uploads` 配下を `/uploads` で公開 | 全員（URL を知る者） | 画像・リンク経由 | `GET /uploads/*`（Express static） | `kajishift-backend/src/index.js` | 対象 | |
| インフラ・運用 | セキュリティ | CORS / レート制限 / Helmet | `CORS_ORIGIN`（カンマ区切り複数可）、全 API に generalLimiter、認証・パスワードリセットに個別制限 | — | — | （ミドルウェア） | `kajishift-backend/src/index.js`, `middleware/security.js` | 対象 | Socket.io も `CORS_ORIGIN` を分割して許可（`config/socket.js`） |
| リアルタイム | Socket.io | 接続・認証 | JWT（`handshake.auth.token`）検証、ACTIVE のみ、`user:{id}` ルーム | ログイン済み | 主要ページ | （Socket.io） | `kajishift-backend/src/config/socket.js`, `kajishift-frontend/js/socket.js` | 対象 | イベント: `connected`, `notification`, `message`, `unread-count` |
| リアルタイム | Socket.io | 通知プッシュ | DB 通知作成後にユーザーへ `notification` emit | ログイン済み | 同上 | （サービスから `sendNotificationToUser`） | `socket.js`, `notificationService.js` 等 | 対象 | |
| リアルタイム | Socket.io | チャットプッシュ | メッセージ保存後に受信者へ `message` emit | ログイン済み | `customer/chat.html`, `worker/chat.html` | （`sendMessage`） | `socket.js`, `messageService.js` | 対象 | フロントは `new_message` もフォールバック購読 |
| リアルタイム | Socket.io | 未読件数 | 未読通知数を `unread-count` で送信 | ログイン済み | 同上 | — | `socket.js`（両リポジトリ） | 対象 | |
| 認証 | 登録・ログイン | ユーザー登録 | JSON / multipart（ワーカーは本人確認ファイル）でユーザー作成、JWT 返却 | 新規（CUSTOMER / WORKER / **ADMIN**） | `customer/register.html`, `worker/register.html`, `admin/register.html` | `POST /api/auth/register` | `routes/auth.js`, `controllers/authController.js`, `services/authService.js` | 対象 | **バックエンドは `role` をそのまま保存**。ADMIN も `/auth/register` で作成可能 → **フロントの `admin/register.html` と整合するが、公開すると昇格リスク**。招待は `POST /api/admin/register` が望ましい |
| 認証 | セッション | ログイン | メール・パスワードで JWT 発行 | 全ロール | `customer/login.html`, `worker/login.html`, `admin/login.html` | `POST /api/auth/login` | `authService.js` | 対象 | |
| 認証 | セッション | 自分情報（JWT） | トークンからユーザー取得 | ログイン済み | （全画面・api.js 初期化） | `GET /api/auth/me` | `authController.js` | 対象 | |
| 認証 | パスワード | リセットメール・実行 | メール送信トークン・新パスワード設定 | 全員 | （フロント専用画面なし） | `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` | `authService.js`, `emailService.js` | 対象（API のみ） | フロントにパスワードリセット UI **未実装** |
| 認証 | 管理者 | 管理者招待登録 | 既存管理者のみ新規管理者を追加 | 管理者 | `admin/users.html`（モーダル） | `POST /api/admin/register` | `routes/admin.js`, `adminController.js` | 対象 | `authenticate` + `authorize('ADMIN')` |
| ユーザー | プロフィール | 自分の取得・更新 | 氏名・電話・住所・**notificationPrefs（JSON）** 等 | ログイン済み | `customer/customer-profile.html`, `worker/profile.html`, `worker/notification-settings.html` | `GET /api/users/me`, `PUT /api/users/me` | `routes/users.js`, `userController.js`, `userService.js` | 対象 | |
| ユーザー | パスワード | パスワード変更 | 現在パスワード検証後に更新 | ログイン済み | `customer/customer-profile.html`, `worker/profile.html` | `PUT /api/users/me/password` | `userController.js` | 対象 | |
| ユーザー | 参照 | ユーザー詳細（ID） | UUID でユーザー取得（認証必須） | 管理者など | `admin/user-detail.html` | `GET /api/users/:id` | `userController.js` | 対象 | 管理者画面から利用 |
| ワーカー | 検索 | ワーカー一覧・詳細（公開） | キーワード・エリア・時給・評価・**approvalStatus**（デフォルト APPROVED 想定） | 未ログイン・依頼者 | `customer/select-worker.html`, `index.html` 等 | `GET /api/workers`, `GET /api/workers/:id` | `routes/workers.js`, `workerController.js`, `workerService.js` | 対象 | `GET /workers` は **認証不要**（ルートコメント明記） |
| ワーカー | プロフィール | ワーカー本人プロフィール更新 | bio・hourlyRate 等 | ワーカー | `worker/profile.html` | `PUT /api/workers/me` | `routes/workers.js` | 対象 | |
| ワーカー | 審査テスト | 審査テスト提出・状態確認 | 現行コード上、ワーカー本人が審査テスト回答を確認・提出する画面が存在 | ワーカー | `worker/screening-test.html` | `GET/POST /api/workers/me/screening-test` | `workerTestSubmissions.js` 等 | 対象（要確認） | AI判定・再提出可否・承認フローはバックエンド現行実装との突合が必要 |
| ワーカー | スケジュール | 利用不可スロット | JST 30 分スロット（`localDate` + `slotIndex`）の一覧・作成・同期・削除 | ワーカー | `worker/calendar.html` | `GET/POST /api/workers/me/unavailable-slots`, `PUT .../sync`, `DELETE ...`, `DELETE .../:id` | `routes/workerUnavailableSlots.js`, `workerUnavailableSlotService.js`, `utils/jstSlot.js` | 対象 | `index.js` で `/api/workers/me/unavailable-slots` に **authenticate + authorize(WORKER)** を先行マウント |
| 予約 | CRUD | 予約一覧 | ロール別スコープ。**`available=true` かつ WORKER** で未割当 PENDING 案件 | 依頼者・ワーカー・管理者 | `customer/bookings.html`, `worker/jobs.html`, `admin/bookings.html` 等 | `GET /api/bookings` | `routes/bookings.js`, `bookingService.js` | 対象 | クエリ: `status`, `serviceType`, `startDate`, `endDate`, `available`, `page`, `limit` |
| 予約 | CRUD | 予約作成・詳細・更新・キャンセル | 作成は **CUSTOMER のみ**（403）。詳細は関係者のみ | 主に依頼者 | `customer/booking.html`, `booking-detail.html`, `admin/booking-detail.html` | `POST/GET/PUT/DELETE /api/bookings`, `GET/PUT /api/bookings/:id` | `bookingController.js`, `bookingService.js` | 対象 | |
| 予約 | ワークフロー | 承諾・拒否・完了 | 完了時 **`completed_at` 設定** + `COMPLETED`。拒否・完了で通知 | ワーカー | `worker/job-detail.html`, `worker/jobs.html` | `POST /api/bookings/:id/accept`, `POST .../reject`, `POST .../complete` | `bookingService.js` | 対象 | `completeBooking` は `completedAt: new Date()`（`schema.prisma` の `completed_at`） |
| 予約 | データモデル | Booking・Payment 整合 | 予約 1 件に Payment 最大 1（unique）。決済フローはβ運用中のStripe実装を含む | — | `booking-detail.js` 等 | （サービス層） | `prisma/schema.prisma`, `paymentService.js` | 対象（要確認） | 過去記録では `processPayment` 前提。現行コード上は Stripe / PaymentIntent 系の確認が必要 |
| レビュー | 評価 | レビュー投稿・一覧 | 依頼者のみ投稿。**ワーカー別一覧は認証不要** | 依頼者・全員（一覧） | `booking-detail.js`, `select-worker.js` 等 | `POST /api/reviews`, `GET /api/reviews/:workerId` | `routes/reviews.js`, `reviewService.js` | 対象 | |
| チャット | メッセージ | 取得・送信 | 予約に紐づくメッセージ。送信後 Socket でプッシュ | 依頼者・ワーカー | `customer/chat.html`, `worker/chat.html` | `GET /api/messages/:bookingId`, `POST /api/messages` | `routes/messages.js`, `messageService.js` | 対象 | |
| 決済 | 決済 | 履歴・実行 | **CUSTOMER**: 自分の決済。**ADMIN**: 全件。**WORKER**: サービス層で拒否される可能性あり | 依頼者・管理者 | `customer/payment.html`, `admin/payments.html`（一覧は要確認） | `GET /api/payments`, `POST /api/payments`, Stripe関連API（要確認） | `routes/payments.js`, `paymentService.js` | 対象（β運用中・要確認） | 現行コード上は Stripe β / PaymentIntent 系の実装が存在。`worker/rewards.html` と権限の整合は要確認 |
| 決済 | 領収書 | PDF 領収書 | PDFKit + **Noto Sans JP**（`assets/fonts`） | 依頼者（支払者） | `customer/payment.html`, `booking-detail.js` | `GET /api/payments/:id/receipt` | `paymentController.js`, `receiptService.js` | 対象 | フォント未配置時は明示エラー |
| 決済 | カード | 登録カード CRUD | 現行コード上は Stripe SetupIntent 系の導線を含むため要確認 | 依頼者 | `customer/payment.html` | `GET/POST/PUT/DELETE /api/cards`, Stripe関連API（要確認） | `routes/cards.js`, `cardService.js` | 対象（β運用中・要確認） | 本番決済ゲートウェイ、トークン保存方針、テスト/本番キーは要確認 |
| ファイル | アップロード | ファイル保存・一覧・DL・削除 | プロフィール・本人確認・チャット添付等 | ログイン済み | `worker/register.html`, `customer/chat.html`, `worker/chat.html` | `POST /api/upload`, `GET /api/upload`, `GET /api/upload/:id`, `GET /api/upload/:id/download`, `DELETE /api/upload/:id` | `routes/upload.js`, `uploadController.js` | 対象 | **整合性注意**: フロント `api.uploadFile` は FormData に **`category`** を付与。バックエンドは **`req.body.fileType`** のみ参照 → 未送信時は **`GENERAL` 固定**（チャットの `MESSAGE` は現状反映されない可能性）。ワーカー登録は `idDocument` の fieldname で `ID_DOCUMENT` 判定 |
| お気に入り | 一覧 | お気に入り CRUD・確認 | ワーカー単位 | 依頼者 | `customer/favorites.html`, `select-worker.html` | `GET/POST /api/favorites`, `DELETE /api/favorites/:id`, `DELETE /api/favorites/worker/:workerId`, `GET /api/favorites/check/:workerId` | `routes/favorites.js`, `favoriteService.js` | 対象 | |
| 通知 | アプリ内 | 通知一覧・未読数・既読・削除 | タイプフィルタ・ページネーション | 全ロール | `customer/notifications.html`, `worker/notifications.html`, `dashboard.html` | `GET /api/notifications`, `GET /api/notifications/unread-count`, `PUT /api/notifications/read-all`, `PUT /api/notifications/:id/read`, `DELETE /api/notifications/:id` | `routes/notifications.js`, `notificationService.js` | 対象 | |
| サポート | チケット | 問い合わせ作成・一覧・詳細 | 認証ユーザーがチケット操作 | 依頼者・ワーカー・管理者（一覧はロールで絞り込み **推測**） | （作成 UI なし）`admin/support.html` | `GET/POST /api/support`, `GET /api/support/:id` | `routes/support.js`, `supportService.js` | 対象 | `POST /api/support` は **フロント未接続**（`api.js` のみ） |
| サポート | チケット（管理） | 更新・削除 | ステータス・管理者返信 | 管理者 | `admin/support.html` | `PUT /api/admin/support/:id`, `DELETE /api/admin/support/:id` | `routes/admin.js`, `supportController.js` | 対象 | |
| 管理者 | ユーザー | 一覧・更新・削除 | ロール・ステータスフィルタ | 管理者 | `admin/users.html`, `admin/user-detail.html` | `GET /api/admin/users`, `PUT /api/admin/users/:id`, `DELETE /api/admin/users/:id` | `adminService.js` | 対象 | |
| 管理者 | ワーカー | 一覧・詳細・承認・更新・削除 | 審査 **APPROVED/REJECTED** | 管理者 | `admin/workers.html`, `admin/worker-detail.html` | `GET /api/admin/workers`, `GET /api/admin/workers/:id`, `PUT /api/admin/workers/:id/approve`, `PUT /api/admin/workers/:id`, `DELETE /api/admin/workers/:id` | `adminService.js` | 対象 | フロント `getAdminWorkerById` はここ。フォールバック `GET /api/workers/:id` |
| 管理者 | ワーカーテスト審査 | 提出一覧・詳細・最終判定 | 現行コード上、審査テスト提出の一覧・詳細・管理者最終判定画面が存在 | 管理者 | `admin/worker-test-submissions.html`, `admin/worker-test-submission-detail.html` | `GET /api/admin/worker-test-submissions`, `GET /api/admin/worker-test-submissions/:id`, `POST .../final-review` | `workerTestSubmissionService.js` 等 | 対象（要確認） | 承認フロー・AI一次判定・最終判定ステータスはバックエンド現行実装を確認 |
| 管理者 | レポート | 予約・売上・ユーザー・ワーカー統計 | JSON サマリー | 管理者 | `admin/dashboard.html` | `GET /api/admin/reports/bookings`, `…/revenue`, `…/users`, `…/workers` | `adminService.js`, `exportService.js` | 対象 | |
| 管理者 | レポート | CSV / Excel エクスポート | 各レポート種別 | 管理者 | `admin/users.html`, `admin/bookings.html`, `admin/payments.html`, `admin/workers.html` | `GET /api/admin/reports/{bookings,revenue,users,workers}/export/csv`, 同 `…/excel` | `adminController.js`, `exportService.js` | 対象 | |
| 管理者 | レポート | グラフ・比較・カスタム | chart / comparison / custom | 管理者 | （ダッシュボードはプレースホルダ） | `GET /api/admin/reports/chart/:reportType`, `GET …/comparison/:reportType`, `POST …/reports/custom` | `adminController.js` | 対象（API） | フロントは Chart 未接続 |
| 管理者 | 通知 | システム通知一斉送信 | ロール・ユーザー指定・メール連動オプション | 管理者 | （UI なし） | `POST /api/admin/notifications/system` | `adminController.js`, `notificationService.js` | 対象（API のみ） | |
| 管理者 | 設定 | システム設定 KV | カテゴリ別キー値 | 管理者 | （`settings.html` は **未使用**。メニュー・エリアのみ） | `GET /api/admin/settings`, `PUT /api/admin/settings` | `adminController.js` | 対象（API のみ） | |
| 管理者 | マスタ | サービスメニュー・対応エリア CRUD | 料金・表示順・有効フラグ | 管理者 | `admin/settings.html` | `GET/POST/PUT/DELETE /api/admin/services`, `GET/POST/PUT/DELETE /api/admin/areas` | `adminController.js` | 対象 | |
| 管理者 | デバッグ | ユーザー状態デバッグ | ユーザー一覧・統計（先頭 20 件） | 管理者 | （画面なし） | `GET /api/admin/debug/users` | `routes/admin.js`（インライン） | 要確認 | **本番では無効化推奨** |
| フロント専用 | UX | ロールガード | `checkAuth(role)` でトークン・ロール確認、不一致時ログインへ | 全ロール | 各保護ページ | （クライアントのみ） | `kajishift-frontend/js/auth.js` | 対象 | API の `authorize` と併用。**403 ページよりログイン誘導が主** |
| フロント専用 | PWA | Manifest・Service Worker | オフラインキャッシュ・更新検知 | 全員 | `index.html`, `manifest.json`, `service-worker.js` | — | `kajishift-frontend/` | 対象 | |
| フロント専用 | 環境 | API / Socket URL | `js/config.js` の `API_BASE_URL`, `SOCKET_SERVER_URL` | — | 全 HTML | — | `js/config.js` | 対象 | |
| 公開サイト | LP・法令 | ランディング・利用規約・プライバシー・特商法・フロー | 静的コンテンツ | 一般 | `index.html`, `terms.html`, `privacy.html`, `legal.html`, `flow.html` | — | `kajishift-frontend/*.html` | 対象 | |
| **整合性ギャップ** | ダッシュボード | 管理 KPI サマリー（任意） | フロントが `GET /api/admin/stats` を試行 | 管理者 | `admin/dashboard.html` | **`GET /api/admin/stats` はバックエンドにルートなし** | `api.js`, `admin/dashboard.html` | **要修正** | 404 を握りつぶしてレポート API にフォールバックしている |
| **整合性ギャップ** | ワーカー | ダッシュボード統計 | フロントが **管理者 API** `GET /api/admin/reports/workers` を呼び出し | ワーカー | `worker/dashboard.html` | 同上（**ADMIN のみ**） | `worker/dashboard.html`, `api.js` | **要修正** | ワーカートークンでは **403** となる設計が正しい |

---

## 補足（バックエンド構成）

| レイヤ | 主な場所 |
|--------|-----------|
| エントリ | `kajishift-backend/src/index.js` |
| ルート | `kajishift-backend/src/routes/*.js` |
| コントローラ | `kajishift-backend/src/controllers/*.js` |
| サービス | `kajishift-backend/src/services/*.js` |
| 認証 | `kajishift-backend/src/middleware/auth.js`（JWT・ロール） |
| DB | `kajishift-backend/prisma/schema.prisma` |

---

## 改訂履歴

| 日付 | 内容 |
|------|------|
| 2026-06-11 | ドキュメント整理。ワーカー審査テスト関連画面を追加し、決済・カードはβ運用中 / 要確認の表現に更新 |
| 2026-05-08 | **kajishift-backend**（`src/routes`, `services`, `prisma`）を反映し、フロントとの対応・ギャップ（`/admin/stats`、ワーカー×管理者 API、`upload` の category/fileType 等）を追記 |
