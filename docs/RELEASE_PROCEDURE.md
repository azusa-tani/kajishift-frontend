# KAJISHIFT リリース手順書

本書は **kajishift-frontend** リポジトリの README、`vercel.json`、デプロイ関連ドキュメント、および **kajishift-backend**（別リポジトリ）の `package.json`・環境変数バリデーションを確認して整理したリリース手順です。リポジトリ内に **Dockerfile / docker-compose / GitHub Actions ワークフローは存在しません**（要確認事項に記載）。

---

## 1. リリース概要

| 項目 | 内容 |
|------|------|
| 目的 | 本番環境（フロント: Vercel、バックエンド: Railway、DB: PostgreSQL）へ安全に変更を反映し、利用者・ワーカー・管理者向け機能の可用性を維持する |
| 前提 | フロントは静的 HTML/JS（ビルドコマンド不要）。バックエンドは Node.js + Express + Prisma |
| リリース単位 | **フロント**と**バック**は別リポジトリのため、互いに依存する変更（API・スキーマ・`js/config.js`）は**同一リリースウィンドウ内**で計画する |

---

## 2. 対象バージョン

| コンポーネント | バージョンの決め方 | 記録例 |
|------------------|-------------------|--------|
| フロント（本書リポジトリ） | Git **タグ**またはデプロイ対象 **コミット SHA** | `v1.2.0` / `abc1234…` |
| バックエンド（kajishift-backend） | 同上 | **要確認**（チームのタグ付け規約） |
| DB スキーマ | Prisma マイグレーション名または `schema.prisma` 変更に紐づくリビジョン | `20260501_add_completed_at` 等 |

リリース票には「フロントコミット／バックエンドコミット／マイグレーション有無」を必ず記載する。

---

## 3. リリース対象

| 区分 | 対象 | 備考 |
|------|------|------|
| フロントエンド | **Vercel** 上の `kajishift-frontend`（本番 URL: `https://kajishift-frontend.vercel.app`） | README 記載 |
| バックエンド API・Socket | **Railway** 上の `kajishift-backend`（例: `https://kajishift-backend-production.up.railway.app`） | README・`js/config.js` の既定値 |
| データベース | PostgreSQL（バックエンド `DATABASE_URL`） | Prisma で管理 |
| 静的ドキュメント・SEO | `robots.txt` / `sitemap.xml` / 法務ページ等 | フロントと同時デプロイ |

**本リポジトリに含まれないもの**: バックエンドの Railway 設定詳細、本番 DB のバックアップ UI。**運用手順は「要確認」**。

---

## 4. 事前準備

| # | 作業 | 確認元 |
|---|------|--------|
| 1 | **リリースノート**に API 互換・マイグレーションの有無・ロールバック方針を記載 | 社内テンプレ |
| 2 | `docs/DEPLOYMENT_CHECKLIST.md` の HTTPS・CORS・`js/config.js` 読み込み順を再確認 | 本リポジトリ |
| 3 | バックエンドで `NODE_ENV=production`、必須環境変数が Railway に設定済みか確認 | `kajishift-backend/src/config/env.js`（`DATABASE_URL`, `JWT_SECRET`, `PORT`） |
| 4 | フロント `js/config.js` の `API_BASE_URL` / `SOCKET_SERVER_URL` が**リリース後**指すべき本番 API と一致しているか | `js/config.js` |
| 5 | ステージング環境がある場合は先にデプロイして E2E／スモーク実施 | **要確認** |
| 6 | メンテナンス告知が必要か（メール・管理画面バナー等） | 運用ポリシー **要確認** |

---

## 5. 事前バックアップ

| 対象 | 推奨 | 備考 |
|------|------|------|
| **PostgreSQL** | スナップショットまたは `pg_dump` | Railway のバックアップ機能の有無・手順は **要確認**（ダッシュボードで確認） |
| **バックエンドの永続ファイル** | `uploads/` 等をホストしている場合のコピー | `uploadService`・ボリューム設定は **要確認** |
| **環境変数** | Railway の Variables をエクスポートまたはスクリーンショット（秘密値は保存場所を限定） | 復旧用 |
| **フロント** | デプロイは Git 履歴で再現可能。タグ付け推奨 | — |

マイグレーションを伴うリリースでは、**バックアップ完了を Go 判定**に含める。

---

## 6. デプロイ手順

### 6.1 フロントエンド（Vercel）

README・`docs/VERCEL_DEPLOY.md` に基づく標準手順:

1. **本番用 `js/config.js` をコミット**（API / Socket URL が本番 Railway を向いていること）。
2. **GitHub の対象ブランチへマージ**（通常 `main`。**production ブランチ名は要確認**）。
3. **Vercel** が連携リポジトリのプッシュを検知し、**自動デプロイ**（README: 「GitHub push → 自動デプロイ」）。
4. デプロイ完了後、Vercel ダッシュボードで **Production URL** とデプロイログを確認。

補足:

- `vercel.json` は `@vercel/static` でルート全体を静的配信する設定です。
- CLI での手動デプロイ: `vercel --prod`（`docs/VERCEL_DEPLOY.md`）。運用方針が Git 連携のみか **要確認**。

### 6.2 バックエンド（Railway）

本フロントリポジトリに Railway の設定ファイルは含まれないため、手順は概要のみ:

1. **kajishift-backend** リポジトリの対象コミットを本番にデプロイ（Git 連携または手動）。
2. Railway で **ビルド／起動コマンド**が `package.json` の `start`（`node src/index.js`）と整合しているか確認。
3. `postinstall` で `prisma generate` が走ることを確認（`package.json`）。
4. デプロイ後、ログで起動エラーがないか確認。

**Docker**: 両リポジトリを確認した範囲では **Dockerfile は未検出**。Railway が Nixpacks 等でビルドしている想定。**コンテナ定義の所在は要確認**。

### 6.3 CI/CD（自動化の実体）

- **フロント**: README 上は **GitHub → Vercel の統合**。リポジトリ内に `.github/workflows/*.yml` は**無し**。
- **バックエンド**: リポジトリ内にワークフロー **無し**（確認済み）。

実際の「どのブランチが本番か」「プレビューデプロイの有無」は **Vercel / Railway のプロジェクト設定で要確認**。

---

## 7. DB マイグレーション手順

DB は **kajishift-backend** の Prisma で管理します（フロントリポジトリにはマイグレーションファイルなし）。

| コマンド（バックエンド repo） | 用途 |
|-------------------------------|------|
| `npm run prisma:migrate`（=`prisma migrate dev`） | **開発**向け。本番では通常使わない |
| `npm run prisma:migrate:deploy`（=`prisma migrate deploy`） | **本番**へ保留中マイグレーションを適用 |
| `npm run prisma:generate` | クライアント生成（`postinstall` / `build` に含まれる） |

**推奨される本番フロー（概念）**:

1. 変更をステージングまたはローカルで `migrate dev` し、**マイグレーションファイルをコミット**。
2. メンテ時間中（または低トラフィック時）、本番 DB に対して **`prisma migrate deploy`** を実行。  
   - 実行場所: Railway の **ワンショットコマンド / CI / 管理者ローカルから本番 `DATABASE_URL`** など。**組織標準は要確認**。
3. 成功後、バックエンドを再起動または再デプロイ（マイグレーションをデプロイ前に行うか後に行うかは **ダウンタイム要件次第・要確認**）。

`docs/INTEGRATION_STATUS.md` 等では過去に `prisma db push` の言及があるが、**本番は `migrate deploy` を優先**することが一般的。

---

## 8. 環境変数・設定変更

### 8.1 フロント（コード・設定ファイル）

| 設定 | 場所 | 内容 |
|------|------|------|
| API 基底 URL | `js/config.js` の `window.API_BASE_URL` | 例: `https://kajishift-backend-production.up.railway.app/api` |
| Socket.io URL | `js/config.js` の `window.SOCKET_SERVER_URL` | 例: 同一ホストのオリジン（`/api` なし） |
| キャッシュバスト | `window.KAJISHIFT_CONFIG_VERSION` | 必要に応じて更新（`config.js` 内コメント参照） |

Vercel の「Environment Variables」でフロントのビルド時注入をしている場合は **要確認**（静的サイトではリポジトリの `config.js` が主）。

### 8.2 バックエンド（Railway・`.env`）

`src/config/env.js` で **必須**: `DATABASE_URL`, `JWT_SECRET`, `PORT`。

| 変数 | 用途 | 備考 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL | `postgresql://` で始まる必要あり |
| `JWT_SECRET` | JWT 署名 | 本番は 32 文字以上推奨（警告のみ） |
| `PORT` | リッスンポート | Railway が注入することが多い |
| `NODE_ENV` | `production` 推奨 | エラー詳細・レート制限等に影響 |
| `CORS_ORIGIN` | REST・Socket の許可オリジン | カンマ区切りで複数可。既定は `https://kajishift-frontend.vercel.app`（`index.js` / `socket.js`） |
| `JWT_EXPIRES_IN` | トークン有効期限 | 既定 `24h` |
| `BCRYPT_ROUNDS` | ハッシュコスト | 既定 10 |
| `RATE_LIMIT_*` / `DISABLE_RATE_LIMIT` | レート制限 | `middleware/security.js` |
| `SMTP_*` / `FRONTEND_URL` | メール・リンク生成 | `emailService.js`。未設定時メール機能は制限される可能性あり **要確認** |
| `LOG_LEVEL` | ログレベル | 任意 |
| `CLOUD_STORAGE_URL` | 本番ファイル URL プレフィックス | 任意 |

フロントのカスタムドメインを追加した場合は **`CORS_ORIGIN` を必ず更新**。

---

## 9. 動作確認手順

`docs/RELEASE_CRITERIA.md`（合格基準）および `tests/*/TEST_CHECKLIST.md` を参照しつつ、最低限以下を実施する。

| # | 確認項目 | 手段 |
|---|----------|------|
| 1 | `GET /api/health` が 200 | ブラウザまたは curl |
| 2 | フロントからログイン（依頼者・ワーカー・管理者）し JWT が保存される | 各 `login.html` |
| 3 | `js/config.js` 経由で API が本番 Railway に向いている | DevTools → Network |
| 4 | Socket.io 接続（通知・未読） | 2 ブラウザまたはコンソール |
| 5 | 予約・決済・領収書 PDF・レビュー等、当リリースで変更した機能 | 該当画面 |
| 6 | PWA: Service Worker が更新され、古いキャッシュで致命的でないか | Application タブ |

---

## 10. リリース後確認

| # | 項目 |
|---|------|
| 1 | Vercel / Railway の **エラーログ**（5xx 急増なし） |
| 2 | **データ整合性**（サンプル予約・決済レコードが期待どおり） |
| 3 | **監視・アラート**がある場合は閾値確認（**要確認**: ツール名） |
| 4 | ユーザー問い合わせチャネルに異常なし |
| 5 | `docs/RELEASE_CRITERIA.md` の Should-Have 未達があれば是正チケット起票 |

---

## 11. 連絡体制

| 役割 | 担当 | 連絡手段 |
|------|------|----------|
| リリース責任者 | **要確認** | **要確認** |
| フロント確認 | **要確認** | |
| バックエンド／DB | **要確認** | |
| 運用・顧客告知 | **要確認** | |

インシデント時のエスカレーション先・オンコールは **要確認**。

---

## 12. 判断ポイント（Go / No-Go）

| 判定 | 条件の例 |
|------|----------|
| **Go** | 事前バックアップ完了、ステージングまたはスモーク合格、`CORS_ORIGIN` と `config.js` 整合、マイグレーション試験済み |
| **No-Go** | 必須環境変数欠落、マイグレーション失敗、本番 DB 接続不能、フロントだけ先行して API 不整合 |
| **Go（限定）** | メンテナンス画面の表示、読み取り専用モード等でリスクを隔離できる場合（**要確認**: 実装の有無） |

---

## 13. 注意事項

1. **リポジトリ分割**: フロントとバックのデプロイ順序は変更内容次第（API 破壊的変更ならバック先行→フロント、後方互換なら順序柔軟）。**必ず事前に合意**。
2. **`/api/health/db`**: バックエンドは診断用に DB 情報を返しうるため、**本番で公開するか IP 制限するか要確認**。
3. **Swagger**（`/api-docs`）: 本番で公開するか **要確認**。
4. **管理者公開登録**（`admin/register.html` と `POST /api/auth/register`）: セキュリティ上、本番では無効化または秘匿 URL の運用を検討（README・機能一覧参照）。
5. **Service Worker**: デプロイ後、利用者側でキャッシュが残ることがある。`DEPLOYMENT_CHECKLIST.md` のとおり更新確認・強制リロード案内を検討。
6. **ドキュメントの URL**: README の canonical（`kajishift.jp`）と実際のホスト（`*.vercel.app`）が異なる場合、**マーケ／DNS の正規 URL を要確認**。

---

## 参考ファイル一覧（本リポジトリ）

| ファイル | 内容 |
|----------|------|
| `README.md` | 本番 URL、CI/CD 概要、`js/config.js` 例 |
| `vercel.json` | Vercel 静的ビルド設定 |
| `js/config.js` | API / Socket URL |
| `docs/DEPLOYMENT_CHECKLIST.md` | デプロイ前チェック |
| `docs/VERCEL_DEPLOY.md` | Vercel 手順詳細 |
| `docs/RELEASE_CRITERIA.md` | 本番合格基準 |

バックエンド（別 repo）: `package.json`（Prisma スクリプト）、`src/config/env.js`（必須環境変数）。

---

## 改訂履歴

| 日付 | 内容 |
|------|------|
| 2026-05-08 | 初版作成（README・vercel.json・DEPLOYMENT_CHECKLIST・VERCEL_DEPLOY・バックエンド package.json / env.js を参照。Docker / CI ワークフロー不在を明記） |
