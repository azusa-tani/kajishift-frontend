# テーブル定義書

Excel で一覧確認する場合は、UTF-8 BOM 付きの **[table_definition_for_excel.csv](./table_definition_for_excel.csv)** を開いてください（**区分**列で概要／カラム／インデックス／制約／備考／補足／ENUM を切り替えられます）。Markdown から再生成する場合は `node docs/database/scripts/table-definition-md-to-csv.mjs` を実行します。

## ER 図・リレーションとの対応

- **全テーブル・属性付きの ER 図**（Mermaid）: [er_diagram.md](./er_diagram.md)
- **DB FK / Prisma リレーション / サービス層 include / 論理参照（コード根拠）**（保守の主ドキュメント）: [relations.md](./relations.md)
- 本書の **物理カラム名（スネークケース）・データ型** は Prisma／マイグレーションに準拠しており、ER 図の属性名と対応します。ER 図側は Mermaid の表記の都合で型を `string` / `datetime` 等に集約している場合があります（厳密型は本書のカラム定義を優先）。

### 区分値（DB ENUM とアプリバリデーション）

- **PostgreSQL ENUM** の値は本書末尾の「付録」および `prisma/migrations` の `CREATE TYPE` に従います。
- **`payments.payment_method`** は DB 上 **TEXT** のため、許容値は **アプリコード**が正（`relations.md` の「7. 区分値」: `credit_card`, `bank_transfer`, `cash`）。
- **`notifications.type`** は DB 上 ENUM だが、作成時は **`notificationService.js` の配列**でも検証される（付録の型値と揃えること）。

対象データベース: PostgreSQL（Prisma `datasource` より）。物理名はマイグレーション SQL のスネークケースに準拠しています。  
列挙値は `prisma/migrations` の `CREATE TYPE` および `schema.prisma` の `enum` に基づきます。

---

## テーブル名：users

### 概要

依頼者（CUSTOMER）、ワーカー（WORKER）、管理者（ADMIN）を単一テーブルで表現するアカウント。ロールにより使用するカラム群が異なります（ワーカー用の口座・本人確認 URL 等）。

### カラム定義

| No | カラム名 | 論理名 | データ型 | 桁数 | NULL許可 | 主キー | 外部キー | デフォルト値 | 説明 |
|---:|---|---|---|---:|---|---|---|---|---|
| 1 | id | ID | text | 可変 | No | PK |  |  | UUID 文字列（主キー） |
| 2 | email | メールアドレス | text | 可変 | No |  |  |  | ログイン用。一意制約あり |
| 3 | password | パスワードハッシュ | text | 可変 | No |  |  |  | bcrypt 等でハッシュ化された値（平文ではない） |
| 4 | name | 氏名 | text | 可変 | No |  |  |  | 表示名 |
| 5 | phone | 電話番号 | text | 可変 | Yes |  |  |  | 任意 |
| 6 | role | ロール | UserRole |  | No |  |  | CUSTOMER | CUSTOMER / WORKER / ADMIN |
| 7 | status | アカウント状態 | UserStatus |  | No |  |  | ACTIVE | ACTIVE / INACTIVE / SUSPENDED |
| 8 | address | 住所 | text | 可変 | Yes |  |  |  | 依頼者向け想定 |
| 9 | bio | 自己紹介 | text | 可変 | Yes |  |  |  | ワーカー向け想定 |
| 10 | hourly_rate | 時給（円） | integer |  | Yes |  |  |  | ワーカー向け |
| 11 | service_area_text | 対応エリア（自由記述） | text | 可変 | Yes |  |  |  | 改行区切り等。`20260417183000` マイグレーション追加 |
| 12 | availability_text | 利用可能時間（自由記述） | text | 可変 | Yes |  |  |  | 同上マイグレーション追加 |
| 13 | rating | 平均評価 | double precision |  | Yes |  |  | 0 | 0〜5 想定（コメント）。ワーカー向け集計 |
| 14 | review_count | レビュー件数 | integer |  | No |  |  | 0 | ワーカー向け |
| 15 | approval_status | ワーカー審査状態 | WorkerApprovalStatus |  | No |  |  | PENDING | PENDING / APPROVED / REJECTED |
| 16 | bank_name | 銀行名 | text | 可変 | Yes |  |  |  | ワーカー用 |
| 17 | branch_name | 支店名 | text | 可変 | Yes |  |  |  | ワーカー用 |
| 18 | account_type | 口座種別 | text | 可変 | Yes |  |  |  | アプリコメント上 ordinary / checking。DB 制約なし |
| 19 | account_number | 口座番号 | text | 可変 | Yes |  |  |  | ワーカー用 |
| 20 | account_name | 口座名義 | text | 可変 | Yes |  |  |  | ワーカー用 |
| 21 | id_document_url | 本人確認書類 URL | text | 可変 | Yes |  |  |  | ワーカー用 |
| 22 | notification_prefs | 通知プリファレンス | jsonb | 可変 | Yes |  |  |  | `20260417200000` マイグレーション追加。構造は別途確認 |
| 23 | created_at | 作成日時 | timestamp(3) |  | No |  |  | now() |  |
| 24 | updated_at | 更新日時 | timestamp(3) |  | No |  |  |  | Prisma `@updatedAt`（アプリ更新で維持） |

### インデックス

| インデックス名 | カラム | 一意制約 | 説明 |
|---|---|---|---|
| users_pkey | id | Yes | 主キー |
| users_email_key | email | Yes | メール一意 |

### 制約

| 制約名 | 種別 | 内容 |
|---|---|---|
| users_pkey | PRIMARY KEY | id |
| users_email_key | UNIQUE | email |

### 備考

- 1 テーブルで 3 ロールを扱うため、NULL 可能列が多くロール別の業務ルールはアプリケーション側に寄りやすい。
- `account_type` の許容値は **スキーマコメントからの推測**であり DB ENUM ではない。

---

## テーブル名：bookings

### 概要

家事代行の予約。依頼者とワーカー（未確定時は NULL）、日時・サービス種別・住所・ステータス・金額を保持する。

### カラム定義

| No | カラム名 | 論理名 | データ型 | 桁数 | NULL許可 | 主キー | 外部キー | デフォルト値 | 説明 |
|---:|---|---|---|---:|---|---|---|---|---|
| 1 | id | ID | text | 可変 | No | PK |  |  | UUID |
| 2 | customer_id | 依頼者ID | text | 可変 | No |  | users(id) |  | 依頼者ユーザー |
| 3 | worker_id | ワーカーID | text | 可変 | Yes |  | users(id) |  | 未割当時 NULL。ON DELETE SET NULL |
| 4 | service_type | サービス種別 | text | 可変 | No |  |  |  | 例: 掃除・清掃。`service_menus` との整合は FK では保証されない |
| 5 | scheduled_date | 予定日時 | timestamp(3) |  | No |  |  |  | 予約枠の基準日時 |
| 6 | start_time | 開始時刻 | text | 可変 | No |  |  |  | HH:mm 形式想定（コメント） |
| 7 | duration | 所要時間 | integer |  | No |  |  |  | 時間数（整数） |
| 8 | address | 訪問先住所 | text | 可変 | No |  |  |  |  |
| 9 | notes | メモ | text | 可変 | Yes |  |  |  | 依頼者メモ |
| 10 | status | 予約ステータス | BookingStatus |  | No |  |  | PENDING | PENDING / CONFIRMED / IN_PROGRESS / COMPLETED / CANCELLED |
| 11 | total_amount | 合計金額（円） | integer |  | Yes |  |  |  |  |
| 12 | completed_at | 完了日時 | timestamp(3) |  | Yes |  |  |  | `schema.prisma` に存在。**リポジトリ内マイグレーション SQL には当該列の追加が見当たらない**（README は本番同期言及）。詳細は `questions.md` |
| 13 | created_at | 作成日時 | timestamp(3) |  | No |  |  | now() |  |
| 14 | updated_at | 更新日時 | timestamp(3) |  | No |  |  |  | Prisma `@updatedAt` |

### インデックス

| インデックス名 | カラム | 一意制約 | 説明 |
|---|---|---|---|
| bookings_pkey | id | Yes | 主キーのみ（マイグレーション上、セカンダリインデックスなし） |

### 制約

| 制約名 | 種別 | 内容 |
|---|---|---|
| bookings_pkey | PRIMARY KEY | id |
| bookings_customer_id_fkey | FOREIGN KEY | customer_id → users(id) |
| bookings_worker_id_fkey | FOREIGN KEY | worker_id → users(id) |

### 備考

- `completed_at` については **スキーマとマイグレーション履歴の差異**があり、物理 DB の確定は環境依存。不明点は `questions.md` を参照。

---

## テーブル名：payments

### 概要

予約に紐づく決済レコード。`booking_id` は一意（1 予約 1 決済を想定）。

### カラム定義

| No | カラム名 | 論理名 | データ型 | 桁数 | NULL許可 | 主キー | 外部キー | デフォルト値 | 説明 |
|---:|---|---|---|---:|---|---|---|---|---|
| 1 | id | ID | text | 可変 | No | PK |  |  | UUID |
| 2 | booking_id | 予約ID | text | 可変 | No |  | bookings(id) |  | UNIQUE。支払対象予約 |
| 3 | user_id | 支払者ID | text | 可変 | No |  | users(id) |  | 依頼者想定 |
| 4 | amount | 金額（円） | integer |  | No |  |  |  |  |
| 5 | payment_method | 決済手段 | text | 可変 | No |  |  |  | アプリでは `credit_card` / `bank_transfer` / `cash`（`paymentService.js`）。DB ENUM ではない |
| 6 | status | 決済状態 | PaymentStatus |  | No |  |  | PENDING | PENDING / COMPLETED / FAILED / REFUNDED |
| 7 | transaction_id | 外部トランザクションID | text | 可変 | Yes |  |  |  | 外部決済システム連携用 |
| 8 | created_at | 作成日時 | timestamp(3) |  | No |  |  | now() |  |
| 9 | updated_at | 更新日時 | timestamp(3) |  | No |  |  |  | Prisma `@updatedAt` |

### インデックス

| インデックス名 | カラム | 一意制約 | 説明 |
|---|---|---|---|
| payments_pkey | id | Yes | 主キー |
| payments_booking_id_key | booking_id | Yes | 予約ごとに高々 1 件 |

### 制約

| 制約名 | 種別 | 内容 |
|---|---|---|
| payments_pkey | PRIMARY KEY | id |
| payments_booking_id_key | UNIQUE | booking_id |
| payments_booking_id_fkey | FOREIGN KEY | booking_id → bookings(id) |
| payments_user_id_fkey | FOREIGN KEY | user_id → users(id) |

### 備考

- 許容値は **`paymentService.js` でホワイトリスト**（`credit_card`, `bank_transfer`, `cash`）。DB 上は自由 TEXT のため、バイパス経路に注意。

---

## テーブル名：reviews

### 概要

完了した予約に対するレビュー。`booking_id` で予約と 1:1。

### カラム定義

| No | カラム名 | 論理名 | データ型 | 桁数 | NULL許可 | 主キー | 外部キー | デフォルト値 | 説明 |
|---:|---|---|---|---:|---|---|---|---|---|
| 1 | id | ID | text | 可変 | No | PK |  |  | UUID |
| 2 | booking_id | 予約ID | text | 可変 | No |  | bookings(id) |  | UNIQUE |
| 3 | reviewer_id | レビュアーID | text | 可変 | No |  | users(id) |  | 依頼者想定 |
| 4 | reviewee_id | 被評価者ID | text | 可変 | No |  | users(id) |  | ワーカー想定 |
| 5 | rating | 評価 | integer |  | No |  |  |  | 1〜5 |
| 6 | comment | コメント | text | 可変 | Yes |  |  |  |  |
| 7 | created_at | 作成日時 | timestamp(3) |  | No |  |  | now() |  |
| 8 | updated_at | 更新日時 | timestamp(3) |  | No |  |  |  | Prisma `@updatedAt` |

### インデックス

| インデックス名 | カラム | 一意制約 | 説明 |
|---|---|---|---|
| reviews_pkey | id | Yes | 主キー |
| reviews_booking_id_key | booking_id | Yes |  |

### 制約

| 制約名 | 種別 | 内容 |
|---|---|---|
| reviews_pkey | PRIMARY KEY | id |
| reviews_booking_id_key | UNIQUE | booking_id |
| reviews_booking_id_fkey | FOREIGN KEY | booking_id → bookings(id) |
| reviews_reviewer_id_fkey | FOREIGN KEY | reviewer_id → users(id) |
| reviews_reviewee_id_fkey | FOREIGN KEY | reviewee_id → users(id) |

### 備考

- reviewer / reviewee のロール整合は **アプリケーションロジック依存**（DB CHECK なし）。

---

## テーブル名：messages

### 概要

予約単位のチャットメッセージ。

### カラム定義

| No | カラム名 | 論理名 | データ型 | 桁数 | NULL許可 | 主キー | 外部キー | デフォルト値 | 説明 |
|---:|---|---|---|---:|---|---|---|---|---|
| 1 | id | ID | text | 可変 | No | PK |  |  | UUID |
| 2 | booking_id | 予約ID | text | 可変 | No |  | bookings(id) |  |  |
| 3 | sender_id | 送信者ID | text | 可変 | No |  | users(id) |  |  |
| 4 | receiver_id | 受信者ID | text | 可変 | No |  | users(id) |  |  |
| 5 | content | 本文 | text | 可変 | No |  |  |  |  |
| 6 | is_read | 既読 | boolean |  | No |  |  | false |  |
| 7 | created_at | 作成日時 | timestamp(3) |  | No |  |  | now() | 更新カラムなし（Prisma モデルにも updatedAt なし） |

### インデックス

| インデックス名 | カラム | 一意制約 | 説明 |
|---|---|---|---|
| messages_pkey | id | Yes | 主キーのみ |

### 制約

| 制約名 | 種別 | 内容 |
|---|---|---|
| messages_pkey | PRIMARY KEY | id |
| messages_booking_id_fkey | FOREIGN KEY | booking_id → bookings(id) |
| messages_sender_id_fkey | FOREIGN KEY | sender_id → users(id) |
| messages_receiver_id_fkey | FOREIGN KEY | receiver_id → users(id) |

### 備考

- 送信者・受信者が当該予約の依頼者・ワーカーであることの保証は **DB ではなくアプリ側**。

---

## テーブル名：support_tickets

### 概要

ユーザーからの問い合わせ・サポートチケット。

### カラム定義

| No | カラム名 | 論理名 | データ型 | 桁数 | NULL許可 | 主キー | 外部キー | デフォルト値 | 説明 |
|---:|---|---|---|---:|---|---|---|---|---|
| 1 | id | ID | text | 可変 | No | PK |  |  | UUID |
| 2 | user_id | 起票ユーザーID | text | 可変 | No |  | users(id) |  |  |
| 3 | subject | 件名 | text | 可変 | No |  |  |  |  |
| 4 | content | 本文 | text | 可変 | No |  |  |  |  |
| 5 | status | チケット状態 | SupportStatus |  | No |  |  | OPEN | OPEN / IN_PROGRESS / CLOSED |
| 6 | admin_response | 管理者返信 | text | 可変 | Yes |  |  |  |  |
| 7 | admin_id | 対応管理者ID | text | 可変 | Yes |  |  |  | **users への FK はマイグレーションにない**（**コード上の関連から推測**: 管理者ユーザーの ID）。`questions.md` 参照 |
| 8 | created_at | 作成日時 | timestamp(3) |  | No |  |  | now() |  |
| 9 | updated_at | 更新日時 | timestamp(3) |  | No |  |  |  | Prisma `@updatedAt` |

### インデックス

| インデックス名 | カラム | 一意制約 | 説明 |
|---|---|---|---|
| support_tickets_pkey | id | Yes | 主キーのみ |

### 制約

| 制約名 | 種別 | 内容 |
|---|---|---|
| support_tickets_pkey | PRIMARY KEY | id |
| support_tickets_user_id_fkey | FOREIGN KEY | user_id → users(id) |

### 備考

- `admin_id` は **DB 外部キーなし**。参照先・整合性は要確認。

---

## テーブル名：notifications

### 概要

アプリ内通知（ユーザー宛）。

### カラム定義

| No | カラム名 | 論理名 | データ型 | 桁数 | NULL許可 | 主キー | 外部キー | デフォルト値 | 説明 |
|---:|---|---|---|---:|---|---|---|---|---|
| 1 | id | ID | text | 可変 | No | PK |  |  | UUID |
| 2 | user_id | 宛先ユーザーID | text | 可変 | No |  | users(id) |  |  |
| 3 | type | 通知種別 | NotificationType |  | No |  |  |  | 下記 ENUM 参照 |
| 4 | title | タイトル | text | 可変 | No |  |  |  |  |
| 5 | content | 本文 | text | 可変 | No |  |  |  |  |
| 6 | is_read | 既読 | boolean |  | No |  |  | false |  |
| 7 | related_id | 関連エンティティID | text | 可変 | Yes |  |  |  | ポリモーフィック用 |
| 8 | related_type | 関連エンティティ種別 | text | 可変 | Yes |  |  |  | 例: BOOKING, MESSAGE。正式な列挙は要確認 |
| 9 | created_at | 作成日時 | timestamp(3) |  | No |  |  | now() |  |

**NotificationType（PostgreSQL ENUM）の値**

MESSAGE, BOOKING_UPDATE, BOOKING_CREATED, BOOKING_CANCELLED, REVIEW, PAYMENT, PAYMENT_FAILED, SYSTEM, WORKER_APPROVED, WORKER_REJECTED

### インデックス

| インデックス名 | カラム | 一意制約 | 説明 |
|---|---|---|---|
| notifications_pkey | id | Yes | 主キー |
| notifications_user_id_is_read_idx | user_id, is_read | No | 一覧・未読フィルタ用 |
| notifications_user_id_created_at_idx | user_id, created_at | No | 時系列取得用 |

### 制約

| 制約名 | 種別 | 内容 |
|---|---|---|
| notifications_pkey | PRIMARY KEY | id |
| notifications_user_id_fkey | FOREIGN KEY | user_id → users(id) |

### 備考

- `related_id` / `related_type` の組合せによる参照は **FK では保証されない**。

---

## テーブル名：files

### 概要

ユーザーに紐づくアップロードファイルのメタデータ。

### カラム定義

| No | カラム名 | 論理名 | データ型 | 桁数 | NULL許可 | 主キー | 外部キー | デフォルト値 | 説明 |
|---:|---|---|---|---:|---|---|---|---|---|
| 1 | id | ID | text | 可変 | No | PK |  |  | UUID |
| 2 | user_id | 所有者ユーザーID | text | 可変 | No |  | users(id) |  |  |
| 3 | file_path | 保存パス | text | 可変 | No |  |  |  | ストレージ上のパス |
| 4 | original_name | 元ファイル名 | text | 可変 | No |  |  |  |  |
| 5 | mime_type | MIME タイプ | text | 可変 | No |  |  |  |  |
| 6 | file_size | サイズ（バイト） | integer |  | No |  |  |  |  |
| 7 | file_type | ファイル種別 | FileType |  | No |  |  | GENERAL | PROFILE_IMAGE / ID_DOCUMENT / GENERAL |
| 8 | created_at | 作成日時 | timestamp(3) |  | No |  |  | now() |  |

### インデックス

| インデックス名 | カラム | 一意制約 | 説明 |
|---|---|---|---|
| files_pkey | id | Yes | 主キー |
| files_user_id_file_type_idx | user_id, file_type | No |  |
| files_user_id_created_at_idx | user_id, created_at | No |  |

### 制約

| 制約名 | 種別 | 内容 |
|---|---|---|
| files_pkey | PRIMARY KEY | id |
| files_user_id_fkey | FOREIGN KEY | user_id → users(id) |

### 備考

- 物理ファイルの所在は `file_path` に依存。

---

## テーブル名：password_reset_tokens

### 概要

パスワードリセット用のワンタイムトークン。ユーザーごとに高々 1 件（`user_id` UNIQUE）。

### カラム定義

| No | カラム名 | 論理名 | データ型 | 桁数 | NULL許可 | 主キー | 外部キー | デフォルト値 | 説明 |
|---:|---|---|---|---:|---|---|---|---|---|
| 1 | id | ID | text | 可変 | No | PK |  |  | UUID |
| 2 | user_id | ユーザーID | text | 可変 | No |  | users(id) |  | UNIQUE。ユーザー削除時 CASCADE |
| 3 | token | トークン | text | 可変 | No |  |  |  | UNIQUE |
| 4 | expires_at | 有効期限 | timestamp(3) |  | No |  |  |  |  |
| 5 | created_at | 作成日時 | timestamp(3) |  | No |  |  | now() |  |

### インデックス

| インデックス名 | カラム | 一意制約 | 説明 |
|---|---|---|---|
| password_reset_tokens_pkey | id | Yes | 主キー |
| password_reset_tokens_user_id_key | user_id | Yes |  |
| password_reset_tokens_token_key | token | Yes |  |
| password_reset_tokens_token_idx | token | No | 検索用（UNIQUE と併存） |
| password_reset_tokens_expires_at_idx | expires_at | No | 期限切れ掃除等に利用想定 |

### 制約

| 制約名 | 種別 | 内容 |
|---|---|---|
| password_reset_tokens_pkey | PRIMARY KEY | id |
| password_reset_tokens_user_id_key | UNIQUE | user_id |
| password_reset_tokens_token_key | UNIQUE | token |
| password_reset_tokens_user_id_fkey | FOREIGN KEY | user_id → users(id) ON DELETE CASCADE |

### 備考

- `token` にユニークインデックスと非ユニークインデックスが両方ある（マイグレーション定義どおり）。

---

## テーブル名：favorites

### 概要

依頼者がワーカーをお気に入り登録した関係。

### カラム定義

| No | カラム名 | 論理名 | データ型 | 桁数 | NULL許可 | 主キー | 外部キー | デフォルト値 | 説明 |
|---:|---|---|---|---:|---|---|---|---|---|
| 1 | id | ID | text | 可変 | No | PK |  |  | UUID |
| 2 | user_id | 依頼者ユーザーID | text | 可変 | No |  | users(id) |  | お気に入りした側 |
| 3 | worker_id | ワーカーユーザーID | text | 可変 | No |  | users(id) |  | お気に入りされた側 |
| 4 | created_at | 作成日時 | timestamp(3) |  | No |  |  | now() |  |

### インデックス

| インデックス名 | カラム | 一意制約 | 説明 |
|---|---|---|---|
| favorites_pkey | id | Yes | 主キー |
| favorites_user_id_idx | user_id | No |  |
| favorites_worker_id_idx | worker_id | No |  |
| favorites_user_id_worker_id_key | user_id, worker_id | Yes | 同一ペアの重複禁止 |

### 制約

| 制約名 | 種別 | 内容 |
|---|---|---|
| favorites_pkey | PRIMARY KEY | id |
| favorites_user_id_worker_id_key | UNIQUE | (user_id, worker_id) |
| favorites_user_id_fkey | FOREIGN KEY | user_id → users(id) ON DELETE CASCADE |
| favorites_worker_id_fkey | FOREIGN KEY | worker_id → users(id) ON DELETE CASCADE |

### 備考

- 依頼者・ワーカーのロールは **DB では強制されない**（`users.role` との整合はアプリ側）。

---

## テーブル名：service_menus

### 概要

提供サービスメニューのマスタ（名称・説明・基準価格・表示順など）。

### カラム定義

| No | カラム名 | 論理名 | データ型 | 桁数 | NULL許可 | 主キー | 外部キー | デフォルト値 | 説明 |
|---:|---|---|---|---:|---|---|---|---|---|
| 1 | id | ID | text | 可変 | No | PK |  |  | UUID |
| 2 | name | サービス名 | text | 可変 | No |  |  |  |  |
| 3 | description | 説明 | text | 可変 | Yes |  |  |  |  |
| 4 | base_price | 基本料金（円） | integer |  | Yes |  |  |  |  |
| 5 | is_active | 有効フラグ | boolean |  | No |  |  | true |  |
| 6 | display_order | 表示順 | integer |  | No |  |  | 0 |  |
| 7 | created_at | 作成日時 | timestamp(3) |  | No |  |  | now() |  |
| 8 | updated_at | 更新日時 | timestamp(3) |  | No |  |  |  | Prisma `@updatedAt` |

### インデックス

| インデックス名 | カラム | 一意制約 | 説明 |
|---|---|---|---|
| service_menus_pkey | id | Yes | 主キー |
| service_menus_is_active_idx | is_active | No |  |

### 制約

| 制約名 | 種別 | 内容 |
|---|---|---|
| service_menus_pkey | PRIMARY KEY | id |

### 備考

- `bookings.service_type` との関係は **FK なし**（名称一致など **コード上の関連から推測** される程度）。

---

## テーブル名：areas

### 概要

対応エリアのマスタ。

### カラム定義

| No | カラム名 | 論理名 | データ型 | 桁数 | NULL許可 | 主キー | 外部キー | デフォルト値 | 説明 |
|---:|---|---|---|---:|---|---|---|---|---|
| 1 | id | ID | text | 可変 | No | PK |  |  | UUID |
| 2 | name | エリア名 | text | 可変 | No |  |  |  |  |
| 3 | prefecture | 都道府県 | text | 可変 | Yes |  |  |  |  |
| 4 | postal_code | 郵便番号 | text | 可変 | Yes |  |  |  | 範囲表現の可能性（コメント） |
| 5 | is_active | 有効フラグ | boolean |  | No |  |  | true |  |
| 6 | display_order | 表示順 | integer |  | No |  |  | 0 |  |
| 7 | created_at | 作成日時 | timestamp(3) |  | No |  |  | now() |  |
| 8 | updated_at | 更新日時 | timestamp(3) |  | No |  |  |  | Prisma `@updatedAt` |

### インデックス

| インデックス名 | カラム | 一意制約 | 説明 |
|---|---|---|---|
| areas_pkey | id | Yes | 主キー |
| areas_is_active_idx | is_active | No |  |

### 制約

| 制約名 | 種別 | 内容 |
|---|---|---|
| areas_pkey | PRIMARY KEY | id |

### 備考

- ユーザー・予約テーブルからの FK は **なし**（エリア選択は別テーブル化されていない）。

---

## テーブル名：system_settings

### 概要

システム全体のキー・値設定。

### カラム定義

| No | カラム名 | 論理名 | データ型 | 桁数 | NULL許可 | 主キー | 外部キー | デフォルト値 | 説明 |
|---:|---|---|---|---:|---|---|---|---|---|
| 1 | id | ID | text | 可変 | No | PK |  |  | UUID |
| 2 | key | 設定キー | text | 可変 | No |  |  |  | UNIQUE |
| 3 | value | 設定値 | text | 可変 | No |  |  |  | JSON 文字列格納可能（コメント） |
| 4 | description | 説明 | text | 可変 | Yes |  |  |  |  |
| 5 | category | カテゴリ | text | 可変 | Yes |  |  |  | 例: general / payment / notification（コメント） |
| 6 | created_at | 作成日時 | timestamp(3) |  | No |  |  | now() |  |
| 7 | updated_at | 更新日時 | timestamp(3) |  | No |  |  |  | Prisma `@updatedAt` |

### インデックス

| インデックス名 | カラム | 一意制約 | 説明 |
|---|---|---|---|
| system_settings_pkey | id | Yes | 主キー |
| system_settings_key_key | key | Yes | キー一意 |
| system_settings_category_idx | category | No |  |
| system_settings_key_idx | key | No | ユニーク索引に加え通常索引あり |

### 制約

| 制約名 | 種別 | 内容 |
|---|---|---|
| system_settings_pkey | PRIMARY KEY | id |
| system_settings_key_key | UNIQUE | key |

### 備考

- `value` のパース方針（純文字 vs JSON）は **利用コード側の確認**が必要。

---

## テーブル名：credit_cards

### 概要

顧客のクレジットカード情報のメタデータおよび外部決済トークン（PAN は保持しない想定）。

### カラム定義

| No | カラム名 | 論理名 | データ型 | 桁数 | NULL許可 | 主キー | 外部キー | デフォルト値 | 説明 |
|---:|---|---|---|---:|---|---|---|---|---|
| 1 | id | ID | text | 可変 | No | PK |  |  | UUID |
| 2 | user_id | 所有者ユーザーID | text | 可変 | No |  | users(id) |  | ユーザー削除時 CASCADE |
| 3 | last_4 | 下4桁 | text | 可変 | No |  |  |  |  |
| 4 | brand | ブランド | text | 可変 | No |  |  |  | visa 等。ENUM ではない |
| 5 | expiry_month | 有効期限（月） | integer |  | No |  |  |  |  |
| 6 | expiry_year | 有効期限（年） | integer |  | No |  |  |  |  |
| 7 | cardholder_name | 名義 | text | 可変 | No |  |  |  |  |
| 8 | is_default | デフォルトカード | boolean |  | No |  |  | false |  |
| 9 | is_active | 有効フラグ | boolean |  | No |  |  | true |  |
| 10 | token | 外部トークン | text | 可変 | Yes |  |  |  | Stripe 等 |
| 11 | created_at | 作成日時 | timestamp(3) |  | No |  |  | now() |  |
| 12 | updated_at | 更新日時 | timestamp(3) |  | No |  |  |  | Prisma `@updatedAt` |

### インデックス

| インデックス名 | カラム | 一意制約 | 説明 |
|---|---|---|---|
| credit_cards_pkey | id | Yes | 主キー |
| credit_cards_user_id_idx | user_id | No |  |
| credit_cards_user_id_is_default_idx | user_id, is_default | No | デフォルトカード参照用 |

### 制約

| 制約名 | 種別 | 内容 |
|---|---|---|
| credit_cards_pkey | PRIMARY KEY | id |
| credit_cards_user_id_fkey | FOREIGN KEY | user_id → users(id) ON DELETE CASCADE |

### 備考

- 「デフォルトは 1 枚」の排他は **ユニーク制約では表現されていない**（`questions.md` 参照）。

---

## テーブル名：worker_unavailable_slots

### 概要

ワーカー本人が登録する「利用不可」の 30 分スロット（JST の暦日 `local_date` と `slot_index` 0〜47）。

### カラム定義

| No | カラム名 | 論理名 | データ型 | 桁数 | NULL許可 | 主キー | 外部キー | デフォルト値 | 説明 |
|---:|---|---|---|---:|---|---|---|---|---|
| 1 | id | ID | text | 可変 | No | PK |  |  | UUID |
| 2 | worker_id | ワーカーID | text | 可変 | No |  | users(id) |  | ON DELETE CASCADE |
| 3 | local_date | 暦日（JST） | varchar | 10 | No |  |  |  | YYYY-MM-DD |
| 4 | slot_index | スロット番号 | integer |  | No |  |  |  | 0=00:00-00:29 … 47=23:30-23:59（スキーマコメント） |
| 5 | created_at | 作成日時 | timestamp(3) |  | No |  |  | now() |  |
| 6 | updated_at | 更新日時 | timestamp(3) |  | No |  |  |  | Prisma `@updatedAt` |

### インデックス

| インデックス名 | カラム | 一意制約 | 説明 |
|---|---|---|---|
| worker_unavailable_slots_pkey | id | Yes | 主キー |
| worker_unavailable_slots_worker_id_local_date_slot_index_key | worker_id, local_date, slot_index | Yes | 同一枠の重複禁止 |
| worker_unavailable_slots_worker_id_local_date_idx | worker_id, local_date | No | 日付範囲クエリ用 |

### 制約

| 制約名 | 種別 | 内容 |
|---|---|---|
| worker_unavailable_slots_pkey | PRIMARY KEY | id |
| worker_unavailable_slots_worker_id_local_date_slot_index_key | UNIQUE | (worker_id, local_date, slot_index) |
| worker_unavailable_slots_worker_id_fkey | FOREIGN KEY | worker_id → users(id) ON DELETE CASCADE |

### 備考

- `worker_id` が実際に `WORKER` ロールであることは **DB では保証されない**。

---

## 付録：PostgreSQL ENUM 型一覧（マイグレーションより）

| 型名 | 値 |
|---|---|
| UserRole | CUSTOMER, WORKER, ADMIN |
| UserStatus | ACTIVE, INACTIVE, SUSPENDED |
| WorkerApprovalStatus | PENDING, APPROVED, REJECTED |
| BookingStatus | PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED |
| PaymentStatus | PENDING, COMPLETED, FAILED, REFUNDED |
| SupportStatus | OPEN, IN_PROGRESS, CLOSED |
| NotificationType | MESSAGE, BOOKING_UPDATE, BOOKING_CREATED, BOOKING_CANCELLED, REVIEW, PAYMENT, PAYMENT_FAILED, SYSTEM, WORKER_APPROVED, WORKER_REJECTED |
| FileType | PROFILE_IMAGE, ID_DOCUMENT, GENERAL |
