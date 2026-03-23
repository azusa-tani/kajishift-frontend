# Netlifyデプロイ動作確認チェックリスト

**作成日**: 2026年3月2日  
**Netlify URL**: `https://stellar-phoenix-fa7d94.netlify.app`

## 📋 確認項目

### 1. 基本表示確認

#### 1.1 トップページ
- [ ] URL: `https://stellar-phoenix-fa7d94.netlify.app/`
- [ ] ページが正しく表示されるか
- [ ] ヘッダーに「依頼者ログイン」「ワーカーログイン」が表示されるか
- [ ] フッターに「管理者」リンクが表示されるか
- [ ] サービスメニューが正しく表示されるか（「掃除」「洗濯」「買い物代行（日用品・食材）」）
- [ ] 特徴カードのアイコン画像が正しく表示されるか
- [ ] 「ご利用の流れ」ボタンが正しく表示されるか
- [ ] すべての画像が正しく読み込まれるか

#### 1.2 ログインページ
- [ ] 依頼者ログイン: `https://stellar-phoenix-fa7d94.netlify.app/customer/login.html`
- [ ] ワーカーログイン: `https://stellar-phoenix-fa7d94.netlify.app/worker/login.html`
- [ ] 管理者ログイン: `https://stellar-phoenix-fa7d94.netlify.app/admin/login.html`
- [ ] 各ログインページが正しく表示されるか
- [ ] フォームが正しく動作するか

### 2. HTTPS確認

- [ ] URLが`https://`で始まっているか
- [ ] ブラウザのアドレスバーに鍵アイコンが表示されているか
- [ ] SSL証明書エラーが表示されていないか

### 3. API接続確認

#### 3.1 開発者ツールで確認
1. ブラウザの開発者ツール（F12）を開く
2. **Network**タブを開く
3. ログインを試行
4. 以下を確認：
   - [ ] APIリクエストが`https://kajishift-backend-production.up.railway.app/api`に送信されているか
   - [ ] CORSエラーが発生していないか
   - [ ] レスポンスが正常に返ってきているか（200 OK）

#### 3.2 ログイン動作確認
- [ ] テストユーザーでログインできるか
  - 依頼者: `customer1@example.com` / `password123`
  - ワーカー: `worker1@example.com` / `password123`
  - 管理者: `admin@kajishift.com` / `password123`
- [ ] ログイン後にダッシュボードにリダイレクトされるか
- [ ] エラーメッセージが適切に表示されるか（間違ったパスワードの場合など）

### 4. WebSocket接続確認

1. ログイン後、チャット機能を開く
2. ブラウザの開発者ツール（F12）を開く
3. **Console**タブを確認
4. 以下を確認：
   - [ ] `Socket.io接続成功`のメッセージが表示されるか
   - [ ] WebSocket接続が`https://kajishift-backend-production.up.railway.app`に確立されているか
   - [ ] エラーメッセージが表示されていないか

### 5. エラーページ確認

以下のURLにアクセスして、エラーページが正しく表示されるか確認：

- [ ] 404エラー: `https://stellar-phoenix-fa7d94.netlify.app/errors/404.html`
- [ ] 500エラー: `https://stellar-phoenix-fa7d94.netlify.app/errors/500.html`
- [ ] 403エラー: `https://stellar-phoenix-fa7d94.netlify.app/errors/403.html`
- [ ] 存在しないページ: `https://stellar-phoenix-fa7d94.netlify.app/nonexistent-page.html`（404ページにリダイレクトされるか）

### 6. Service Worker確認

1. ブラウザの開発者ツール（F12）を開く
2. **Application**タブ → **Service Workers**を開く
3. 以下を確認：
   - [ ] Service Workerが登録されているか
   - [ ] ステータスが「activated and is running」になっているか
   - [ ] エラーが表示されていないか

### 7. モバイル表示確認

- [ ] ブラウザの開発者ツールでモバイル表示に切り替え
- [ ] レスポンシブデザインが正しく動作しているか
- [ ] すべての要素が適切に表示されるか
- [ ] タッチ操作が正しく動作するか

### 8. リンク動作確認

- [ ] ヘッダーの「依頼者ログイン」「ワーカーログイン」リンクが正しく動作するか
- [ ] フッターの「管理者」リンクが正しく動作するか
- [ ] トップページのCTAボタンが正しく動作するか
- [ ] エラーページの「ホームページに戻る」リンクが正しく動作するか

### 9. パフォーマンス確認

1. ブラウザの開発者ツール（F12）を開く
2. **Network**タブを開く
3. ページをリロード（Ctrl+Shift+R でキャッシュクリア）
4. 以下を確認：
   - [ ] ページの読み込み時間が適切か
   - [ ] 画像が正しく読み込まれているか
   - [ ] CSS/JSファイルが正しく読み込まれているか

### 10. SEO設定確認

- [ ] `robots.txt`が正しくアクセスできるか: `https://stellar-phoenix-fa7d94.netlify.app/robots.txt`
- [ ] `sitemap.xml`が正しくアクセスできるか: `https://stellar-phoenix-fa7d94.netlify.app/sitemap.xml`
- [ ] メタタグが正しく設定されているか（開発者ツールで確認）

---

## 🔍 確認手順

### 手順1: トップページの確認

1. `https://stellar-phoenix-fa7d94.netlify.app/`にアクセス
2. ページが正しく表示されることを確認
3. ブラウザの開発者ツール（F12）を開き、エラーがないか確認

### 手順2: API接続の確認

1. 依頼者ログインページにアクセス
2. テストユーザーでログインを試行
3. 開発者ツールの**Network**タブでAPIリクエストを確認
4. レスポンスが正常（200 OK）であることを確認

### 手順3: WebSocket接続の確認

1. ログイン後、チャット機能を開く
2. 開発者ツールの**Console**タブで接続メッセージを確認

### 手順4: エラーページの確認

1. 存在しないページにアクセス（例: `/test-page.html`）
2. 404エラーページが表示されることを確認

---

## ⚠️ 問題が見つかった場合

### CORSエラーが発生する場合

1. Railwayダッシュボードで`CORS_ORIGIN`環境変数を確認
2. `https://stellar-phoenix-fa7d94.netlify.app`が含まれているか確認
3. 含まれていない場合は追加（カンマ区切り）

### API接続エラーが発生する場合

1. 開発者ツールの**Network**タブでエラーの詳細を確認
2. API URLが`https://kajishift-backend-production.up.railway.app/api`になっているか確認
3. バックエンドサーバーが起動しているか確認（Railwayダッシュボードで確認）

### Service Workerエラーが発生する場合

1. 開発者ツールの**Application**タブ → **Service Workers**でエラーを確認
2. Service Workerのキャッシュをクリア
3. ページを再読み込み

---

## 📝 確認結果

### 確認日時
- 日時: 2026年3月2日
- 確認者: ユーザー

### 確認結果

| 項目 | 状態 | 備考 |
|------|------|------|
| トップページ表示 | ✅ OK | すべての要素が正しく表示される |
| ログインページ表示 | ✅ OK | 依頼者・ワーカー・管理者すべて正常 |
| HTTPS | ✅ OK | SSL証明書正常、鍵アイコン表示 |
| API接続 | ✅ OK | `https://kajishift-backend-production.up.railway.app/api`に正常接続、CORSエラーなし |
| WebSocket接続 | ✅ OK | Socket.io接続成功、リアルタイム通信正常 |
| エラーページ | ✅ OK | 404/500/403ページが正しく表示される |
| Service Worker | ✅ OK | 正常に登録・動作中 |
| モバイル表示 | ✅ OK | レスポンシブデザイン正常動作 |
| リンク動作 | ✅ OK | すべてのリンクが正常に動作 |
| パフォーマンス | ✅ OK | 読み込み時間適切、リソース正常読み込み |

### 発見された問題

なし（すべて正常動作）

### 次のアクション

1. ✅ Netlifyデプロイ動作確認完了
2. 次の作業: Excelエクスポート機能のUI連携（4つのエンドポイント）
3. express-rate-limitの警告解消（優先度: 中）

---

**最終更新**: 2026年3月2日
