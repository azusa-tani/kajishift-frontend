# KAJISHIFT リリース判定用 テスト観点一覧

> 2026年6月11日追記: 本書には旧決済フローや過去時点の観点が含まれます。現行コード上は Stripe β / PaymentIntent 系の実装、およびワーカー審査テスト関連画面が存在するため、決済・審査・管理APIの観点はフロントとバックエンドの現行コードを突合してから判定してください。

## 1. 文書の目的

本書は **リリース判定（Go / No-Go）** に使うための**テスト観点の網羅リスト**である。実施記録は `docs/RELEASE_TEST_RESULTS.md`、不具合は `docs/RELEASE_DEFECT_LIST.md`、合格基準は `docs/RELEASE_CRITERIA.md`、手順は `docs/RELEASE_PROCEDURE.md`、切り戻しは `docs/ROLLBACK_PROCEDURE.md` を**今後作成する資料として併用する**。

**リリース判定への使い方（必須）**

- **重要度「高」**の観点は、**原則としてリリース前にすべて実施**し、**重大な未解決不具合がないこと**をリリース条件とする。
- **重要度「高」**で **未実施**または **NG** がある場合は、**原則リリース不可**。例外は **リリース判定会議での承認**が必要。
- **重要度「中」**は**リリース前実施を推奨**。未実施の場合は**残課題**として管理し、影響を記録する。
- **重要度「低」**は**可能なら実施**。**リリース後対応**でもよい。

**「リリース必須」列との関係**

- **Yes** … 当該観点が **OK** でないとリリース判断に支障（`docs/RELEASE_CRITERIA.md` は**今後作成する資料として併用する**。その Must に近い）。
- **条件付き** … スコープ・リスクによりリリース判定会議で要否を決める。
- **No** … リリースブロッカーには通常しない（実施推奨度は「重要度」で区別）。

---

## 2. 前提

- 対象は **kajishift-frontend**（本リポジトリ）および **kajishift-backend** とする。**kajishift-backend は別リポジトリとして参照する**（ローカルパスや個人環境に依存する記載は本資料に含めない）。
- 本番想定は README 上 **Vercel（フロント）** と **Railway（バックエンド）**。
- **本フロントリポジトリに `package.json` はなく**、**自動テストコード・CI 上のテスト実行設定は検出されていない**（手動または別途作成が前提）。
- Netlify 関連資料は Vercel移行前の参考資料として扱う。

### 2.1 ワーカー管理（スタッフ管理）の表記

- 本フロントエンドでは **`worker` ロール**と `worker/` 配下画面を使用している（**事実**）。
- 本資料の分類名 **「ワーカー管理（スタッフ管理）」** は、業務上の **「スタッフ」を原則 `worker` と同義**として扱う。
- **別ロールとしてのスタッフ**（ワーカー以外）がプロダクトに存在する場合は **要確認**。

---

## 3. 事実

### 3.1 フロントエンド（kajishift-frontend）

- **バニラ JS**：`js/api.js`（`ApiClient`）、`js/auth.js`（`checkAuth`）、`js/config.js`（`API_BASE_URL` / `SOCKET_SERVER_URL`）。
- **ロール**：画面は `customer/`・`worker/`・`admin/`。`checkAuth('customer'|'worker'|'admin')` は **小文字**で比較（`user.role.toLowerCase()`）。
- **JWT**：`localStorage` の `token` / `user`。401 時に `clearToken` と **該当ロールのログイン URL へリダイレクト**（`api.js`）。
- **ロール不一致時**：`checkAuth` は **`redirectToLogin`**。**HTTP 403 専用ページに必ず飛ばす実装ではない**（`errors/403.html` は別途存在）。
- **`tests/`**：`tests/customer|worker|admin/TEST_CHECKLIST.md` のみ。**実行可能なテストスクリプトではない**。
- **デプロイ**：`vercel.json` で `@vercel/static`。README 上 **GitHub push → Vercel 自動デプロイ**。

### 3.2 バックエンド（kajishift-backend）

- **`middleware/auth.js`**：`authenticate` で Bearer 必須、失敗時 **401**。`authorize(...roles)` でロール不一致 **403**（**事実**）。
- **`index.js`**：`CORS_ORIGIN`（未設定時既定 `https://kajishift-frontend.vercel.app`）、`/api` にレート制限、`/api-docs` で Swagger UI、**`/api/health`**・**`/api/health/db`** あり。
- **`routes/workers.js`**：`GET /api/workers` および `GET /api/workers/:id` は **ルートに `authenticate` を付けていない**（コメントで公開閲覧を明記）。**事実**。
- **`routes/admin.js`**：`router.use(authenticate)` 後 **`authorize('ADMIN')`**。**事実**。
- **`paymentService.js`**（過去確認）：既存決済 **COMPLETED** に対する再 `processPayment` はエラーにする実装がある。**事実**（二重決済防止の観点で参照）。
- **`config/socket.js`**：Socket.io が **`CORS_ORIGIN` をカンマ分割**して許可、JWT 検証に **`JWT_SECRET`**。**事実**。

---

## 4. 推測

- 個別 API のバリデーションメッセージや **404 と 403 の使い分けのすべて**は、エンドポイントごとにバックエンド実装次第。断定できない内容は §10 の表において、備考欄に **「推測」** または **「要確認」** と明記する。
- **本番 Railway** の正確なデプロイコマンド・マイグレーション実行タイミングは、ダッシュボード設定次第（**推測**：`npm start` + `prisma migrate deploy` は一般的）。

---

## 5. 要確認

- **別ロールとしての「スタッフ」**（ワーカー以外）がドメイン上存在するか。
- **フロント `api.uploadFile` の `category`** とバック **`uploadController` の `fileType`** の完全互換（既知のギャップ疑い）。
- **フロント `GET /api/admin/stats`** とバックのルート有無の整合（別資料でギャップ指摘あり）。
- **ワーカー**が **`GET /api/payments`** を呼んだ場合の成否（`paymentService` は CUSTOMER/ADMIN のみ、**事実**）。
- **ステージング**の有無、**E2E 基盤**、**性能閾値**、**本番で `/api-docs`・`/api/health/db` を公開してよいか**。
- **CSV 取込**機能の有無（エクスポートは実装あり）。
- **決済**が**外部決済サービス（PSP）と連携**しているか、**アプリケーション内の決済ステータス管理のみ**か（コード上は `paymentMethod` 等の取り扱いまで確認できるが、PSP の有無は **要確認**）。

---

## 6. 重要度の定義

| 重要度 | 定義 | リリース判定での位置づけ |
|--------|------|-------------------------|
| **高** | 主要業務・認証・権限・予約・決済・管理・本番接続・重大セキュリティに直結 | **原則リリース前に全件実施**。未実施・NG は原則リリース不可（会議承認で例外） |
| **中** | 副次機能・運用品質・エッジに近いが影響は中程度 | **実施推奨**。未実施は**残課題管理** |
| **低** | 軽微・補助・リリース後でもよい範囲 | **可能なら実施**。**リリース後対応可** |

---

## 7. 自動化可否の定義

**前提：本リポジトリには現時点で自動テストコードやテスト実行設定が検出されていない。**

| 値 | 意味 |
|----|------|
| **自動化可** | **現時点で自動テストが存在するという意味ではない**。将来 **E2E（Playwright 等）や API テスト**として組み込みやすい観点であることを示す。 |
| **手動** | **ブラウザ操作**または **curl / Postman 等の API クライアント**での確認が主であることを示す。 |
| **要確認** | **テスト基盤・外部環境・バックエンド仕様・閾値**が未確定のため、自動化・手動の切り分けや実施方法が要判断であることを示す。 |

いずれの行も、**現時点で CI 上の自動実行があるとは記載しない**。

---

## 8. 確認範囲の定義

| 確認範囲 | 含む例 |
|----------|--------|
| **フロントエンド** | 画面表示、入力制御、`checkAuth`、クライアント側ルーティング、`config.js` |
| **バックエンド** | API 権限、ビジネスロジック、Prisma・トランザクション、Socket サーバ処理 |
| **インフラ** | CORS・SSL・デプロイ先（Vercel/Railway）、レート制限、環境変数注入 |
| **外部サービス** | SMTP、**要確認**: 外部決済サービス（PSP）連携の有無（内部の決済ステータス管理のみかは **要確認**） |
| **運用** | 監視、問い合わせ対応、リリース後フォロー |
| **複合** | 決済・チャット・ログイン等、**フロント＋バック＋インフラ**が一体となる観点 |

---

## 9. リリース不可となる主な条件

以下のいずれかに該当する場合、**原則リリース不可**とする（不具合の記録・管理には `docs/RELEASE_DEFECT_LIST.md` を**今後作成する資料として併用する**。判定会議の運用は **要確認**）。

1. **ログインできない**（全ロールまたは業務上必須ロールで成立しない）。
2. **ロール不一致**なのに、**本来アクセスできない画面または API にアクセスできる**（越権）。
3. **予約の作成・変更・キャンセル**が正常にできない。
4. **ワーカーの承諾・拒否・完了**が正常にできない。
5. **決済**で **二重決済**、**失敗時の不整合**、**領収書（PDF）出力不可**などが発生する。
6. **顧客・ワーカー・予約・決済**データが**誤って**登録・更新・削除される。
7. **管理者の主要機能**（ユーザー停止、ワーカー承認、予約管理、支払い・売上確認等）が正常にできない。
8. **個人情報、JWT、認証情報、管理画面情報**が不適切に露出する。
9. **本番 API、Socket、CORS、SSL** 等、外部公開に必要な設定が誤っている。
10. **本番リリース後に切り戻しできない**（バックアップ・手順・マイグレーション方針が整っていない等）。**詳細は `docs/ROLLBACK_PROCEDURE.md`（今後作成する資料として併用する）および運用（要確認）**。
11. **重要度「高」**の観点に **未実施または NG** があり、**リリース判定会議で承認されていない**。

---

## 10. テスト観点一覧

**列「備考」**：依存先を **`依存:〜`** で示す。**推測または未確定の内容は、備考欄に「推測」または「要確認」と明記する**。

| No | 分類 | テスト対象 | テスト観点 | 確認内容 | 重要度 | リリース必須 | 確認範囲 | 自動化可否 | 備考 |
|----|------|------------|------------|----------|--------|--------------|----------|------------|------|
| L01 | ログイン・認証 | 各 `*/login.html` | 正常ログイン | 正しい資格情報でログインし、`localStorage` に token / user が保存される | 高 | Yes | 複合 | 自動化可 | 依存:バック `POST /api/auth/login`、JWT |
| L02 | ログイン・認証 | 同上 | 誤認証 | 誤パスワードでエラー、不正トークンが残らない | 高 | Yes | 複合 | 自動化可 | 依存:バック認証 |
| L03 | ログイン・認証 | `api.js` | 401 時 | 保護 API が 401 のとき `clearToken` とログインへ誘導 | 高 | Yes | 複合 | 自動化可 | 依存:バック 401 |
| L04 | ログイン・認証 | `customer/register.html` | 依頼者登録 | 登録完了後にログイン可能 | 高 | Yes | 複合 | 手動 | 依存:バック `POST /api/auth/register` |
| L05 | ログイン・認証 | `worker/register.html` | ワーカー登録 | `registerWithFile`（本人確認ファイル）が完了 | 高 | Yes | 複合 | 手動 | 依存:バック register + **ファイルアップロード** |
| L06 | ログイン・認証 | `admin/register.html` | 管理者登録 | `role: ADMIN` で登録できる挙動 | 中 | 条件付き | 複合 | 手動 | **要確認**: 本番で URL 公開方針。依存:バック |
| L07 | ログイン・認証 | `auth.js` / `logout` | ログアウト | トークン削除、ログイン画面へ、Socket 切断試行 | 高 | Yes | 複合 | 手動 | 依存:フロント `clearToken`、バック Socket |
| L08 | ログイン・認証 | `api.js` 初期化 | `getMe` | トークンあり読込時に `/api/auth/me` が呼ばれる | 中 | 条件付き | 複合 | 手動 | 依存:バック |
| L09 | ログイン・認証 | パスワードリセット | メール・完了 | `forgot-password` / `reset-password` が運用要件どおり | 中 | 条件付き | 複合 | 要確認 | 依存:**外部 SMTP**、バック `emailService`。**フロント専用画面なし**（API のみ） |
| P01 | 権限管理 | `checkAuth` | ロール不一致 | ワーカーが `admin/*.html` にアクセスしたときログインへ寄せる | 高 | Yes | フロントエンド | 自動化可 | フロントのみ。API 越権は別行 |
| P02 | 権限管理 | `checkAuth` | 未ログイン | 保護ページでトークンなしのときログインへ | 高 | Yes | フロントエンド | 自動化可 | |
| P03 | 権限管理 | `GET /api/admin/users` 等 | 越権 API | 顧客・ワーカートークンで **403** | 高 | Yes | バックエンド | 自動化可 | 依存:バック `authorize('ADMIN')`（**事実**） |
| P04 | 権限管理 | `GET /api/workers` | 公開範囲 | 未認証で一覧が取得できること（仕様どおり） | 中 | 条件付き | バックエンド | 自動化可 | **事実**: `routes/workers.js` で認証なし |
| P05 | 権限管理 | `errors/403.html` | 静的 403 | 必要に応じ表示できる | 低 | No | フロントエンド | 手動 | `service-worker.js` プリキャッシュ |
| C01 | 顧客管理 | `customer/dashboard.html` | マイページ | 予約・通知等が表示される | 高 | Yes | 複合 | 手動 | 依存:複数 API |
| C02 | 顧客管理 | `customer-profile.html` | プロフィール更新 | `PUT /api/users/me` 成功 | 高 | Yes | 複合 | 手動 | |
| C03 | 顧客管理 | 同上 | パスワード変更 | `PUT /api/users/me/password` | 高 | Yes | 複合 | 手動 | |
| C04 | 顧客管理 | `booking.html` / `booking-form.js` | 予約作成・編集 | 作成・更新・ワーカー紐付け | 高 | Yes | 複合 | 手動 | 依存:バック予約 API |
| C05 | 顧客管理 | `bookings.html` | 一覧・キャンセル | `getBookings` / `cancelBooking` | 高 | Yes | 複合 | 手動 | |
| C06 | 顧客管理 | `booking-detail.js` | 決済・領収書・レビュー | 完了後決済、PDF、レビュー | 高 | Yes | 複合 | 手動 | 依存:**決済**・**PDF**・バック。**要確認**: 外部決済サービス利用の有無、または内部ステータス管理のみか |
| C07 | 顧客管理 | `select-worker.js` | 指名・お気に入り | 検索・指名・favorites | 高 | Yes | 複合 | 手動 | |
| C08 | 顧客管理 | `favorites.html` | お気に入り一覧 | 一覧・削除 | 中 | 条件付き | 複合 | 手動 | |
| C09 | 顧客管理 | `payment.html` | カード・履歴 | cards / payments / receipt | 高 | Yes | 複合 | 手動 | 依存:**決済**・バック。**要確認**: 外部決済サービス利用の有無、または内部ステータス管理のみか |
| C10 | 顧客管理 | `chat.html` | チャット・添付 | メッセージ送信・**ファイルアップロード** | 高 | Yes | 複合 | 手動 | 依存:バック messages + upload。**要確認**: category/fileType |
| C11 | 顧客管理 | `notifications.html` | 通知一覧・既読 | REST 通知 | 中 | 条件付き | 複合 | 手動 | |
| W01 | ワーカー管理（スタッフ管理） | `worker/dashboard.html` | ダッシュボード | 今日の予定・新着案件表示 | 高 | Yes | 複合 | 手動 | 依存:`getBookings`。README で過去の誤 API 修正履歴あり |
| W02 | ワーカー管理（スタッフ管理） | `worker/profile.html` | プロフィール | `users/me`・`workers/me`・レビュー | 高 | Yes | 複合 | 手動 | |
| W03 | ワーカー管理（スタッフ管理） | `worker/jobs.html` | 案件一覧・承諾 | フィルタ・accept | 高 | Yes | 複合 | 手動 | |
| W04 | ワーカー管理（スタッフ管理） | `worker/job-detail.html` | 承諾・拒否・完了 | accept / reject / complete | 高 | Yes | 複合 | 手動 | 依存:バック `completed_at` |
| W05 | ワーカー管理（スタッフ管理） | `worker/calendar.html` | 利用不可スロット | unavailable-slots API | 高 | Yes | 複合 | 手動 | 依存:バック・JST スロット |
| W06 | ワーカー管理（スタッフ管理） | `notification-settings.html` | 通知プリファレンス | `notificationPrefs` | 中 | 条件付き | 複合 | 手動 | |
| W07 | ワーカー管理（スタッフ管理） | `rewards.html` | 報酬サマリー | `getBookings` + `getPayments` | 中 | 条件付き | 複合 | 手動 | **事実**: バックは WORKER の payments 取得を拒否しうる。画面の期待動作は要確認 |
| W08 | ワーカー管理（スタッフ管理） | `password-change.html` | リダイレクト | `profile.html` へ誘導 | 低 | No | フロントエンド | 手動 | |
| B01 | 予約管理 | 予約関連 JS / 画面 | ライフサイクル | 作成〜完了〜キャンセル | 高 | Yes | 複合 | 手動 | 依存:バック `bookingService` |
| B02 | 予約管理 | `admin/bookings.html` | 管理者一覧・更新 | フィルタ・`updateBooking` | 高 | Yes | 複合 | 手動 | |
| B03 | 予約管理 | `admin/booking-detail.html` | 詳細・チャット・キャンセル | メッセージ・DELETE | 高 | Yes | 複合 | 手動 | |
| B04 | 予約管理 | `GET /api/bookings` | `available=true` | ワーカー未割当案件 | 高 | Yes | バックエンド | 自動化可 | **事実**: `bookingService` にロジック |
| S01 | スケジュール管理 | `worker/calendar.html` | 日付・JST | `YYYY-MM-DD` と API 範囲一致 | 高 | Yes | 複合 | 手動 | フロント UTC ずれ対策済み（README 履歴） |
| S02 | スケジュール管理 | 同上 | 表示整合 | 不可枠と予約の矛盾がない | 中 | 条件付き | 複合 | 手動 | |
| PAY01 | 請求・支払い | `booking-detail.js` | 決済確定 | `processPayment` + `paymentMethod` | 高 | Yes | 複合 | 手動 | 依存:**決済**・バック。**要確認**: 外部決済サービス利用の有無、または内部ステータス管理のみか |
| PAY02 | 請求・支払い | `payment.html` / 詳細 | 領収書 PDF | 日本語表示・ダウンロード | 高 | Yes | 複合 | 手動 | 依存:バック **PDFKit**・フォント資産。**要確認**: 外部決済サービス利用の有無（領収書と決済実体の整合） |
| PAY03 | 請求・支払い | `payment.html` | カード CRUD | 追加・更新・削除・デフォルト | 高 | Yes | 複合 | 手動 | 依存:バック cards。**要確認**: 外部決済サービス（トークン決済等）連携か、アプリ内保存のみか |
| PAY04 | 請求・支払い | `POST /api/payments` | 二重決済防止 | 完了済み予約で再決済が拒否 | 高 | Yes | バックエンド | 自動化可 | **事実**: `paymentService` にガード。**要確認**: 外部決済サービス利用時の二重課金防止が PSP 側と整合しているか |
| N01 | 通知 | `socket.js` | Socket 接続 | `SOCKET_SERVER_URL`・`auth.token` | 高 | Yes | 複合 | 手動 | 依存:**インフラ CORS**・バック `config/socket.js`・**JWT** |
| N02 | 通知 | 同上 | イベント | notification / message / unread-count | 高 | Yes | 複合 | 手動 | 依存:バック Socket 実装 |
| N03 | 通知 | `notifications.js` 等 | REST | 一覧・既読 | 中 | 条件付き | 複合 | 手動 | |
| N04 | 通知 | `worker-notification-badge.js` | バッジ | 未読数 UI | 中 | 条件付き | フロントエンド | 手動 | 依存:Socket/REST |
| A01 | 管理画面 | `admin/dashboard.html` | KPI | レポート・今日の予約 | 高 | Yes | 複合 | 手動 | **要確認**: `getAdminStats` とバックの整合 |
| A02 | 管理画面 | `admin/users.html` | ユーザー・CSV・招待 | 停止・`registerAdmin` | 高 | Yes | 複合 | 手動 | |
| A03 | 管理画面 | `admin/user-detail.html` | ユーザー詳細 | 予約履歴・更新 | 高 | Yes | 複合 | 手動 | |
| A04 | 管理画面 | `admin/workers.html` | ワーカー一覧 | フィルタ・停止・CSV | 高 | Yes | 複合 | 手動 | |
| A05 | 管理画面 | `admin/worker-detail.html` | 承認・停止 | approve / update | 高 | Yes | 複合 | 手動 | |
| A06 | 管理画面 | `admin/payments.html` | 売上・CSV | エクスポート | 中 | 条件付き | 複合 | 手動 | **要確認**: 一覧が実データか |
| A07 | 管理画面 | `admin/support.html` | サポート | チケット更新・削除 | 高 | Yes | 複合 | 手動 | |
| A08 | 管理画面 | `admin/settings.html` | マスタ | サービス・エリア CRUD | 高 | Yes | 複合 | 手動 | |
| CSV01 | CSV入出力 | `downloadCSV` / `downloadExcel` | 管理者エクスポート | bookings/users/workers/revenue | 高 | Yes | 複合 | 自動化可 | 依存:バック `export` |
| CSV02 | CSV入出力 | 同上 | ファイル品質 | 文字化け・開封 | 中 | 条件付き | 複合 | 手動 | |
| CSV03 | CSV入出力 | 製品全体 | CSV 取込 | 取込 UI・仕様 | 低 | No | 要確認 | 要確認 | **要確認**: 機能の有無 |
| E01 | 外部連携 | `js/config.js` | 本番向き先 | API / Socket URL 正しい | 高 | Yes | インフラ | 手動 | フロント埋め込み設定 |
| E02 | 外部連携 | バック `.env` / Railway | CORS | フロントオリジンが許可 | 高 | Yes | インフラ | 手動 | 依存:**CORS**。`index.js`・`socket.js` |
| E03 | 外部連携 | SMTP | 通知メール | リセット・運用メール | 中 | 条件付き | 外部サービス | 要確認 | 依存:**SMTP**（バック `emailService`） |
| E04 | 外部連携 | Vercel | デプロイ | 静的配信・ルート | 高 | Yes | インフラ | 要確認 | README: Git 連携 |
| SEC01 | セキュリティ | 本番 URL | HTTPS / SSL | TLS で配信 | 高 | Yes | インフラ | 手動 | |
| SEC02 | セキュリティ | `localStorage` | XSS と JWT | リスク認識・CSP の有無 | 高 | Yes | 複合 | 要確認 | **要確認**: CSP |
| SEC03 | セキュリティ | `admin/*.html` | インデックス抑止 | robots noindex 等 | 中 | 条件付き | フロントエンド | 手動 | |
| SEC04 | セキュリティ | `/api-docs` | Swagger 公開 | 本番で公開してよいか | 中 | 条件付き | バックエンド | 要確認 | **事実**: `index.js` でマウント |
| SEC05 | セキュリティ | `/api/health/db` | 診断情報 | 情報露出・制限 | 中 | 条件付き | バックエンド | 要確認 | **事実**: `index.js` にルート |
| PERF01 | 性能 | 主要ページ | LCP・体感 | トップ・ログイン | 中 | 条件付き | 複合 | 要確認 | 閾値 **要確認** |
| PERF02 | 性能 | API | 応答時間 | 一覧・詳細 | 中 | 条件付き | バックエンド | 要確認 | 計測 **要確認** |
| PERF03 | 性能 | PWA | Service Worker | API 誤キャッシュがない | 中 | 条件付き | フロントエンド | 手動 | `service-worker.js` |
| ERR01 | 異常系 | `api.js` | ネットワーク障害 | ユーザー向けエラー | 中 | 条件付き | フロントエンド | 手動 | |
| ERR02 | 異常系 | フォーム | バリデーション | `validation.js` | 中 | 条件付き | フロントエンド | 手動 | |
| ERR03 | 異常系 | 決済・送信 UI | 二重送信 | 連打で重複処理が起きない | 高 | Yes | 複合 | 手動 | **要確認**: 画面ごとにガード有無。**要確認**: 外部決済がある場合の二重送信・冪等性 |
| ERR04 | 異常系 | `socket.js` | 切断・再接続 | 復帰後の整合 | 中 | 条件付き | 複合 | 手動 | 依存:Socket |

---

## 11. 既存チェックリストとの対応

以下は**手順書（Markdown）**であり、**自動実行されない**（**事実**）。

- `tests/customer/TEST_CHECKLIST.md`
- `tests/worker/TEST_CHECKLIST.md`
- `tests/admin/TEST_CHECKLIST.md`

本テスト観点一覧の **No** と 1:1 対応ではない。チェックリストは詳細手順の補助として利用する。

関連（**今後作成する資料として併用する**）: `docs/RELEASE_CRITERIA.md`、`docs/RELEASE_TEST_RESULTS.md`、`docs/RELEASE_DEFECT_LIST.md`、`docs/RELEASE_PROCEDURE.md`、`docs/ROLLBACK_PROCEDURE.md`。

---

## 12. 改訂履歴

| 日付 | 内容 |
|------|------|
| 2026-05-08 | 初版 |
| 2026-05-08 | リリース判定の使い方、自動化可否の定義明確化、確認範囲・リリース必須列、リリース不可条件、ワーカー管理（スタッフ管理）を前提に統合、バックエンド（kajishift-backend）根拠の追記、全表改訂 |
| 2026-05-08 | 最終調整: 前提からローカルパス削除・別リポジトリ表記、備考ルール文言、決済の PSP／内部管理の要確認、関連資料の「今後作成して併用」表記 |
