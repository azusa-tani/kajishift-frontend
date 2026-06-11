# テーブル間リレーション一覧（保守・レビュー用）

> 2026年6月11日追記: 本書は過去時点のバックエンド確認結果を含みます。現行バックエンドで `WorkerTestSubmission` などの新規モデルや Stripe β / PaymentIntent 系の決済実装が追加されている場合、FK・Prismaリレーション・論理参照を再確認してください。

**検証ソース（再確認済み）**

| 種別 | パス |
|---|---|
| DB 制約 | `kajishift-backend/prisma/migrations/**/*.sql` |
| ORM モデル | `kajishift-backend/prisma/schema.prisma` |
| アプリのデータアクセス | `kajishift-backend/src/services/*.js`（`src/config/database.js` の `PrismaClient` を直接使用。**Repository / DAO 層は存在しない**） |

**ER 図（Mermaid・属性付き）**は [er_diagram.md](./er_diagram.md) を参照してください。本書は **FK・Prisma リレーション・コード上の include／論理参照**を表形式で整理します。

---

## 1. アーキテクチャ（データアクセス）

- **単一の Prisma クライアント**（`src/config/database.js`）を各サービスが `require` して利用。
- **SQL の JOIN を直接記述している箇所はない**（`src/index.js` の `$queryRaw` はヘルスチェック用のメタ情報取得のみ）。
- 結合は **Prisma の include / select / リレーションフィールド**、または **複数クエリ＋アプリ側の値照合**（例: `serviceType` と `service_menus.name`）で実現している。

---

## 2. 外部キー一覧（DB マイグレーションで明示）

| No | 子テーブル | 子カラム | 親テーブル | 親カラム | ON DELETE | ON UPDATE | 制約名 |
|---:|---|---|---|---|---|---|---|
| 1 | bookings | customer_id | users | id | RESTRICT | CASCADE | bookings_customer_id_fkey |
| 2 | bookings | worker_id | users | id | SET NULL | CASCADE | bookings_worker_id_fkey |
| 3 | payments | booking_id | bookings | id | RESTRICT | CASCADE | payments_booking_id_fkey |
| 4 | payments | user_id | users | id | RESTRICT | CASCADE | payments_user_id_fkey |
| 5 | reviews | booking_id | bookings | id | RESTRICT | CASCADE | reviews_booking_id_fkey |
| 6 | reviews | reviewer_id | users | id | RESTRICT | CASCADE | reviews_reviewer_id_fkey |
| 7 | reviews | reviewee_id | users | id | RESTRICT | CASCADE | reviews_reviewee_id_fkey |
| 8 | messages | booking_id | bookings | id | RESTRICT | CASCADE | messages_booking_id_fkey |
| 9 | messages | sender_id | users | id | RESTRICT | CASCADE | messages_sender_id_fkey |
| 10 | messages | receiver_id | users | id | RESTRICT | CASCADE | messages_receiver_id_fkey |
| 11 | support_tickets | user_id | users | id | RESTRICT | CASCADE | support_tickets_user_id_fkey |
| 12 | notifications | user_id | users | id | RESTRICT | CASCADE | notifications_user_id_fkey |
| 13 | files | user_id | users | id | RESTRICT | CASCADE | files_user_id_fkey |
| 14 | password_reset_tokens | user_id | users | id | CASCADE | CASCADE | password_reset_tokens_user_id_fkey |
| 15 | favorites | user_id | users | id | CASCADE | CASCADE | favorites_user_id_fkey |
| 16 | favorites | worker_id | users | id | CASCADE | CASCADE | favorites_worker_id_fkey |
| 17 | credit_cards | user_id | users | id | CASCADE | CASCADE | credit_cards_user_id_fkey |
| 18 | worker_unavailable_slots | worker_id | users | id | CASCADE | CASCADE | worker_unavailable_slots_worker_id_fkey |

---

## 3. 一意制約に伴うカーディナリティ（Prisma / DB）

| テーブル | 列 | 意味 |
|---|---|---|
| users | email | 1 メール 1 ユーザー |
| payments | booking_id | **1 予約に対し決済レコードは高々 1 件**（0 件可） |
| reviews | booking_id | **1 予約に対しレビューは高々 1 件** |
| password_reset_tokens | user_id | **1 ユーザーに対しトークン行は高々 1 件** |
| password_reset_tokens | token | トークン文字列の一意 |
| favorites | (user_id, worker_id) | 同一ペアの重複不可 |

---

## 4. Prisma スキーマ上のリレーション（Entity 対応）

`schema.prisma` の `fields` / `references` と一致。線なしは **スカラー列のみ**（FK 未定義）。

| モデル | リレーション名（概念） | 相手モデル | DB FK |
|---|---|---|---|
| User | bookingsAsCustomer | Booking[] | customer_id |
| User | bookingsAsWorker | Booking[] | worker_id |
| User | payments | Payment[] | user_id |
| User | reviewsGiven / reviewsReceived | Review[] | reviewer_id / reviewee_id |
| User | messagesSent / messagesReceived | Message[] | sender_id / receiver_id |
| User | supportTickets | SupportTicket[] | user_id |
| User | notifications | Notification[] | user_id |
| User | files | File[] | user_id |
| User | passwordResetToken | PasswordResetToken? | user_id |
| User | favorites / favoritedBy | Favorite[] | user_id / worker_id |
| User | creditCards | CreditCard[] | user_id |
| User | workerUnavailableSlots | WorkerUnavailableSlot[] | worker_id |
| Booking | customer / worker | User / User? | あり |
| Booking | payment / review | Payment? / Review? | あり（子側 UNIQUE で 0..1） |
| Booking | messages | Message[] | あり |
| Payment | booking / user | Booking / User | あり |
| Review | booking / reviewer / reviewee | Booking / User / User | あり |
| Message | booking / sender / receiver | Booking / User / User | あり |
| SupportTicket | user | User | user_id のみ。**admin_id → User は Prisma 未定義** |
| Notification | user | User | あり |
| File | user | User | あり |
| Favorite | user / worker | User / User | あり |
| CreditCard | user | User | あり |
| WorkerUnavailableSlot | worker | User | あり |
| ServiceMenu / Area / SystemSettings | （なし） | — | **他モデルから FK なし** |

---

## 5. コード上の `include` ナビゲーション（サービス別）

「API やバッチがどのグラフを読み込むか」の保守用一覧。**ここにない結合は行っていない**（同一リクエスト内）。

### 5.1 予約 `bookingService.js`

| 操作 | include / 関連の読み方 |
|---|---|
| 一覧 `getBookings` | `customer`（id,name,email,phone）, `worker`（＋`files` で `PROFILE_IMAGE` 最新 1 件） |
| 詳細 `getBookingById` | 上記に加え `review.reviewer`, `payment`（一部 select） |
| 作成／更新後 | `customer`, `worker`（＋プロフィール画像用 `files`） |

**補足**: ワーカーのプロフィール画像は **`files` テーブル**を `User` 経由でネスト取得（`WORKER_PROFILE_FILES` 定数）。**`bookings` から `files` への直接 FK はない**。

### 5.2 決済 `paymentService.js` / `receiptService.js`

| 操作 | include |
|---|---|
| 一覧・処理後の取得 | `booking` → `customer`, `worker`（worker に `files` プロフィール）, `user` |
| 領収書 `generateReceiptPDF` | 同上構成で予約・顧客・ワーカー名等を PDF に使用 |

### 5.3 メッセージ `messageService.js`

| 操作 | include |
|---|---|
| 一覧 | `sender`, `receiver`（id,name,email） |
| 送信前検証 | `booking` に `customer: true`, `worker: true`（完全オブジェクト） |
| 作成後 | `sender`, `receiver` |

### 5.4 レビュー `reviewService.js`

| 操作 | include |
|---|---|
| 作成（トランザクション内） | `reviewer`, `booking`（id, serviceType, scheduledDate） |
| ワーカー別一覧 | `reviewer`, `booking`（id, serviceType, scheduledDate） |
| ワーカー詳細内 `getWorkerById` | 同上パターンで最新 10 件 |

### 5.5 サポート `supportService.js`

| 操作 | include |
|---|---|
| 一覧・詳細・管理者更新後 | `user`（id, name, email, role）のみ。**`admin_id` の User は include していない** |

### 5.6 お気に入り `favoriteService.js`

| 操作 | include |
|---|---|
| 一覧・追加後 | `worker`（プロフィール表示用の複数列）のみ。**`user`（依頼者）側の include は未使用** |

### 5.7 その他

| サービス | 主な Prisma 操作 |
|---|---|
| `authService.js` | `passwordResetToken` で `include: { user: true }`（リセットフロー） |
| `uploadService.js` | `file.create` / `findMany` / `delete`（`userId` のみ。親 User の include は用途次第） |
| `cardService.js` | `creditCard` のみ（親 user include なしの箇所が多い） |
| `workerUnavailableSlotService.js` | `workerUnavailableSlot` の CRUD（`workerId` は JWT のユーザーと一致チェック） |
| `notificationService.js` | `notification` の一覧は **include なし**（関連エンティティは `relatedId` 参照のみ） |
| `adminService.js` | `systemSettings`, `serviceMenu`, `area`, `user`, `booking`, `payment` を個別クエリで利用（一覧は `select` 中心） |

---

## 6. 論理関連・業務参照（DB に FK なし／コード根拠）

| ID | 説明 | 根拠コード | 備考 |
|---:|---|---|---|
| L1 | **サービス削除時**、`bookings.service_type` が `service_menus.name` と **文字列一致**する予約件数を数え、1 件以上なら削除拒否 | `adminService.js` `deleteServiceMenu` 内 `prisma.booking.count({ where: { serviceType: service.name } })` | **コード上の関連**。DB は FK で保証しない。 |
| L2 | **エリアマスタ `areas`** と `bookings` / `users` には **FK なし**。エリア削除時の予約整合チェックも **未実装**（コメントで「address と照合する必要があるかも」） | `adminService.js` `deleteArea` 付近コメント | 運用上のギャップ。 |
| L3 | ワーカー検索のクエリ `area` は **`users.address` の部分一致**であり、`areas` テーブルとは結合しない | `workerService.js` `getWorkers`：`where.address = { contains: area }` | マスタ `areas` は主に管理画面用。 |
| L4 | `support_tickets.admin_id` は管理者更新時に **認証済み `adminId` を格納**。Prisma の `User` リレーションは **未定義** | `supportService.js` `updateSupportTicket` | **コード上の関連から推測**。参照整合は DB では担保されない。 |
| L5 | `notifications.related_id` / `related_type` は **ポリモーフィック**。作成箇所で `BOOKING` / `MESSAGE` / `PAYMENT` / `REVIEW` 等をセット | `bookingService`, `paymentService`, `messageService`, `reviewService`, `notificationService` 等 | FK なし。 |

---

## 7. 区分値（アプリでバリデーションされているもの）

| 対象 | 定義場所 | 値 |
|---|---|---|
| 決済手段 `payments.payment_method` | `paymentService.js` `processPayment` | `credit_card`, `bank_transfer`, `cash` |
| 通知種別 `notifications.type` | `notificationService.js` `createNotification` | `MESSAGE`, `BOOKING_UPDATE`, `BOOKING_CREATED`, `BOOKING_CANCELLED`, `REVIEW`, `PAYMENT`, `PAYMENT_FAILED`, `SYSTEM`, `WORKER_APPROVED`, `WORKER_REJECTED` |
| 口座種別 `users.account_type`（更新時） | `workerService.js` `updateWorkerProfile` | 正規化後 `ordinary` / `checking`（入力は日本語 `普通`/`当座` も可） |

ENUM 型（PostgreSQL）の一覧は [table_definition.md](./table_definition.md) 付録と一致するが、**上記の `payment_method` は TEXT** のため DB ENUM ではない点に注意。

---

## 8. テーブル分類（スキーマ上）

| テーブル | 分類 | 備考 |
|---|---|---|
| users | コア | 3 ロール単一テーブル |
| bookings | トランザクション | 予約の中核 |
| payments / reviews / messages | トランザクション | 予約またはユーザーにぶら下がる |
| support_tickets / notifications | トランザクション／通知 | |
| files / credit_cards / password_reset_tokens | 参照・マスタ補助 | ユーザーに紐づく補助データ |
| favorites | 中間 | ユーザー×ワーカー |
| worker_unavailable_slots | 参照（スケジュール） | ワーカーに依存 |
| service_menus / areas | マスタ | **他テーブルから FK なし** |
| system_settings | 設定 | **FK なし** |

**履歴専用・ワーク専用・監査ログ専用テーブル**はスキーマに存在しない（日時・ステータス列で表現）。

---

## 9. 変更時のチェックリスト（レビュー用）

1. `schema.prisma` を変更したら **マイグレーション SQL** と本書 §2 の **整合**を取る。  
2. `include` を増やしたら §5 に追記し、**N+1 や権限漏れ**（特に `bookingId` 経由）を確認。  
3. `service_menus` の **`name` 変更**は `bookings.service_type` のデータと **不整合**になり得る（FK がないため）。  
4. `admin_id` を参照する UI を追加する場合、**FK 追加を検討**（現状は整合性がアプリ依存）。
