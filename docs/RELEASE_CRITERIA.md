# KAJISHIFT リリース判定基準

## 1. 文書の目的

- 本書は、KAJISHIFTの本番リリース可否を判断するための基準を定義する。
- `RELEASE_TEST_PERSPECTIVES.md`、`RELEASE_TEST_CASES.md`、`RELEASE_TEST_RESULTS.md`、`RELEASE_DEFECT_LIST.md`、`ROLLBACK_PROCEDURE.md` と併用する。
- リリース判定は、機能・品質・セキュリティ・環境・運用・切り戻し準備を総合して判断する。
- 本書の基準を満たさない場合は、原則としてリリース不可またはリリース判定会議で承認が必要。

## 2. 前提

- 対象は `kajishift-frontend` および `kajishift-backend`。
- フロントエンドは Vercel、バックエンドは Railway を本番想定とする。
- DBはバックエンド側で管理される想定とする。
- テスト結果は `docs/RELEASE_TEST_RESULTS.md` を正とする。
- 不具合・保留事項は `docs/RELEASE_DEFECT_LIST.md` を正とする。
- 切り戻し可否は `docs/ROLLBACK_PROCEDURE.md` を正とする。
- 本書作成時点で不明な内容は「要確認」と明記する。

## 3. リリース判定の基本方針

- 重要度「高」かつリリース必須「Yes」のテストケースは、原則すべてOKであること。
- リリース必須「Yes」の未実施・NGがある場合は、原則リリース不可。
- 致命的または重大度「高」の未解決不具合がある場合は、原則リリース不可。
- 認証・権限・予約・決済・管理機能・個人情報・本番接続に関わる不具合は厳格に扱う。
- 保留事項がリリース条件に関わる場合は、リリース判定会議で確認する。
- 切り戻し手順が未整備、または切り戻し後確認ができない場合は、リリース不可候補とする。

## 4. Go / No-Go 判定区分

| 判定 | 意味 | 条件 |
|---|---|---|
| Go | リリース可 | 必須条件を満たし、重大な未解決不具合がない |
| Conditional Go | 条件付きリリース可 | 軽微な残課題または承認済み保留のみ残っている |
| No-Go | リリース不可 | 必須条件未達、重大不具合、切り戻し不可などがある |
| Hold | 判定保留 | 環境・仕様・承認などの情報不足で判断できない |

## 5. リリース必須条件

| No | 分類 | 必須条件 | 確認資料 | 判定 | 備考 |
|---|---|---|---|---|---|
| 1 | 認証・権限 | customer / worker / admin が正常にログインできる | `docs/RELEASE_TEST_RESULTS.md`（TC-L-001〜003） | 未判定 | |
| 2 | 認証・権限 | 誤認証時にトークンが保存されない | `docs/RELEASE_TEST_RESULTS.md`（TC-L-004, TC-L-005） | 未判定 | |
| 3 | 認証・権限 | 未ログイン時に保護画面へアクセスできない | `docs/RELEASE_TEST_RESULTS.md`（TC-P-001） | 未判定 | |
| 4 | 認証・権限 | 非adminユーザーがadmin画面・admin APIへアクセスできない | `docs/RELEASE_TEST_RESULTS.md`（TC-P-002〜004, TC-SEC-003） | 未判定 | |
| 5 | 予約・ワーカー業務 | 予約作成、編集、キャンセルが正常にできる | `docs/RELEASE_TEST_RESULTS.md`（TC-C-004〜006） | 未判定 | |
| 6 | 予約・ワーカー業務 | ワーカーが案件を承諾、拒否、完了できる | `docs/RELEASE_TEST_RESULTS.md`（TC-W-004〜006） | 未判定 | |
| 7 | 予約・ワーカー業務 | 予約ステータスが PENDING / CONFIRMED / COMPLETED / CANCELLED へ正しく遷移する | `docs/RELEASE_TEST_RESULTS.md`（TC-B-002〜005） | 未判定 | |
| 8 | 決済・請求 | 決済確定が正常にできる | `docs/RELEASE_TEST_RESULTS.md`（TC-PAY-001, TC-C-007） | 未判定 | |
| 9 | 決済・請求 | 二重決済が防止される | `docs/RELEASE_TEST_RESULTS.md`（TC-PAY-002, TC-ERR-003） | 未判定 | |
| 10 | 決済・請求 | 領収書PDFが出力できる | `docs/RELEASE_TEST_RESULTS.md`（TC-PAY-003, TC-C-008） | 未判定 | |
| 11 | 決済・請求 | 外部PSPを利用する場合、PSP側のテスト環境・テストカード・決済ID・冪等性確認が完了している | `docs/RELEASE_TEST_RESULTS.md` / `docs/RELEASE_DEFECT_LIST.md` | 未判定 | 要確認 |
| 12 | 管理画面 | 管理者ダッシュボードが表示できる | `docs/RELEASE_TEST_RESULTS.md`（TC-A-001） | 未判定 | |
| 13 | 管理画面 | ユーザー一覧・停止ができる | `docs/RELEASE_TEST_RESULTS.md`（TC-A-002, TC-A-003） | 未判定 | |
| 14 | 管理画面 | ワーカー一覧・承認・停止ができる | `docs/RELEASE_TEST_RESULTS.md`（TC-A-006〜008） | 未判定 | |
| 15 | 管理画面 | 予約管理ができる | `docs/RELEASE_TEST_RESULTS.md`（TC-A-011, TC-B-006〜008） | 未判定 | |
| 16 | 管理画面 | 支払い・売上一覧が確認できる | `docs/RELEASE_TEST_RESULTS.md`（TC-A-012） | 未判定 | 要確認 |
| 17 | 通知・Socket | Socket接続ができる | `docs/RELEASE_TEST_RESULTS.md`（TC-N-001） | 部分確認 | TC-N-001 は保留。本番 WebSocket 101・接続ログは確認済。切断時再接続は未確認。 |
| 18 | 通知・Socket | 通知イベント・メッセージイベントが受信できる | `docs/RELEASE_TEST_RESULTS.md`（TC-N-002, TC-N-003） | 未判定 | |
| 19 | 通知・Socket | 未読数が更新される | `docs/RELEASE_TEST_RESULTS.md`（TC-N-004） | 未判定 | |
| 20 | CSV・帳票 | bookings / users / workers / revenue のCSVエクスポートができる | `docs/RELEASE_TEST_RESULTS.md`（TC-CSV-001〜004） | 未判定 | |
| 21 | CSV・帳票 | 領収書PDFが文字化けせず開ける | `docs/RELEASE_TEST_RESULTS.md`（TC-PAY-003, TC-C-008） | 未判定 | |
| 22 | 本番環境・外部連携 | `API_BASE_URL` が本番APIを向いている | `js/config.js`, `docs/RELEASE_TEST_RESULTS.md`（TC-E-001） | 達成 | TC-E-001 OK（curl・ブラウザ `GET /api/auth/me`）。 |
| 23 | 本番環境・外部連携 | `SOCKET_SERVER_URL` が本番Socketを向いている | `js/config.js`, `docs/RELEASE_TEST_RESULTS.md`（TC-E-002） | 部分確認 | TC-E-002 は保留。デプロイ `config` と TLS 応答は確認済。ブラウザ実 WS は TC-N-001 で確認済だが、E-002 行の最終判定は `RELEASE_TEST_RESULTS.md` に従う。 |
| 24 | 本番環境・外部連携 | CORSが本番フロントを許可している | `docs/RELEASE_TEST_RESULTS.md`（TC-E-003） | 部分確認 | TC-E-003 は保留。REST/Socket のブラウザ応答は確認済。Railway 変数と全API網羅は未。`docs/RELEASE_DEFECT_LIST.md`（PEND-014）。 |
| 25 | 本番環境・外部連携 | Vercelで主要画面が配信される | `vercel.json`, `docs/RELEASE_TEST_RESULTS.md`（TC-E-004） | 達成 | TC-E-004 OK。 |
| 26 | 本番環境・外部連携 | HTTPS/SSLが有効である | `docs/RELEASE_TEST_RESULTS.md`（TC-SEC-001） | 部分確認 | TC-SEC-001 は保留。Vercel 既定ドメインの証明書は確認済。独自ドメインは未。`docs/RELEASE_DEFECT_LIST.md`（PEND-015）。 |
| 27 | セキュリティ | JWT、個人情報、認証情報が不適切に露出しない | `docs/RELEASE_TEST_RESULTS.md`（TC-SEC-002, TC-SEC-004） | 未判定 | |
| 28 | セキュリティ | 管理画面URLが未認証または非adminで利用できない | `docs/RELEASE_TEST_RESULTS.md`（TC-SEC-003） | 未判定 | |
| 29 | セキュリティ | 本番で不要なデバッグログが出ていない | `docs/RELEASE_TEST_RESULTS.md`（TC-SEC-004） | 未判定 | |
| 30 | セキュリティ | `/api-docs` と `/api/health/db` の本番公開方針が決定済みである | `docs/RELEASE_TEST_RESULTS.md`（TC-SEC-005, TC-SEC-006）, `docs/RELEASE_DEFECT_LIST.md` | 未判定 | 要確認 |
| 31 | 運用・切り戻し | リリース前バックアップが取得済みである | `docs/RELEASE_TEST_RESULTS.md`（TC-O-001） | 未判定 | |
| 32 | 運用・切り戻し | 切り戻し手順書がレビュー済みである | `docs/RELEASE_TEST_RESULTS.md`（TC-O-002）, `docs/ROLLBACK_PROCEDURE.md` | 未判定 | |
| 33 | 運用・切り戻し | DBマイグレーションがある場合、復旧方針が承認済みである | `docs/RELEASE_TEST_RESULTS.md`（TC-O-003）, `docs/ROLLBACK_PROCEDURE.md` | 未判定 | |
| 34 | 運用・切り戻し | 切り戻し後の代表動作確認項目が定義済みである | `docs/ROLLBACK_PROCEDURE.md`（第12章・第18章） | 未判定 | |

## 6. リリース不可条件

| No | リリース不可条件 | 理由 | 関連資料 |
|---|---|---|---|
| 1 | 全ロールまたは必須ロールでログインできない | サービス利用不可 | `docs/RELEASE_TEST_RESULTS.md` |
| 2 | 非adminユーザーがadmin画面またはadmin APIにアクセスできる | 権限逸脱・重大セキュリティリスク | `docs/RELEASE_TEST_RESULTS.md`, `docs/RELEASE_DEFECT_LIST.md` |
| 3 | 予約作成・編集・キャンセルができない | 主要業務停止 | `docs/RELEASE_TEST_RESULTS.md` |
| 4 | ワーカーの承諾・拒否・完了ができない | 業務フロー停止 | `docs/RELEASE_TEST_RESULTS.md` |
| 5 | 決済で二重決済、失敗時不整合、領収書出力不可が発生する | 金銭事故・会計不整合 | `docs/RELEASE_TEST_RESULTS.md`, `docs/RELEASE_DEFECT_LIST.md` |
| 6 | 顧客・ワーカー・予約・決済データが誤って更新される | データ整合性破綻 | `docs/RELEASE_TEST_RESULTS.md`, `docs/RELEASE_DEFECT_LIST.md` |
| 7 | 管理者の主要機能が使えない | 運用不能 | `docs/RELEASE_TEST_RESULTS.md` |
| 8 | 個人情報・JWT・認証情報が不適切に露出する | 法令・セキュリティリスク | `docs/RELEASE_TEST_RESULTS.md`, `docs/RELEASE_DEFECT_LIST.md` |
| 9 | 本番API、Socket、CORS、SSLの設定が誤っている | 本番接続不全・セキュリティリスク | `js/config.js`, `docs/RELEASE_TEST_RESULTS.md`, `vercel.json` |
| 10 | 致命的または重大度「高」の未解決不具合がある | 高リスク残存 | `docs/RELEASE_DEFECT_LIST.md` |
| 11 | リリース必須YesのテストケースにNGまたは未実施がある | 必須品質未達 | `docs/RELEASE_TEST_RESULTS.md` |
| 12 | DB変更があるにもかかわらず、復旧方針が未承認である | 切り戻し不能リスク | `docs/ROLLBACK_PROCEDURE.md`, `docs/RELEASE_TEST_RESULTS.md` |
| 13 | 切り戻し手順が未整備、または実施担当者が不明である | 障害時の復旧不能リスク | `docs/ROLLBACK_PROCEDURE.md` |

## 7. 条件付きリリースの条件

- 条件付きリリースは、リリース判定会議で承認された場合のみ可とする。
- 対象となるのは、重大度「中」以下、または回避策がある不具合に限る。
- 重大度「高」以上、認証・権限・決済・個人情報に関する不具合は原則対象外。
- 条件付きリリースする場合は、残課題、回避策、担当者、対応期限を記録する。

| 条件付き項目 | 内容 | 回避策 | 担当者 | 対応期限 | 承認者 |
|---|---|---|---|---|---|
| 記入欄 | 例: 性能閾値未確定のため条件付き | 例: 監視強化、段階的公開 |  |  |  |

## 8. テスト結果に関する基準

| 項目 | 基準 | 確認資料 |
|---|---|---|
| 総テスト件数 | `RELEASE_TEST_RESULTS.md` の総件数を確認（現時点: 97件） | `docs/RELEASE_TEST_RESULTS.md` |
| リリース必須Yes | 原則すべてOK | `docs/RELEASE_TEST_RESULTS.md` |
| 未実施 | リリース必須Yesでは0件 | `docs/RELEASE_TEST_RESULTS.md` |
| NG | リリース必須Yesでは0件 | `docs/RELEASE_TEST_RESULTS.md` |
| 保留 | リリース条件に関わるものは判定会議で判断 | `docs/RELEASE_TEST_RESULTS.md` / `docs/RELEASE_DEFECT_LIST.md` |
| 証跡 | OK判定には原則証跡があること | `docs/RELEASE_TEST_RESULTS.md` |

## 9. 不具合・保留事項に関する基準

| 項目 | 基準 | 確認資料 |
|---|---|---|
| 致命的な未解決不具合 | 0件 | `docs/RELEASE_DEFECT_LIST.md` |
| 重大度「高」の未解決不具合 | 0件 | `docs/RELEASE_DEFECT_LIST.md` |
| 認証・権限・決済・個人情報関連の未解決不具合 | 0件 | `docs/RELEASE_DEFECT_LIST.md` |
| 重大度「中」以下の残課題 | 回避策・担当者・期限が明確であること | `docs/RELEASE_DEFECT_LIST.md` |
| 保留事項 | リリース影響が判定済みであること | `docs/RELEASE_DEFECT_LIST.md` |

補足:

- 初期登録済みの `PEND-001`〜`PEND-013` は、リリース判定前に確認対象とする。

## 10. セキュリティ基準

- 権限不一致でadmin画面・admin APIを利用できない。
- JWT、個人情報、認証情報がURL・画面・ログに不適切に出ない。
- HTTPS/SSLが有効。
- 本番で不要なデバッグログが出ていない。
- `/api-docs` と `/api/health/db` の本番公開方針が承認済み。
- CSPの有無は要確認とし、少なくともXSSリスクを認識していること。

## 11. 本番環境・外部連携基準

- Vercel Production デプロイが完了している。
- Railway上のバックエンドが正常稼働している。
- `API_BASE_URL` / `SOCKET_SERVER_URL` が本番向きである。
- CORSが本番フロントを許可している。
- SMTP確認方法が確定している。
- 外部PSPを利用する場合はテスト環境・本番キー・冪等性・テストカード方針が確認済み。
- ファイルアップロード保存先が確認済み。
- Socket接続が確認済み。

## 12. 運用・切り戻し基準

- `ROLLBACK_PROCEDURE.md` が作成済みである。
- リリース前バックアップ取得方法が確認済みである。
- 切り戻し判断者・承認者が明確である。
- DB変更がある場合、バックアップ復元またはフォワード修復の方針が承認済みである。
- 切り戻し後の確認項目が定義済みである。
- 関係者連絡手順が定義済みである。
- 当日用チェックリストが用意されている場合は、それも確認対象とする。

## 13. 承認基準

| 承認者 | 承認内容 | 承認結果 | 承認日 | 備考 |
|---|---|---|---|---|
| リリース責任者 | Go / No-Go 最終判断 | 未承認 |  | 要確認 |
| 開発責任者 | 技術的リリース可否 | 未承認 |  | 要確認 |
| QA担当 | テスト結果確認 | 未承認 |  | 要確認 |
| 運用担当 | 切り戻し・監視・連絡体制確認 | 未承認 |  | 要確認 |
| 事業/PO | 業務観点でのリリース可否 | 未承認 |  | 要確認 |

## 14. リリース判定チェックリスト

### 14.1 テスト

- [ ] リリース必須Yesのテストケースがすべて実施済み
- [ ] リリース必須YesのテストケースがすべてOK
- [ ] NG項目がすべて不具合一覧に登録済み
- [ ] 保留項目がすべて保留事項一覧に登録済み
- [ ] OK項目に必要な証跡がある

### 14.2 不具合

- [ ] 致命的な未解決不具合が0件
- [ ] 重大度「高」の未解決不具合が0件
- [ ] 認証・権限・決済・個人情報関連の未解決不具合が0件
- [ ] 残課題には回避策・担当者・期限がある
- [ ] 条件付きリリース項目は承認済み

### 14.3 環境・外部連携

- [ ] Vercel Production が正常配信されている
- [ ] Railway Backend が正常稼働している
- [ ] API / Socket URL が本番向きである
- [ ] CORS が本番フロントを許可している
- [ ] HTTPS/SSL が有効
- [ ] SMTP確認方法が確定している
- [ ] 外部PSP利用有無が確定している
- [ ] ファイルアップロード保存先が確認済み

### 14.4 運用・切り戻し

- [ ] リリース前バックアップが取得済み
- [ ] `ROLLBACK_PROCEDURE.md` がレビュー済み
- [ ] DB変更有無を確認済み
- [ ] DB変更ありの場合、復旧方針が承認済み
- [ ] 切り戻し判断者・承認者が明確
- [ ] 切り戻し後の確認項目が明確
- [ ] 関係者連絡方法が明確

### 14.5 承認

- [ ] QA担当がテスト結果を確認済み
- [ ] 開発責任者が技術観点で承認済み
- [ ] 運用担当が運用・切り戻し観点で承認済み
- [ ] 事業/POが業務観点で承認済み
- [ ] リリース責任者が最終承認済み

## 15. リリース判定結果記録

| 項目 | 内容 |
|---|---|
| 判定日 | |
| 判定者 | |
| 判定結果 | Hold（`docs/RELEASE_TEST_RESULTS.md` §8 と整合。2026-05-12） |
| 対象バージョン/コミット | |
| リリース予定日時 | |
| 主な確認結果 | |
| 残課題 | |
| 条件付きリリース条件 | |
| 最終コメント | |

## 16. 要確認事項

- 外部決済サービス連携の有無
- ステージング環境の有無
- テスト用アカウントの有無
- テスト用データの作成方法
- SMTP確認方法
- Socket確認方法（切断時再接続・複数端末・イベント受信）
- Railway の `CORS_ORIGIN` と CORS の全API網羅（TC-E-003 / `docs/RELEASE_DEFECT_LIST.md` PEND-014）
- 独自ドメイン運用時の HTTPS/証明書（TC-SEC-001 / PEND-015）
- 性能閾値
- `/api-docs` と `/api/health/db` の本番公開方針
- `api.uploadFile` の `category` と backend `fileType` の整合
- `getAdminStats` とバックエンドルートの整合
- ワーカーの `GET /api/payments` 利用可否
- DBマイグレーションの有無
- 本番DBバックアップ方式
- 切り戻し判断者・承認者
- 監視・障害連絡体制

## 17. 改訂履歴

| 日付 | 内容 |
|---|---|
| 2026-05-08 | 初版：KAJISHIFTのリリース判定基準を作成 |
| 2026-05-12 | §5 必須条件の判定列を `RELEASE_TEST_RESULTS.md` に合わせ更新（No.17, 22〜26 等）。§15 判定結果を Hold に。§16 に CORS 網羅・独自ドメイン TLS を追記 |
