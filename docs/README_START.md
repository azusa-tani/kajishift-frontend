# フロントエンドサーバーの起動方法

## 問題: 404エラーが発生する場合

`http://localhost:5500/customer/login.html` にアクセスして404エラーが出る場合は、以下の手順を試してください。

## 解決方法

### 方法1: VS Codeでフォルダを開く（推奨）

1. **VS Codeで `kajishift-frontend` フォルダを開く**
   - VS Codeを起動
   - 「ファイル」→「フォルダーを開く」
   - `C:\Users\谷口 梓\Desktop\kajishift-frontend` を選択

2. **Live Serverで起動**
   - `index.html` を右クリック
   - 「Open with Live Server」を選択
   - または、VS Codeのステータスバーにある「Go Live」ボタンをクリック

3. **アクセス**
   - ブラウザで `http://localhost:5500/customer/login.html` にアクセス

### 方法2: コマンドラインから起動

#### Python 3を使用する場合

```bash
cd C:\Users\谷口 梓\Desktop\kajishift-frontend
python -m http.server 5500
```

#### Node.jsを使用する場合

```bash
# http-serverをインストール（初回のみ）
npm install -g http-server

# サーバーを起動
cd C:\Users\谷口 梓\Desktop\kajishift-frontend
http-server -p 5500
```

### 方法3: 他のポートで起動する場合

Live Serverが別のポート（例: 5501）で起動している場合：

1. ブラウザのアドレスバーでポート番号を確認
2. バックエンドの `.env` ファイルで `CORS_ORIGIN` を更新：
   ```env
   CORS_ORIGIN=http://localhost:5501
   ```
3. バックエンドサーバーを再起動

## 確認事項

### 1. ファイルが存在するか確認

以下のファイルが存在することを確認してください：
- `customer/login.html`
- `customer/register.html`
- `customer/dashboard.html`
- `worker/login.html`
- `admin/login.html`

### 2. サーバーのルートディレクトリを確認

サーバーのルートディレクトリが `kajishift-frontend` フォルダになっていることを確認してください。

- ✅ 正しい: `http://localhost:5500/customer/login.html`
- ❌ 間違い: `http://localhost:5500/kajishift-frontend/customer/login.html`

### 3. バックエンドサーバーが起動しているか確認

バックエンドAPIサーバーが起動していることを確認してください：

```bash
cd kajishift-backend
npm run dev
```

サーバーは `http://localhost:3000` で起動します。

## トラブルシューティング

### 404エラーが続く場合

1. **ブラウザのキャッシュをクリア**
   - Ctrl + Shift + Delete でキャッシュをクリア

2. **Live Serverを再起動**
   - VS Codeのステータスバーで「Port: 5500」を右クリック
   - 「Stop Server」を選択
   - 再度「Go Live」をクリック

3. **別のブラウザで試す**
   - Chrome、Firefox、Edgeなどで試す

### CORSエラーが発生する場合

1. バックエンドの `.env` ファイルで `CORS_ORIGIN` を確認
2. フロントエンドのポートと一致しているか確認
3. バックエンドサーバーを再起動

## 正しいアクセス方法

以下のURLでアクセスできるはずです：

- トップページ: `http://localhost:5500/index.html` または `http://localhost:5500/`
- 依頼者ログイン: `http://localhost:5500/customer/login.html`
- 依頼者登録: `http://localhost:5500/customer/register.html`
- 依頼者ダッシュボード: `http://localhost:5500/customer/dashboard.html`
- ワーカーログイン: `http://localhost:5500/worker/login.html`
- 管理者ログイン: `http://localhost:5500/admin/login.html`

---

**注意**: Live Serverを使用する場合は、必ず `kajishift-frontend` フォルダをルートとして開いてください。
