# 不明点・確認事項一覧

解析ソースは `kajishift-backend` の `prisma/schema.prisma`、`prisma/migrations/**/*.sql`、`prisma/seed.js`、`README.md`、および **src/services 配下の JavaScript（Prisma 利用箇所）**です。リポジトリ外の本番 DB には直接アクセスしていません。コードと DB の対応表は [relations.md](./relations.md) を参照してください。

> 2026年6月11日追記: 本書は過去時点の確認事項です。現行バックエンドでワーカー審査テスト提出や Stripe β / PaymentIntent 系の実装が追加されている場合、決済手段・新規テーブル・マイグレーション履歴は再確認してください。

## スキーマとマイグレーションの乖離

| No | 項目 | 内容 |
|---:|---|---|
| 1 | `bookings.completed_at` | `schema.prisma` および `README.md`（2026-05-01 更新履歴）では `completed_at` が存在する一方、リポジトリ内の `prisma/migrations` の SQL には当該カラムを追加する `ALTER TABLE` が見当たりません。本番・検証環境でマイグレーション以外の手段で追加されたか、未コミットのマイグレーションがあるかの確認が必要です。 |
| 2 | マイグレーション履歴の完全性 | 上記のように、実 DB と Prisma スキーマの一致は `prisma migrate status` や本番 DDL のダンプで検証することを推奨します。 |

## 外部キーが定義されていないカラム

| No | 項目 | 内容 |
|---:|---|---|
| 3 | `support_tickets.admin_id` | 管理者ユーザーの ID を想定したコメントがあるが、Prisma 上は `User` へのリレーションがなく、マイグレーションにも外部キー制約はありません。参照整合性はアプリケーション層のみか、将来 FK 追加予定かの確認が必要です。 |

## 区分値・文字列カラムの取りうる値

| No | 項目 | 内容 |
|---:|---|---|
| 4 | `bookings.service_type` | DB 上は自由な `TEXT`。**確定**: サービスメニュー削除時は `adminService.js` `deleteServiceMenu` で `booking.count({ where: { serviceType: service.name } })` と **`service_menus.name` との一致**を前提にガードしている。**未確定**: 予約作成 API（`bookingService.js` `createBooking`）は **マスタ存在チェックをしておらず**任意文字列を保存し得る。フロントが常に `service_menus.name` を送る運用か、不正値の許容範囲かの仕様確認が必要です。 |
| 5 | `payments.payment_method` | **コード上の確定値**（`paymentService.js` `processPayment`）: `credit_card`, `bank_transfer`, `cash`。DB は TEXT。**確認**: クライアント・決済ゲートウェイと `cash` を含む3値で齟齬がないか。 |
| 6 | `users.account_type` | DB 制約はなし。**コード上**: `workerService.js` 更新時は `ordinary` / `checking`（および入力 `普通` / `当座` を正規化）に限定。DB を直接触る場合の値のばらつきに注意。 |
| 7 | `credit_cards.brand` | `TEXT` で `"visa"` 等の想定はコメントのみ。正規化ルールの有無を確認したいです。 |
| 8 | `notifications.related_type` | 自由な `TEXT`。シードでは `BOOKING`, `MESSAGE` 等が使われますが、公式な列挙やバリデーションの有無はコード横断確認が必要です。 |
| 9 | `notifications.related_id` | ポリモーフィック関連の ID。`related_type` と組み合わせでのみ意味が確定します。 |

## JSON・拡張設定

| No | 項目 | 内容 |
|---:|---|---|
| 10 | `users.notification_prefs` | `JSONB`。スキーマコメントは「JSON v1」ですが、キー構造・バージョン管理方針は別ドキュメントまたは API 仕様の確認が必要です。 |

## マスタテーブルとトランザクションの関係

| No | 項目 | 内容 |
|---:|---|---|
| 11 | `service_menus` / `areas` | 予約・ユーザーとは **FK なし**。**`service_menus`**: 上記 No.4 のとおり削除時のみ `service_type` と `name` の一致を利用。**`areas`**: `adminService.js` `deleteArea` は予約との整合チェックを **実装しておらず**（コメントのみ）。ワーカー検索の `area` クエリは **`users.address` の部分一致**（`areas` テーブルとは結合しない、`workerService.js`）。マスタの意図した使い分け（住所検索 vs エリアマスタ）のプロダクト確認が有用です。 |
| 12 | `system_settings` | キー・値のマスタ。`value` に JSON 文字列を格納する想定はコメントにあるが、カテゴリ・キーの一覧は運用ドキュメントまたはシードの有無で確認したいです。 |
| 16 | ER 図のリレーション線 | [er_diagram.md](./er_diagram.md) の Mermaid では **DB 上の外部キーに対応する線のみ**を描いています。`bookings` ↔ `service_menus` 等の **論理対応**は線なしで、同ファイルの「論理関連（FK 以外）」節および本書 No.4 / No.11 を参照してください。 |

## スキーマに存在しないテーブル種別

| No | 項目 | 内容 |
|---:|---|---|
| 17 | 履歴・ワーク・監査ログ専用テーブル | 現行 `schema.prisma` には **履歴テーブル・ワークテーブル・変更ログ専用テーブルは定義されていません**。時系列や状態は `created_at` / `updated_at` / 各種 status 列で表現されています。将来追加する場合は ER 図・本書の更新が必要です。 |
| 18 | `areas` マスタの利用範囲 | 管理 API で CRUD されるが、**予約・ワーカー検索の主経路では `areas.id` は使われていない**（検索は `users.address` テキスト）。`areas` を今後どの画面・整合ルールで必須にするか、または住所テキストとの二重管理をどうするかの方針確認。 |

## 論理削除・状態管理

| No | 項目 | 内容 |
|---:|---|---|
| 13 | ユーザー削除時の子レコード | `bookings` 等は多く `ON DELETE RESTRICT` のため、ユーザー物理削除は子データ次第で失敗し得ます。運用上は論理削除（`users.status`）が主かの確認が必要です。 |
| 14 | `credit_cards.is_active` / `is_default` | 複数デフォルトの禁止など DB 制約はユニークインデックスでは表現されていません（`user_id` + `is_default` のインデックスのみ）。アプリでどう排他するかの確認です。 |

## シードスクリプト

| No | 項目 | 内容 |
|---:|---|---|
| 15 | `prisma/seed.js` の削除範囲 | 実行時に `deleteMany` するテーブルとしないテーブル（例: `credit_cards`, `worker_unavailable_slots`, `service_menus`, `areas`, `system_settings` は削除していない）があり、ローカルでシードを繰り返す場合の残存データの扱いに注意が必要です。仕様として意図されているか確認です。 |
