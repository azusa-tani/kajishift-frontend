# サーバー起動方法

## 簡単な起動方法

### 方法1: バッチファイルを使用（最も簡単）

1. `scripts/start-server.bat` をダブルクリック
2. ブラウザで `http://localhost:5500` にアクセス

### 方法2: PowerShellスクリプトを使用

1. PowerShellを開く
2. 以下のコマンドを実行：
   ```powershell
   cd "C:\Users\谷口 梓\Desktop\kajishift-frontend"
   .\scripts\start-server.ps1
   ```

### 方法3: 手動でコマンドを実行

#### Python 3を使用する場合

```powershell
cd "C:\Users\谷口 梓\Desktop\kajishift-frontend"
python -m http.server 5500
```

#### Node.jsを使用する場合

```powershell
cd "C:\Users\谷口 梓\Desktop\kajishift-frontend"
npx --yes http-server -p 5500
```

## アクセスURL

サーバー起動後、以下のURLでアクセスできます：

- トップページ: `http://localhost:5500/index.html` または `http://localhost:5500/`
- 依頼者ログイン: `http://localhost:5500/customer/login.html`
- 依頼者登録: `http://localhost:5500/customer/register.html`
- 依頼者ダッシュボード: `http://localhost:5500/customer/dashboard.html`
- ワーカーログイン: `http://localhost:5500/worker/login.html`
- 管理者ログイン: `http://localhost:5500/admin/login.html`

## トラブルシューティング

### ポート5500が既に使用されている場合

別のポートを使用してください：

```powershell
# ポート5501で起動
python -m http.server 5501
# または
npx --yes http-server -p 5501
```

その場合、バックエンドの `.env` ファイルで `CORS_ORIGIN` も更新してください：

```env
CORS_ORIGIN=http://localhost:5501
```

### Pythonが見つからない場合

1. Pythonがインストールされているか確認：
   ```powershell
   python --version
   ```

2. インストールされていない場合は、以下からインストール：
   - https://www.python.org/downloads/

### Node.jsが見つからない場合

1. Node.jsがインストールされているか確認：
   ```powershell
   node --version
   ```

2. インストールされていない場合は、以下からインストール：
   - https://nodejs.org/

## バックエンドサーバーの起動

フロントエンドと連携するには、バックエンドサーバーも起動する必要があります：

```powershell
cd "C:\Users\谷口 梓\Desktop\kajishift-backend"
npm run dev
```

バックエンドサーバーは `http://localhost:3000` で起動します。

---

**注意**: サーバーを停止する場合は、ターミナルで `Ctrl+C` を押してください。
