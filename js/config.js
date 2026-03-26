/**
 * KAJISHIFT 環境設定ファイル
 * 
 * デプロイ時にこのファイルを編集して、本番環境のURLを設定してください。
 * 
 * 開発環境: このファイルを編集する必要はありません（デフォルト値が使用されます）
 * 本番環境: 以下の値を本番環境のURLに変更してください
 */

// Cache bust marker for Vercel redeploy: 2026-03-26-rwy-fix
window.KAJISHIFT_CONFIG_VERSION = '2026-03-26-rwy-fix';

// APIのベースURL
// 開発環境: http://localhost:3000/api
// 本番環境: https://kajishift-backend-production.up.railway.app/api
window.API_BASE_URL = 'https://kajishift-backend-production.up.railway.app/api';

// WebSocketサーバーURL
// 開発環境: http://localhost:3000
// 本番環境: https://kajishift-backend-production.up.railway.app
window.SOCKET_SERVER_URL = 'https://kajishift-backend-production.up.railway.app';
