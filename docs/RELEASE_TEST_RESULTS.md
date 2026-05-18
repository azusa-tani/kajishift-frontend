# KAJISHIFT リリース判定用 テスト結果記録表

## 1. 文書の目的

- 本書は、KAJISHIFTのリリース前テスト結果を記録するための資料である。
- `docs/RELEASE_TEST_CASES.md` の各テストケースに対して、実施結果を記録する。
- NGまたは保留となった項目は、必要に応じて `docs/RELEASE_DEFECT_LIST.md` に転記する。
- 最終的なリリース可否判断は、`docs/RELEASE_CRITERIA.md` と合わせて行う。

## 2. 前提

- 対象は `kajishift-frontend` および `kajishift-backend`。
- 本番想定は、フロントは Vercel、バックエンドは Railway。
- テストケースは `docs/RELEASE_TEST_CASES.md` を正とする。
- テスト実施前の初期状態では、すべての判定を「未実施」とする。
- 証跡には、スクリーンショット、ログ、APIレスポンス、CSVファイル名、PDFファイル名、URL、実行コマンドなどを記録する。
- 本書に記載するテストアカウントは例であり、実際には払い出されたテストアカウントを使用する。

## 3. テスト結果の記録ルール

- テスト実施後、各テストケースの判定を `OK` / `NG` / `保留` / `対象外` のいずれかに更新する。
- 不具合がある場合は、不具合IDを記録する。
- NGの場合は、必ず実際の結果と期待結果との差分を記録する。
- 保留の場合は、保留理由と解消に必要な情報を記録する。
- 対象外の場合は、対象外理由を記録する。
- リリース必須「Yes」の項目がNGまたは未実施の場合は、リリース不可候補として扱う。
- リリース必須「条件付き」の項目がNGまたは未実施の場合は、リリース判定会議で扱う。
- 証跡がないOK判定は、原則として再確認対象とする。

## 4. 判定基準

| 判定 | 意味 | リリース判定への扱い |
|---|---|---|
| OK | 期待結果どおり | 問題なし |
| NG | 期待結果と異なる | 不具合一覧へ記録し、影響判断が必要 |
| 保留 | 環境・仕様・データ不足で判断できない | 要確認事項として管理 |
| 対象外 | 今回リリース範囲外 | 対象外理由を記録 |
| 未実施 | まだ実施していない | リリース必須項目の場合はリリース不可候補 |

## 5. テスト結果サマリー

2026-05-18 更新: Stripe βフローをProduction URLで確認。PaymentIntent作成、Stripeテスト決済、Webhook反映、領収書PDF、レビュー投稿、チャット、通知既読、管理者ログインをAPIスモークで確認した。フロント変更はコミット `4d83f73` をpush済み。Vercel本番再デプロイは投入済みだが、確認時点ではQueued/Initializing継続。

2026-05-12 更新: TC-E-001〜E-004、TC-SEC-001、TC-N-001 を反映（詳細は6章）。同日、主要ログイン3画面のブラウザ表示・HTTPS（鍵アイコン）をスクショで追記。

| 分類 | 総件数 | OK | NG | 保留 | 対象外 | 未実施 | リリース必須Yes件数 | リリース必須YesのNG/未実施件数 | 備考 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| ログイン・認証 | 8 | 0 | 0 | 0 | 0 | 8 | 8 | 8 | 初期状態 |
| 権限管理 | 5 | 0 | 0 | 0 | 0 | 5 | 4 | 4 | 初期状態 |
| 顧客管理 | 14 | 0 | 0 | 0 | 0 | 14 | 13 | 13 | 初期状態 |
| ワーカー管理（スタッフ管理） | 8 | 0 | 0 | 0 | 0 | 8 | 7 | 7 | 初期状態 |
| 予約管理 | 9 | 0 | 0 | 0 | 0 | 9 | 9 | 9 | 初期状態 |
| スケジュール管理 | 2 | 0 | 0 | 0 | 0 | 2 | 1 | 1 | 初期状態 |
| 請求・支払い | 7 | 0 | 0 | 0 | 0 | 7 | 7 | 7 | 初期状態 |
| 通知 | 5 | 0 | 0 | 1 | 0 | 4 | 4 | 3 | TC-N-001 保留（2026-05-12） |
| 管理画面 | 12 | 0 | 0 | 0 | 0 | 12 | 12 | 12 | 初期状態 |
| CSV入出力 | 5 | 0 | 0 | 0 | 0 | 5 | 4 | 4 | 初期状態 |
| 外部連携 | 5 | 2 | 0 | 2 | 0 | 1 | 4 | 0 | TC-E-001/E-004 OK、E-002/E-003 保留、E-005 未実施（2026-05-12）。TC-E-004 のブラウザ証跡は `docs/evidence/2026-05-12/*.png`。 |
| セキュリティ | 7 | 0 | 0 | 1 | 0 | 6 | 4 | 3 | TC-SEC-001 保留（curl・ログイン画面スクショに加え、Vercel 本番 `customer/login` で証明書ビューア確認済み。カスタムドメインは未確認 / 2026-05-12）。リリース必須YesのNG/未実施件数は保留を含まない。 |
| 性能 | 3 | 0 | 0 | 0 | 0 | 3 | 0 | 0 | 初期状態 |
| 異常系 | 4 | 0 | 0 | 0 | 0 | 4 | 1 | 1 | 初期状態 |
| 運用・切り戻し | 3 | 0 | 0 | 0 | 0 | 3 | 3 | 3 | 初期状態 |

## 6. テスト結果一覧

| No | 観点No | 分類 | テストケース名 | 確認範囲 | 重要度 | リリース必須 | 前提条件 | 操作手順 | 入力値 | 期待結果 | 実際の結果 | 判定 | 証跡 | 不具合ID | 実施者 | 実施日 | 備考 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-L-001 | L01 | ログイン・認証 | customer 正常ログイン | 複合 | 高 | Yes | customer テストアカウント有効 | `customer/login.html` を開く→ログイン実行 | `customer1@example.com` / `password123` | ダッシュボード遷移、`localStorage` に `token` / `user` 保存 |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補、自動化候補 |
| TC-L-002 | L01 | ログイン・認証 | worker 正常ログイン | 複合 | 高 | Yes | worker テストアカウント有効 | `worker/login.html` を開く→ログイン実行 | `worker1@example.com` / `password123` | ダッシュボード遷移、トークン保存 |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補、自動化候補 |
| TC-L-003 | L01 | ログイン・認証 | admin 正常ログイン | 複合 | 高 | Yes | admin テストアカウント有効 | `admin/login.html` を開く→ログイン実行 | `admin@example.com` / `password123` | ダッシュボード遷移、トークン保存 |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補、自動化候補 |
| TC-L-004 | L02 | ログイン・認証 | 誤パスワード時エラー表示 | 複合 | 高 | Yes | 既存アカウントあり | 各ログイン画面で誤パスワード入力 | 正しいメール + 誤パスワード | エラー表示、`token` 未保存 |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補、自動化候補 |
| TC-L-005 | L03 | ログイン・認証 | 401時トークンクリアと再ログイン誘導 | 複合 | 高 | Yes | 保護ページで無効トークンを事前設定 | `localStorage.token` を無効値にして保護画面を再読み込み | 無効 JWT | 401後に `token`/`user` が削除され、各ロールログインへ遷移 |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補、自動化候補 |
| TC-L-006 | L04 | ログイン・認証 | customer 新規登録 | 複合 | 高 | Yes | 新規メールが利用可能 | `customer/register.html` で登録実行 | 氏名/メール/電話/PW | 登録成功しログイン可能状態になる |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補 |
| TC-L-007 | L05 | ログイン・認証 | worker 書類付き登録 | 複合 | 高 | Yes | 新規メール、本人確認ファイル準備 | `worker/register.html` でファイル添付登録 | ワーカー必須項目 + ファイル | 登録成功、承認待ち状態でログイン可能 |  | 未実施 | － | － |  |  | 依存:バックエンド、依存:外部サービス(ファイル保存先)、要確認:アップロード仕様差分 |
| TC-L-008 | L07 | ログイン・認証 | ログアウト処理 | 複合 | 高 | Yes | ログイン済み | ヘッダー等からログアウト実行 | なし | `token`/`user` 削除、ログイン画面へ遷移、Socket 切断 |  | 未実施 | － | － |  |  | 依存:フロントエンド、依存:バックエンド、リリース不可候補 |
| TC-P-001 | P02 | 権限管理 | 未ログインで保護ページアクセス | フロントエンド | 高 | Yes | 未ログイン状態 | `customer/dashboard.html` / `worker/dashboard.html` / `admin/dashboard.html` へ直接アクセス | なし | 各ログイン画面へリダイレクト |  | 未実施 | － | － |  |  | リリース不可候補、自動化候補 |
| TC-P-002 | P01 | 権限管理 | customer が admin 画面にアクセス | フロントエンド | 高 | Yes | customer でログイン | URL 直打ちで `admin/users.html` へアクセス | なし | admin ログインページへ遷移 |  | 未実施 | － | － |  |  | リリース不可候補、自動化候補 |
| TC-P-003 | P01 | 権限管理 | worker が admin 画面にアクセス | フロントエンド | 高 | Yes | worker でログイン | URL 直打ちで `admin/users.html` へアクセス | なし | admin ログインページへ遷移 |  | 未実施 | － | － |  |  | リリース不可候補、自動化候補 |
| TC-P-004 | P03 | 権限管理 | customer/worker トークンで admin API 403 | バックエンド | 高 | Yes | customer または worker の JWT 取得済み | API クライアントで `GET /api/admin/users` 実行 | `Authorization: Bearer <customer or worker token>` | HTTP 403 |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補、自動化候補 |
| TC-P-005 | P04 | 権限管理 | 未認証で公開ワーカー一覧取得 | バックエンド | 中 | 条件付き | API 到達可能 | API クライアントで `GET /api/workers` 実行 | 認証ヘッダなし | HTTP 200 で一覧取得（仕様どおり） |  | 未実施 | － | － |  |  | 依存:バックエンド、自動化候補 |
| TC-C-001 | C01 | 顧客管理 | 顧客マイページ表示 | 複合 | 高 | Yes | customer ログイン済み | `customer/dashboard.html` を表示 | なし | 予約・通知・支払い関連情報が表示される |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補 |
| TC-C-002 | C02 | 顧客管理 | プロフィール更新 | 複合 | 高 | Yes | customer ログイン済み | `customer/customer-profile.html` で編集→保存 | 氏名/電話/住所 | 更新成功し再表示でも反映 |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補 |
| TC-C-003 | C03 | 顧客管理 | パスワード変更 | 複合 | 高 | Yes | customer ログイン済み | プロフィール画面でパスワード変更実行 | current/new password | 変更成功、以後新PWでログイン可能 |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補 |
| TC-C-004 | C04 | 顧客管理 | 予約作成 | 複合 | 高 | Yes | customer ログイン済み | `customer/booking.html` で必須項目入力し送信 | serviceType/date/startTime/duration/address | 予約作成成功し次画面へ遷移 |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補 |
| TC-C-005 | C04 | 顧客管理 | 予約編集 | 複合 | 高 | Yes | 既存予約あり | `customer/booking.html?id=<bookingId>` で変更し保存 | 既存予約ID + 更新項目 | 更新成功、詳細/一覧に反映 |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補 |
| TC-C-006 | C05 | 顧客管理 | 予約キャンセル | 複合 | 高 | Yes | キャンセル可能予約あり | `customer/bookings.html` または詳細からキャンセル | bookingId | ステータスが CANCELLED へ更新 |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補 |
| TC-C-007 | C06/PAY01 | 顧客管理 | 完了予約の決済確定 | 複合 | 高 | Yes | COMPLETED かつ未決済予約あり | 詳細画面で支払い方法選択→決済確定 | `paymentMethod` + bookingId | 支払成功、支払済み表示へ遷移 |  | 未実施 | － | － |  |  | 依存:バックエンド、依存:外部サービス(要確認:PSP有無)、リリース不可候補。外部PSPを利用する場合は、PSP側のテスト環境・テストカード・決済ID・冪等性確認を追加する。 |
| TC-C-008 | C06/PAY02 | 顧客管理 | 領収書 PDF ダウンロード | 複合 | 高 | Yes | 決済済みレコードあり | `customer/payment.html` または予約詳細で領収書DL | paymentId | PDF をダウンロードでき、ファイルが開ける |  | 未実施 | － | － |  |  | 依存:バックエンド(PDFKit)、要確認:PSP連携有無、リリース不可候補。外部PSPを利用する場合は、PSP側のテスト環境・テストカード・決済ID・冪等性確認を追加する。 |
| TC-C-009 | C06 | 顧客管理 | レビュー投稿 | 複合 | 高 | Yes | 完了予約あり | 予約詳細からレビュー投稿 | rating/comment | 投稿成功し再読込後も保持 |  | 未実施 | － | － |  |  | 依存:バックエンド |
| TC-C-010 | C07 | 顧客管理 | ワーカー検索・指名 | 複合 | 高 | Yes | 予約IDあり | `customer/select-worker.html?bookingId=<id>` で検索→確定 | keyword/workerId | 予約に workerId が設定される |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補 |
| TC-C-011 | C07/C08 | 顧客管理 | お気に入り追加・削除 | 複合 | 高 | Yes | ワーカー表示可能 | select-worker または favorites で追加/削除 | workerId | 追加後に一覧へ反映、削除で消える |  | 未実施 | － | － |  |  | 依存:バックエンド |
| TC-C-012 | C10 | 顧客管理 | チャット送信（テキスト） | 複合 | 高 | Yes | 予約に紐づくチャットルームあり | `customer/chat.html?bookingId=<id>` で送信 | message text | 送信成功し画面に反映、相手側受信 |  | 未実施 | － | － |  |  | 依存:バックエンド、依存:Socket、リリース不可候補 |
| TC-C-013 | C10 | 顧客管理 | 添付ファイル送信 | 複合 | 高 | Yes | チャット画面、画像ファイル準備 | 添付ボタン→画像選択→送信 | png/jpg <=10MB | 送信成功し画像メッセージ表示 |  | 未実施 | － | － |  |  | 依存:バックエンド(upload)、要確認:category/fileType整合、リリース不可候補 |
| TC-C-014 | C11 | 顧客管理 | 通知一覧・既読 | 複合 | 中 | 条件付き | 通知データあり | `customer/notifications.html` で一覧→既読処理 | notificationId | 一括/個別既読が反映 |  | 未実施 | － | － |  |  | 依存:バックエンド、自動化候補 |
| TC-W-001 | W01 | ワーカー管理（スタッフ管理） | ワーカーダッシュボード表示 | 複合 | 高 | Yes | worker ログイン済み | `worker/dashboard.html` を表示 | なし | 今日の予定・新着案件が表示 |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補 |
| TC-W-002 | W02 | ワーカー管理（スタッフ管理） | プロフィール表示・更新 | 複合 | 高 | Yes | worker ログイン済み | `worker/profile.html` で自己紹介/時給等を更新 | bio/hourlyRate | 更新成功し再表示で反映 |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補 |
| TC-W-003 | W03 | ワーカー管理（スタッフ管理） | 案件一覧表示 | 複合 | 高 | Yes | worker ログイン済み | `worker/jobs.html` で一覧確認 | filters | available 案件が表示される |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補 |
| TC-W-004 | W03/W04 | ワーカー管理（スタッフ管理） | 案件承諾 | 複合 | 高 | Yes | 承諾可能案件あり | `worker/job-detail.html?id=<bookingId>` で承諾 | bookingId | status が CONFIRMED へ |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補 |
| TC-W-005 | W04 | ワーカー管理（スタッフ管理） | 案件拒否 | 複合 | 高 | Yes | 拒否可能案件あり | 仕事詳細で拒否操作 | reason 任意 | 拒否成功、予約状態が更新 |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補 |
| TC-W-006 | W04 | ワーカー管理（スタッフ管理） | 作業完了 | 複合 | 高 | Yes | 承諾済み案件あり | 仕事詳細で完了操作 | bookingId | status が COMPLETED、顧客側決済導線へ |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補 |
| TC-W-007 | W05 | ワーカー管理（スタッフ管理） | 利用不可スロット登録・削除 | 複合 | 高 | Yes | worker ログイン済み | `worker/calendar.html` で枠登録→削除 | date/slotIndex | API と UI が一致して更新 |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補 |
| TC-W-008 | W06/W07 | ワーカー管理（スタッフ管理） | 報酬サマリー表示 | 複合 | 中 | 条件付き | 完了予約・支払データあり | `worker/rewards.html` を表示 | 月選択 | 月次サマリー表示 |  | 未実施 | － | － |  |  | 依存:バックエンド、要確認:workerの`GET /api/payments`可否 |
| TC-B-001 | B01 | 予約管理 | 業務フロー通し確認（作成→承諾→完了→決済） | 複合 | 高 | Yes | customer/worker/admin アカウントあり | 作成→承諾→完了→決済まで通しで実施（キャンセルは別ケース） | 複数 bookingId | 主要業務フローが中断なく成立する |  | 未実施 | － | － |  |  | 依存:バックエンド、依存:外部サービス(要確認:PSP有無)、リリース不可候補 |
| TC-B-002 | B01 | 予約管理 | 予約作成後に PENDING になること | 複合 | 高 | Yes | customer ログイン、作成可能条件 | 予約作成を実行し一覧/詳細/APIで状態確認 | 作成入力一式 | 作成直後の status が `PENDING` |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補 |
| TC-B-003 | B01/W04 | 予約管理 | ワーカー承諾後に CONFIRMED になること | 複合 | 高 | Yes | PENDING 予約あり、worker ログイン | 案件承諾後に一覧/詳細/API確認 | bookingId | status が `CONFIRMED` |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補 |
| TC-B-004 | B01/W04 | 予約管理 | ワーカー完了後に COMPLETED になること | 複合 | 高 | Yes | CONFIRMED/IN_PROGRESS 予約あり | 仕事完了後に一覧/詳細/API確認 | bookingId | status が `COMPLETED` |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補 |
| TC-B-005 | B01/C05 | 予約管理 | キャンセル可能条件で CANCELLED になること | 複合 | 高 | Yes | キャンセル可能予約あり | 顧客または管理者でキャンセル実行 | bookingId | status が `CANCELLED` |  | 未実施 | － | － |  |  | 依存:バックエンド、要確認:キャンセル条件、リリース不可候補 |
| TC-B-006 | B02 | 予約管理 | 管理者予約一覧表示 | 複合 | 高 | Yes | admin ログイン済み | `admin/bookings.html` 表示・フィルタ操作 | status/date等 | 一覧と件数が取得できる |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補 |
| TC-B-007 | B02 | 予約管理 | 管理者による予約更新 | 複合 | 高 | Yes | 更新対象予約あり | 管理画面からステータス更新 | bookingId/status | 更新成功し再読込で反映 |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補 |
| TC-B-008 | B03 | 予約管理 | 管理者予約詳細確認 | 複合 | 高 | Yes | 対象予約あり | `admin/booking-detail.html?id=<id>` 表示 | bookingId | 予約/依頼者/ワーカー/チャット履歴が取得される |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補 |
| TC-B-009 | B04 | 予約管理 | ワーカー未割当案件 API 取得 | バックエンド | 高 | Yes | worker JWT 取得済み | API クライアントで `/api/bookings?available=true` を実行 | Authorization + query | 200、未割当案件のみ返る |  | 未実施 | － | － |  |  | 依存:バックエンド、自動化候補、リリース不可候補 |
| TC-S-001 | S01 | スケジュール管理 | JST日付とAPI範囲整合 | 複合 | 高 | Yes | worker ログイン済み、対象月に予約あり | `worker/calendar.html` を月移動し、表示日付と API レスポンスを突合 | startDate/endDate | 日付ずれなく一致 |  | 未実施 | － | － |  |  | 依存:フロント+バック、リリース不可候補 |
| TC-S-002 | S02 | スケジュール管理 | 予約と不可枠の表示整合 | 複合 | 中 | 条件付き | 予約と不可枠を用意 | カレンダー上の同日表示を確認 | なし | 表示重複/矛盾なく表示 |  | 未実施 | － | － |  |  | 依存:フロント+バック |
| TC-PAY-001 | PAY01 | 請求・支払い | 決済確定（正常） | 複合 | 高 | Yes | COMPLETED かつ未払い予約あり | 予約詳細から決済実行 | `bookingId`, `paymentMethod` | `POST /api/payments` 成功、支払済み状態へ |  | 未実施 | － | － |  |  | 依存:バックエンド、依存:外部サービス(要確認:PSP有無)、リリース不可候補。外部PSPを利用する場合は、PSP側のテスト環境・テストカード・決済ID・冪等性確認を追加する。 |
| TC-PAY-002 | PAY04 | 請求・支払い | 二重決済防止 | バックエンド | 高 | Yes | 既に COMPLETED な payment が存在 | 同一 bookingId で再度 `POST /api/payments` 実行 | 既存bookingId | エラー応答（重複防止） |  | 未実施 | － | － |  |  | 依存:バックエンド、要確認:PSP側冪等性、リリース不可候補、自動化候補。外部PSPを利用する場合は、PSP側のテスト環境・テストカード・決済ID・冪等性確認を追加する。 |
| TC-PAY-003 | PAY02 | 請求・支払い | 領収書PDF出力 | 複合 | 高 | Yes | 決済済み paymentId あり | `GET /api/payments/:id/receipt` または画面DL | paymentId | 200 で PDF、文字化けなし |  | 未実施 | － | － |  |  | 依存:バックエンド(PDFKit)、依存:外部サービス(要確認:PSP整合)、リリース不可候補。外部PSPを利用する場合は、PSP側のテスト環境・テストカード・決済ID・冪等性確認を追加する。 |
| TC-PAY-004 | PAY03 | 請求・支払い | カード追加 | 複合 | 高 | Yes | customer ログイン済み | `customer/payment.html` で追加モーダル保存 | cardNumber/expiry/name等 | 追加成功、一覧更新 |  | 未実施 | － | － |  |  | 依存:バックエンド、要確認:外部PSPトークン化有無。外部PSPを利用する場合は、PSP側のテスト環境・テストカード・決済ID・冪等性確認を追加する。 |
| TC-PAY-005 | PAY03 | 請求・支払い | カード更新 | 複合 | 高 | Yes | 既存カードあり | カード編集保存 | cardId/更新値 | 更新成功し一覧反映 |  | 未実施 | － | － |  |  | 依存:バックエンド。外部PSPを利用する場合は、PSP側のテスト環境・テストカード・決済ID・冪等性確認を追加する。 |
| TC-PAY-006 | PAY03 | 請求・支払い | カード削除 | 複合 | 高 | Yes | 既存カードあり | カード削除確定 | cardId | 削除成功し一覧から消える |  | 未実施 | － | － |  |  | 依存:バックエンド。外部PSPを利用する場合は、PSP側のテスト環境・テストカード・決済ID・冪等性確認を追加する。 |
| TC-PAY-007 | PAY03 | 請求・支払い | デフォルトカード設定 | 複合 | 高 | Yes | 複数カードあり | 「デフォルトに設定」実行 | cardId | デフォルト表示が更新 |  | 未実施 | － | － |  |  | 依存:バックエンド。外部PSPを利用する場合は、PSP側のテスト環境・テストカード・決済ID・冪等性確認を追加する。 |
| TC-N-001 | N01 | 通知 | Socket接続確立 | 複合 | 高 | Yes | ログイン済み、Socketサーバ到達可 | 画面表示後に接続ログ/状態を確認 | JWT | 接続成功、切断時再接続試行 | ブラウザDevTools Networkで `wss://kajishift-backend-production.up.railway.app/socket.io/?EIO=4&transport=websocket` への接続を確認し、Status Code が `101 Switching Protocols`、`Access-Control-Allow-Origin: https://kajishift-frontend.vercel.app`、`Access-Control-Allow-Credentials: true`、`Upgrade: websocket` であることを確認。Consoleでも `Socket.io 接続成功`、`接続が確立されました`、`未読通知数更新: 0` を確認。ただし、切断時再接続試行は未確認。 | 保留 | `docs/evidence/2026-05-12/TC-N-001_customer-socket-console-connected-with-warning.png`、`docs/evidence/2026-05-12/TC-N-001_customer-socket-websocket-101.png` | － |  | 2026-05-12 | Socket.io本番WebSocket接続は確認済み。切断時再接続試行を確認後にOK化する。依存:バックエンド(Socket)、依存:インフラ(CORS/SSL)、リリース不可候補 |
| TC-N-002 | N02 | 通知 | 通知イベント受信 | 複合 | 高 | Yes | 通知発生トリガーを実行できる | 別端末/別ユーザーから通知トリガー | なし | `notification` イベントを受信し UI 更新 |  | 未実施 | － | － |  |  | 依存:バックエンド、依存:Socket、リリース不可候補 |
| TC-N-003 | N02 | 通知 | メッセージイベント受信 | 複合 | 高 | Yes | チャット可能な予約あり | 片側送信し他方で受信確認 | text message | `message` イベント受信し即時表示 |  | 未実施 | － | － |  |  | 依存:バックエンド、依存:Socket、リリース不可候補 |
| TC-N-004 | N02/N04 | 通知 | 未読数更新 | 複合 | 高 | Yes | 未読通知を発生させる | 通知後にヘッダーバッジ確認 | なし | `unread-count` 反映、バッジ更新 |  | 未実施 | － | － |  |  | 依存:バックエンド、依存:Socket、リリース不可候補 |
| TC-N-005 | N03 | 通知 | REST通知一覧・既読 | 複合 | 中 | 条件付き | 通知データあり | 通知一覧取得→個別既読→全件既読 | notificationId | 既読状態が反映される |  | 未実施 | － | － |  |  | 依存:バックエンド、自動化候補 |
| TC-A-001 | A01 | 管理画面 | 管理者ダッシュボード表示 | 複合 | 高 | Yes | admin ログイン済み | `admin/dashboard.html` 表示 | なし | KPI・今日の予約・問い合わせが表示 |  | 未実施 | － | － |  |  | 依存:バックエンド、要確認:`getAdminStats`整合、リリース不可候補 |
| TC-A-002 | A02 | 管理画面 | ユーザー一覧表示 | 複合 | 高 | Yes | admin ログイン済み | `admin/users.html` で一覧取得 | filters | 一覧・件数表示成功 |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補 |
| TC-A-003 | A02 | 管理画面 | ユーザー停止 | 複合 | 高 | Yes | 停止対象ユーザーあり | 一覧から停止操作 | userId | status が SUSPENDED へ更新 |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補 |
| TC-A-004 | A02 | 管理画面 | 管理者招待 | 複合 | 高 | Yes | 既存 admin でログイン | 管理者登録モーダルで作成 | name/email/password | `POST /api/admin/register` 成功 |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補 |
| TC-A-005 | A03 | 管理画面 | ユーザー詳細表示 | 複合 | 高 | Yes | 対象ユーザーあり | 詳細画面へ遷移 | userId | 詳細・予約履歴を表示 |  | 未実施 | － | － |  |  | 依存:バックエンド |
| TC-A-006 | A04 | 管理画面 | ワーカー一覧表示 | 複合 | 高 | Yes | 対象ワーカーあり | `admin/workers.html` で一覧取得 | filters | 一覧・件数表示成功 |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補 |
| TC-A-007 | A05 | 管理画面 | ワーカー承認 | 複合 | 高 | Yes | 承認待ちワーカーあり | 詳細画面で承認実行 | workerId, APPROVED | 承認状態更新 |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補 |
| TC-A-008 | A05 | 管理画面 | ワーカー停止 | 複合 | 高 | Yes | 対象ワーカーあり | 詳細/一覧で停止実行 | workerId | status が SUSPENDED へ更新 |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補 |
| TC-A-009 | A07 | 管理画面 | サポートチケット更新・削除 | 複合 | 高 | Yes | support チケットあり | `admin/support.html` で更新/削除 | ticketId/status | 更新・削除成功 |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補 |
| TC-A-010 | A08 | 管理画面 | サービス・エリア CRUD | 複合 | 高 | Yes | admin ログイン済み | `admin/settings.html` で作成→編集→削除 | service/area 入力値 | CRUD 成功 |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補 |
| TC-A-011 | B02/B03 | 管理画面 | 予約管理（管理者） | 複合 | 高 | Yes | 予約データあり | 予約一覧→詳細→ステータス更新/キャンセル | bookingId/status | 操作が反映される |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補 |
| TC-A-012 | A06 | 管理画面 | 支払い・売上一覧表示 | 複合 | 高 | Yes | 支払いデータあり | `admin/payments.html` を表示 | filters | 売上関連情報が確認可能 |  | 未実施 | － | － |  |  | 依存:バックエンド、要確認:一覧が実データ接続か、リリース不可候補 |
| TC-CSV-001 | CSV01 | CSV入出力 | bookings CSVエクスポート | 複合 | 高 | Yes | admin ログイン済み | 予約管理画面でCSV出力 | startDate/endDate 任意 | CSV をDLできる |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補、自動化候補 |
| TC-CSV-002 | CSV01 | CSV入出力 | users CSVエクスポート | 複合 | 高 | Yes | 同上 | 利用者管理画面でCSV出力 | filters 任意 | CSV をDLできる |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補、自動化候補 |
| TC-CSV-003 | CSV01 | CSV入出力 | workers CSVエクスポート | 複合 | 高 | Yes | 同上 | ワーカー管理画面でCSV出力 | filters 任意 | CSV をDLできる |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補、自動化候補 |
| TC-CSV-004 | CSV01 | CSV入出力 | revenue CSVエクスポート | 複合 | 高 | Yes | 同上 | 売上画面でCSV出力 | month/date 任意 | CSV をDLできる |  | 未実施 | － | － |  |  | 依存:バックエンド、リリース不可候補、自動化候補 |
| TC-CSV-005 | CSV02 | CSV入出力 | Excel開封時の文字化け確認 | 複合 | 中 | 条件付き | CSVファイルDL済み | Excel で開いて文字確認 | 出力CSV | 文字化けせず読める |  | 未実施 | － | － |  |  | リリース前推奨 |
| TC-E-001 | E01 | 外部連携 | API_BASE_URL 本番向き先確認 | インフラ | 高 | Yes | 本番デプロイ済み | `js/config.js` と実リクエスト先を確認 | なし | 本番 API URL に一致 | デプロイ済み `js/config.js` の `API_BASE_URL` がローカル設定と一致。`/api/health` が HTTP 200、`status: OK` を返却。さらにブラウザDevTools Networkで customer ダッシュボード表示時の `GET /api/auth/me` を確認し、Request URL が `https://kajishift-backend-production.up.railway.app/api/auth/me`、Status Code が `200 OK` であることを確認。 | OK | `curl -L https://kajishift-frontend.vercel.app/js/config.js`、`curl -i https://kajishift-backend-production.up.railway.app/api/health`、`docs/evidence/2026-05-12/TC-E-001-E-003_customer-auth-me-request-url-cors.png` | － |  | 2026-05-12 | ブラウザ実通信でも本番API向き先を確認済み。依存:インフラ、リリース不可候補 |
| TC-E-002 | E01 | 外部連携 | SOCKET_SERVER_URL 本番向き先確認 | インフラ | 高 | Yes | 本番デプロイ済み | `js/config.js` と Socket 接続先を確認 | なし | 本番 Socket URL に一致 | デプロイ済み `SOCKET_SERVER_URL` がローカル設定と一致。SocketホストはTLSで応答。ただしSocket.io実接続は未確認。 | 保留 | `curl -L https://kajishift-frontend.vercel.app/js/config.js`、`curl -i https://kajishift-backend-production.up.railway.app` | － |  | 2026-05-12 | TC-N-001でブラウザのNetwork/WS確認後にOK化する。依存:インフラ、リリース不可候補 |
| TC-E-003 | E02 | 外部連携 | CORS 許可オリジン確認 | インフラ | 高 | Yes | バック環境変数参照可能 | Railway 変数と preflight を確認 | CORS_ORIGIN | 本番フロントが許可され他不要オリジンは抑制 | `/api/health` では `Access-Control-Allow-Origin` がフロントURLを許可していることを確認。さらにブラウザDevTools Networkで `GET /api/auth/me` の Response Header に `Access-Control-Allow-Origin: https://kajishift-frontend.vercel.app`、`Access-Control-Allow-Credentials: true` が返っていることを確認。Socket.io WebSocket通信でも `Access-Control-Allow-Origin: https://kajishift-frontend.vercel.app`、`Access-Control-Allow-Credentials: true` を確認。ただし、Railway管理画面の `CORS_ORIGIN` と全APIでの設定確認は未実施。 | 保留 | `curl -i https://kajishift-backend-production.up.railway.app/api/health`、`docs/evidence/2026-05-12/TC-E-001-E-003_customer-auth-me-request-url-cors.png`、`docs/evidence/2026-05-12/TC-N-001_customer-socket-websocket-101.png` | － |  | 2026-05-12 | REST APIとSocket.io WebSocketのCORS応答は確認済み。Railway管理画面の `CORS_ORIGIN` 確認後にOK化を判断する。依存:インフラ、依存:バックエンド、リリース不可候補 |
| TC-E-004 | E04 | 外部連携 | Vercel 静的配信確認 | インフラ | 高 | Yes | Production デプロイ完了 | `/` と主要 URL へアクセス | なし | 主要画面が配信される | `https://kajishift-frontend.vercel.app` が HTTP 200 で応答（`curl -I`）。加えてブラウザで `customer` / `worker` / `admin` の各 `login.html` を開き、画面表示・タブタイトル・HTTPS（アドレスバーの鍵アイコン）を確認（2026-05-12 スクリーンショット）。 | OK | `curl -I https://kajishift-frontend.vercel.app`、`docs/evidence/2026-05-12/TC-E-004-SEC-001-customer-login.png`、`docs/evidence/2026-05-12/TC-E-004-SEC-001-worker-login.png`、`docs/evidence/2026-05-12/TC-E-004-SEC-001-admin-login.png` | － |  | 2026-05-12 | 3枚の PNG はリポジトリ内 `docs/evidence/2026-05-12/` に保存済み。依存:インフラ、リリース不可候補 |
| TC-E-005 | E03 | 外部連携 | SMTP 送信確認 | 外部サービス | 中 | 条件付き | SMTP 設定有効、対象メールあり | reset-password 等で送信を確認 | test email | メール送信成功 |  | 未実施 | － | － |  |  | 依存:外部サービス、依存:バックエンド、要確認 |
| TC-SEC-001 | SEC01 | セキュリティ | HTTPS/SSL 配信確認 | インフラ | 高 | Yes | 本番URL利用可能 | ブラウザで HTTPS 接続、証明書確認 | なし | TLS 有効、警告なし | curlでフロント・APIともSSLエラーなし。フロント応答にHSTSヘッダあり。ブラウザで `https://kajishift-frontend.vercel.app/customer/login.html` の証明書詳細を開き、発行先 `*.vercel.app`、発行元 `Google Trust Services / WR1`、有効期間 2026/02/26〜2026/05/27 であり、確認日 2026/05/12 時点で有効期限内であることを確認。ただし、カスタムドメイン利用有無と、利用する場合のカスタムドメイン側HTTPS確認は未実施。 | 保留 | `curl -I https://kajishift-frontend.vercel.app`、`curl -i https://kajishift-backend-production.up.railway.app/api/health`、`docs/evidence/2026-05-12/TC-E-004-SEC-001-customer-login.png`、`docs/evidence/2026-05-12/TC-E-004-SEC-001-worker-login.png`、`docs/evidence/2026-05-12/TC-E-004-SEC-001-admin-login.png`、`docs/evidence/2026-05-12/TC-SEC-001_certificate-vercelapp-valid.png` | － |  | 2026-05-12 | Vercel本番URLの証明書は有効確認済み。カスタムドメイン利用有無と、利用する場合のHTTPS確認は保留。 |
| TC-SEC-002 | SEC02 | セキュリティ | JWT/認証情報露出確認 | 複合 | 高 | Yes | ログイン済み | URL・画面・コンソール・ログ出力を確認 | token/JWT | JWT/個人情報が不適切露出しない |  | 未実施 | － | － |  |  | 依存:フロント+バック、要確認:CSP、リリース不可候補 |
| TC-SEC-003 | P01/P02/P03 | セキュリティ | 管理画面URLが未認証/非adminで利用不可 | 複合 | 高 | Yes | 未ログインまたは customer/worker でログイン | `admin/*.html` と `GET /api/admin/*` へアクセス | 各トークン | 画面はログインへ誘導、APIは401/403で拒否 |  | 未実施 | － | － |  |  | 依存:フロント+バック、リリース不可候補、自動化候補 |
| TC-SEC-004 | SEC02 | セキュリティ | 本番で不要なデバッグログ非表示 | 複合 | 高 | Yes | 本番環境で主要画面表示 | DevTools Console とサーバログを確認 | なし | 認証情報/内部情報を含む不要なデバッグログが常時出力されない |  | 未実施 | － | － |  |  | 依存:フロント+バック+インフラ、要確認:許容ログ方針、リリース不可候補 |
| TC-SEC-005 | SEC04 | セキュリティ | `/api-docs` 公開方針確認 | バックエンド | 中 | 条件付き | 本番API到達可能 | `/api-docs` にアクセスして方針確認 | なし | 方針どおり公開/非公開 |  | 未実施 | － | － |  |  | 依存:バックエンド、依存:インフラ、要確認 |
| TC-SEC-006 | SEC05 | セキュリティ | `/api/health/db` 公開方針確認 | バックエンド | 中 | 条件付き | 本番API到達可能 | `/api/health/db` アクセス | なし | 方針どおり制限される |  | 未実施 | － | － |  |  | 依存:バックエンド、依存:インフラ、要確認 |
| TC-SEC-007 | SEC03 | セキュリティ | 管理画面の検索エンジン露出抑止確認 | フロントエンド | 中 | 条件付き | 管理画面HTMLにアクセス可能 | `admin/*.html` の `meta robots` と公開状態を確認 | なし | `noindex,nofollow` 等の方針に沿っている |  | 未実施 | － | － |  |  | 依存:フロントエンド、要確認:運用方針 |
| TC-PERF-001 | PERF01 | 性能 | 主要ページ表示速度 | 複合 | 中 | 条件付き | 本番環境で測定可能 | Top/ログイン/一覧を Lighthouse 等で測定 | URL | 合意閾値以内 |  | 未実施 | － | － |  |  | 依存:インフラ、要確認:閾値 |
| TC-PERF-002 | PERF02 | 性能 | 主要API応答時間 | バックエンド | 中 | 条件付き | API測定環境あり | 代表 API を複数回計測 | `/api/bookings` など | p95 が合意閾値以内 |  | 未実施 | － | － |  |  | 依存:バックエンド、要確認:閾値/測定方法 |
| TC-PERF-003 | PERF03 | 性能 | Service Worker 誤キャッシュ防止 | フロントエンド | 中 | 条件付き | SW 登録済み | 更新デプロイ後に API 応答キャッシュ挙動を確認 | なし | 認証/API を誤キャッシュしない |  | 未実施 | － | － |  |  | 依存:フロントエンド、依存:インフラ |
| TC-ERR-001 | ERR01 | 異常系 | ネットワーク障害時エラー表示 | フロントエンド | 中 | 条件付き | オフライン切替可能 | API操作中にオフライン化 | なし | ユーザー向け接続エラー表示 |  | 未実施 | － | － |  |  |  |
| TC-ERR-002 | ERR02 | 異常系 | 必須未入力バリデーション | フロントエンド | 中 | 条件付き | 対象フォーム表示 | 必須項目を空で送信 | 空値 | エラーメッセージ表示、送信抑止 |  | 未実施 | － | － |  |  |  |
| TC-ERR-003 | ERR03 | 異常系 | 決済・送信ボタン連打時重複防止 | 複合 | 高 | Yes | 決済可能予約/送信可能画面あり | 同一操作を連続クリック | 同一入力 | 重複決済/重複送信が発生しない |  | 未実施 | － | － |  |  | 依存:バックエンド、依存:外部サービス(要確認:PSP冪等性)、リリース不可候補。外部PSPを利用する場合は、PSP側のテスト環境・テストカード・決済ID・冪等性確認を追加する。 |
| TC-ERR-004 | ERR04 | 異常系 | Socket切断・再接続 | 複合 | 中 | 条件付き | Socket接続済み | 通信断→復帰→通知送受信確認 | なし | 再接続後に受信復帰 |  | 未実施 | － | － |  |  | 依存:Socket、依存:インフラ |
| TC-O-001 | - | 運用・切り戻し | リリース前バックアップ取得確認 | 運用 | 高 | Yes | 本番DB運用担当が確認可能 | バックアップ取得履歴/スナップショットを確認 | バックアップID/時刻 | リリース直前の復旧可能バックアップが存在 |  | 未実施 | － | － |  |  | 依存:運用、依存:インフラ、リリース不可候補 |
| TC-O-002 | - | 運用・切り戻し | 切り戻し手順書レビュー確認 | 運用 | 高 | Yes | `docs/ROLLBACK_PROCEDURE.md` 最新化済み | 実施者・承認者・手順の妥当性レビュー | なし | 手順書に不足がなく、当日連絡体制が確認済み |  | 未実施 | － | － |  |  | 依存:運用、リリース不可候補 |
| TC-O-003 | - | 運用・切り戻し | DBマイグレーションあり時の復旧方針確認 | 複合 | 高 | Yes | 今回リリースでDB変更有無を判定済み | DB変更ありの場合、復旧方針（リストア/フォワード修復）を事前承認 | migration有無/方針 | 復旧フロー・責任者・判断条件が定義済み |  | 未実施 | － | － |  |  | 依存:バックエンド、依存:インフラ、依存:運用、要確認:実環境手順、リリース不可候補 |

## 7. NG・保留・対象外の一覧

現時点で記録している保留案件を以下に示す（NG・対象外は該当時に追記する）。

| No | テストケースNo | 分類 | テストケース名 | 判定 | 内容 | リリース必須 | リリース影響 | 不具合ID | 対応方針 | 備考 |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | TC-E-002 | 外部連携 | SOCKET_SERVER_URL 本番向き先確認 | 保留 | デプロイ済み設定値は確認済みだが、Socket.io実接続・JWT handshake は未確認。 | Yes | 本番Socket接続確認が未完了 | － | 要確認 | ブラウザのNetwork/WSで確認後にOK化する |
| 2 | TC-E-003 | 外部連携 | CORS 許可オリジン確認 | 保留 | `/api/health`、`GET /api/auth/me`、Socket.io WebSocket通信で `Access-Control-Allow-Origin: https://kajishift-frontend.vercel.app` を確認。ただしRailway管理画面の `CORS_ORIGIN` と全APIでの設定確認は未実施。 | Yes | CORS設定の最終確認が未完了 | － | 要確認 | REST APIとSocket.io WebSocketのCORS応答は確認済み。Railway管理画面で `CORS_ORIGIN` を確認する。 |
| 3 | TC-N-001 | 通知 | Socket接続確立 | 保留 | Socket.io本番WebSocket接続は `101 Switching Protocols` で確立し、Consoleでも接続成功ログを確認。ただし切断時再接続試行は未確認。 | Yes | 通知・チャットの前提確認が未完了 | － | 要確認 | WebSocket接続成功は確認済み。切断時再接続試行を確認する。 |
| 4 | TC-SEC-001 | セキュリティ | HTTPS/SSL 配信確認 | 保留 | curlでフロント・APIともSSLエラーなし、HSTSヘッダあり。ブラウザ証明書詳細で `*.vercel.app`、Google Trust Services / WR1、有効期間 2026/02/26〜2026/05/27 を確認し、2026/05/12時点で有効期限内。ただし、カスタムドメイン利用有無の確認は未実施。 | Yes | HTTPS/SSL の最終確認が一部未完了 | － | 要確認 | Vercel本番URLの証明書は確認済み。カスタムドメイン利用有無と、利用する場合のHTTPS確認が残る。 |

対応方針（選択肢）:

- 修正必須
- リリース判定会議で判断
- 残課題管理
- 対象外として承認
- 要確認

## 8. リリース判定への影響

| 判定観点 | 状態 | 判断内容 | 備考 |
|---|---|---|---|
| リリース必須Yesの未実施 | 未達 | リリース必須Yesの未実施が多数残っており、リリース前に0件にする必要あり | 認証・権限・予約・決済・管理・運用など未実施 |
| リリース必須YesのNG | 未検出 | 現時点でNGは未登録 | テスト未実施項目が多いため、継続確認が必要 |
| 重要度高の保留 | あり | TC-E-002、TC-E-003、TC-N-001、TC-SEC-001 が保留 | Socket.io本番WebSocket接続とREST/Socket CORS応答は確認済み。Railway管理画面のCORS_ORIGIN、Socket切断時再接続、カスタムドメインHTTPS確認が未完了。 |
| 重大不具合 | 未確認 | `RELEASE_DEFECT_LIST.md` と突合が必要 | 現時点で本書上のNG登録はなし |
| 切り戻し確認 | 未確認 | TC-O-001〜003 が未実施 | バックアップ、手順レビュー、DB復旧方針が未確認 |
| 総合判定 | Hold | 一部外部連携確認は進んだが、リリース必須Yesの未実施・保留が残る | 認証・権限・予約・決済のP1確認へ進む |

## 9. 要確認事項

- 外部決済サービス連携の有無
- ステージング環境の有無
- テスト用アカウントの有無
- テスト用データの作成方法
- SMTP確認方法
- Socket確認方法
- 性能閾値
- `/api-docs` と `/api/health/db` の本番公開方針
- `api.uploadFile` の `category` と backend `fileType` の整合
- `getAdminStats` とバックエンドルートの整合
- ワーカーの `GET /api/payments` 利用可否
- `docs/ROLLBACK_PROCEDURE.md` の作成状況
- `docs/RELEASE_DEFECT_LIST.md` の作成状況
- `docs/RELEASE_CRITERIA.md` の作成状況

## 10. 改訂履歴

| 日付 | 内容 |
|---|---|
| 2026-05-18 | Stripe βフローのProduction APIスモーク結果を追記。`PaymentIntent=pi_3TYKXpFX94mMTqKm15d0ewBK`、`bookingId=bbb1ebf4-3111-4dcb-919b-db31952763a0`、Webhook後 `Payment.status=COMPLETED` を確認。 |
| 2026-05-12 | TC-E-001 / TC-E-003 / TC-N-001: ブラウザDevToolsでのAPI Request URL、REST/Socket CORS応答、Socket.io WebSocket 101接続の確認結果と証跡画像を追加。TC-E-003、TC-N-001 は残確認事項があるため保留を維持。 |
| 2026-05-12 | TC-SEC-001: Vercel本番URLの証明書詳細確認結果を追記し、証跡画像 `TC-SEC-001_certificate-vercelapp-valid.png` を追加。カスタムドメイン確認は保留として維持。 |
| 2026-05-12 | ブラウザ証跡 PNG を `docs/evidence/2026-05-12/` に格納し、TC-E-004・TC-SEC-001 の証跡列をリポジトリ相対パスに更新。 |
| 2026-05-12 | 依頼者・ワーカー・管理者ログイン画面のブラウザスクリーンショット（HTTPS・鍵アイコン・画面表示）を証跡として TC-E-004・TC-SEC-001 に反映。5・7・8章の記述を整合。 |
| 2026-05-12 | TC-SEC-001 の判定を定義済み判定値に合わせて保留へ修正。7章に保留一覧を追加し、8章リリース判定への影響を現状に合わせて更新。5章セキュリティサマリーを整合。 |
| 2026-05-12 | 外部連携・通知・セキュリティ: TC-E-001〜E-004、TC-SEC-001、TC-N-001 の curl 確認結果を6章に反映。5章サマリー更新。 |
| 2026-05-08 | 初版：RELEASE_TEST_CASES.md をもとにリリース判定用テスト結果記録表を作成 |

## 記入例（実施チーム運用向け）

| テストケースNo | 実際の結果 | 判定 | 証跡 | 不具合ID | 実施者 | 実施日 | 備考 |
|---|---|---|---|---|---|---|---|
| TC-L-001 | ログイン成功。`customer/dashboard.html` へ遷移し、`localStorage` に `token`/`user` を確認。 | OK | `evidence/TC-L-001_login_success.png` | － | 山田 | 2026-05-09 | 期待結果どおり |
| TC-PAY-002 | 同一 `bookingId` で2回目決済が成功してしまい、重複決済となった。 | NG | `logs/20260509_payment_duplicate.log` | DEF-012 | 佐藤 | 2026-05-09 | 期待結果との差分: 重複防止エラー未返却、修正必須 |
