/**
 * KAJISHIFT 環境設定ファイル
 * 
 * デプロイ時にこのファイルを編集して、本番環境のURLを設定してください。
 * 
 * 開発環境: このファイルを編集する必要はありません（デフォルト値が使用されます）
 * 本番環境: 以下の値を本番環境のURLに変更してください
 */

// Cache bust marker for Vercel redeploy: 2026-06-03-24h-auto-ops
window.KAJISHIFT_CONFIG_VERSION = '2026-06-03-24h-auto-ops';

// APIのベースURL
// 開発環境: http://localhost:3000/api
// 本番環境: https://kajishift-backend-production.up.railway.app/api
window.API_BASE_URL = 'https://kajishift-backend-production.up.railway.app/api';

// WebSocketサーバーURL
// 開発環境: http://localhost:3000
// 本番環境: https://kajishift-backend-production.up.railway.app
window.SOCKET_SERVER_URL = 'https://kajishift-backend-production.up.railway.app';

// β版設定（Stripe Test Modeのみ。実課金は行わない）
window.STRIPE_PUBLISHABLE_KEY = window.STRIPE_PUBLISHABLE_KEY || 'pk_test_51TYG38FX94mMTqKmoEWEDqVdxvlClqSlws84ay5MNZL7CvpwJ2LqxhrBmqUNI7he0OXrPBcri0riYSdq3jduiLPE00zxOcKfjI';
window.BETA_MODE = true;
window.KAJISHIFT_SUPPORT_EMAIL = window.KAJISHIFT_SUPPORT_EMAIL || 'support@kajishift.jp';
window.KAJISHIFT_SUPPORT_URL = window.KAJISHIFT_SUPPORT_URL || '/legal.html#contact';
