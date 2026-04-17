# 本番環境：リアルタイム表示まわりのギャップタスク（優先順位付き）

フロントエンド実装に加え、**`kajishift-backend`（例: `C:\Users\谷口 梓\Desktop\kajishift-backend`）の現状**を踏まえ、対応の優先度を付けたタスク一覧です。

---

## バックエンド調査サマリ（リアルタイム関連）

| 項目 | 内容（根拠ファイル） |
|------|----------------------|
| Socket.io サーバ | `src/index.js` で HTTP サーバに `initializeSocket` を紐付け済み |
| 認証 | `src/config/socket.js` — JWT 検証後、`user:${userId}` ルームに参加。**CUSTOMER / WORKER / ADMIN いずれの User も同じ仕組みで接続可能** |
| 通知の push | `notificationService.createNotification` → `sendNotificationToUser` + `sendUnreadCount`（`src/services/notificationService.js`） |
| メッセージの push | `messageService.sendMessage` → 受信者 `receiverId` へ `sendMessage`（`src/services/messageService.js`）。**ワーカー ID が受信者ならワーカー向けにも emit される** |
| 予約まわりの通知 | `bookingService` 等で **顧客・該当ワーカー**向けに `createNotification`（例: 予約作成時はワーカーへ `BOOKING_CREATED`） |
| 管理者への自動 push | **予約のたびに全管理者へ Socket する処理は見当たらない**。`sendNotificationToRole('ADMIN', …)` は `socket.js` に定義あり。システム通知一斉送信（`adminService`）では対象ユーザーへ個別 emit あり |
| 本番ブロッカーになりやすい点 | Socket の CORS が **`CORS_ORIGIN`（カンマ区切り複数可）** の許可リスト依存（`src/config/socket.js`）。**Vercel の本番オリジンが未登録だと接続失敗** |

**結論（優先度の付け方）**

- **最優先** … 上記より先に、**本番で Socket 自体が繋がるか**（CORS / URL / WSS）。
- **高** … バックエンドが既に **ユーザー単位で emit している**通知・未読・メッセージを、フロントが **接続・表示していない**箇所（特にワーカー・依頼者ヘッダー）。
- **中** … **一覧・KPI の「常時同期」用イベントがバックエンドに無い**ため、**ポーリング**か**バックエンド拡張（ルーム・イベント追加）**が必要な箇所（管理ダッシュ・予約一覧のライブ更新など）。

---

## 優先度の定義

| 優先度 | 意味 |
|--------|------|
| **最優先** | 未達だと「依頼者の既存 Socket 連携」含め本番でリアルタイムが成立しない可能性が高い |
| **高** | バックエンドは push 可能なのにフロント未対応で **効果が取りこぼされている** |
| **中** | フロントだけでは足りず **ポーリング設計**または**バックエンドのイベント設計**がセット |
| **低** | リアルタイム以前の**表示の正しさ**や**固定ダミー値の解消** |

---

## 最優先（本番接続・インフラ）

- [ ] **Railway（本番）の `CORS_ORIGIN`** に、Vercel 本番のフロントオリジン（例: `https://kajishift-frontend.vercel.app` および運用ドメイン）を**必ず含める**（`kajishift-backend` の `src/config/socket.js` と `src/config/env.js` 側の HTTP CORS も合わせて確認）。
- [ ] ブラウザから **Socket.IO が `connect` 成功するか**（`connected` / `unread-count` が届くか）を本番でスモークテストする（`kajishift-backend/tests/test-socket.js` を本番 URL 向けに実行する、または実機で DevTools 確認）。
- [ ] **WSS / プロキシ**（Railway の公開 URL とフロントの `SOCKET_SERVER_URL` / `API_BASE_URL`）の組み合わせが一致しているか確認する。

---

## 高（バックエンド push 済み／API あり → フロントで受ける・見せる）

### ワーカー（worker）

- [ ] **全ワーカー画面**に Socket.IO クライアント + `js/socket.js` を読み込み、ログイン後に `socketManager.connect(token)` する（バックエンドは **WORKER ユーザーも同じ `user:` ルーム**で配信可能）。
- [ ] ヘッダー通知バッジを **`getUnreadNotificationCount` + Socket の `unread-count`** で更新し、**固定「3」を廃止**する（`dashboard.html`・`jobs.html`・`calendar.html` 等）。
- [ ] **ワーカー向けチャット画面**（予約単位で `message` API / Socket `message` を表示）を新設または既存ページに統合する（バックエンドは `sendMessage` で受信者へ push 済み。**依頼者 `chat.html` だけではワーカーが同 UI で返信できない**）。

### 依頼者（customer）

- [ ] **マイページ・通知・チャット以外**の全ヘッダーで、未読バッジを **`getUnreadNotificationCount` で初期化**し、可能なら **共通スクリプト化**（固定「2」等を廃止：`bookings.html`・`booking-detail.html`・`booking.html`・`payment.html`・`select-worker.html`・`chat.html` 等）。
- [ ] `favorites.html` 等、バッジのみで **未読 API を呼んでいないページ**を洗い出し、同様に連動させる。
- [ ] Socket 接続を **ページごとに閉じるのではなく**、依頼者ログイン後は **単一接続で維持**し全ページで `unread-count` / `notification` を反映できるよう設計する（実装は共有 JS 化が望ましい）。

---

## 中（ポーリング or バックエンド拡張が必要）

### 管理者（admin）

- [ ] ダッシュボードの **KPI・今日の予約・審査待ち・未対応問い合わせ**を、**一定間隔のポーリング**で再取得する、またはバックエンドに **管理者用ルーム**（例: `admin:global`）と **予約・チケット更新時の emit** を追加する（現状、**予約発生のたびに全管理者へ自動 Socket される仕様は前提にできない**）。
- [ ] `bookings.html`・`workers.html`・`users.html`・`support.html`・`payments.html` 等、**他端末での変更を開いたまま反映**したい要件があるなら、画面ごとに **再取得間隔**または **イベント設計**を決める。

### 依頼者・ワーカー（業務一覧）

- [ ] **ダッシュボードの直近予約**・**予約一覧・詳細**・ワーカー **jobs / calendar / dashboard** のリストを、**ポーリングで再取得**する、またはバックエンドに **`BOOKING_UPDATE` 等の購読用イベント**（該当ユーザー向けは既に通知レコード＋push の余地あり）を整理して **差分更新**する。
- [ ] 要件定義：**何秒以内に反映すればよいか**で、この区分（中）の実装方式（ポーリング間隔 vs Socket イベント）を確定する。

---

## 低（リアルタイム以前の表示・ダミー解消）

- [ ] ワーカーダッシュボードの **報酬サマリー**が `renderRewardSummary([])` のままなら、**`getPayments` 等の実データ**と接続する（バックエンドに支払い系 API あり。表示の正確さ優先）。
- [ ] 管理画面の **固定表示の運用者名**など（例: ダッシュボードの表示名）、**`getMe` 等で置き換え**（リアルタイムではないが本番品質に影響）。

---

## 横断（計画）

- [ ] **最優先の項目が完了してから**「高」に着手する（本番で接続不可なら「高」の実装検証ができない）。
- [ ] 「中」は **「管理者はポーリングで十分」**と割り切ると工数を抑えられる（バックエンド変更不要）。

---

## 実装時の推奨方針（メモ）

1. 依頼者・ワーカーは **未読・通知**から揃える（バックエンドは **ユーザー単位 push 済み**）。
2. 管理者は **まずダッシュボードだけ短周期ポーリング**（例: 60〜120 秒）を検討し、リアルタイム必須になったら Socket ルーム設計。
3. チャットは **ワーカー UI + Socket** が「高」の区分（双方向の UX 完成に直結）。

---

## 参照（リポジトリ）

| 内容 | 場所 |
|------|------|
| フロント: Socket 接続 | `customer/dashboard.html`, `customer/notifications.html`, `customer/chat.html` |
| フロント: Socket 実装 | `js/socket.js` |
| バックエンド: Socket サーバ | `kajishift-backend/src/config/socket.js` |
| バックエンド: 通知+push | `kajishift-backend/src/services/notificationService.js` |
| バックエンド: メッセージ+push | `kajishift-backend/src/services/messageService.js` |
| バックエンド: 予約通知 | `kajishift-backend/src/services/bookingService.js`（`createNotification` 呼び出し） |

---

*最終更新: `kajishift-frontend` と `kajishift-backend` の現行ツリーに基づく。環境変数・デプロイ設定は本番ごとに要確認。*
