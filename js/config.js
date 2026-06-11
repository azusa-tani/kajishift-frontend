/**
 * KAJISHIFT 環境設定ファイル
 *
 * API / Socket URL はフロントエンドの hostname に応じて自動切替します。
 * localhost / 127.0.0.1 ではローカルバックエンド、それ以外では本番Railwayへ接続します。
 */

// Cache bust marker for Vercel redeploy: 2026-06-03-24h-auto-ops
window.KAJISHIFT_CONFIG_VERSION = '2026-06-03-24h-auto-ops';

const PRODUCTION_CONFIG = {
  apiBaseUrl: 'https://kajishift-backend-production.up.railway.app/api',
  socketServerUrl: 'https://kajishift-backend-production.up.railway.app',
};

const LOCAL_CONFIG = {
  apiBaseUrl: 'http://localhost:3000/api',
  socketServerUrl: 'http://localhost:3000',
};

const hostname = window.location.hostname;
const isLocalFrontend = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '';
const selectedConfig = isLocalFrontend ? LOCAL_CONFIG : PRODUCTION_CONFIG;

// API / Socket URL は localhost の明示的なローカル確認時だけ開発環境へ向ける。
window.API_BASE_URL = selectedConfig.apiBaseUrl;
window.SOCKET_SERVER_URL = selectedConfig.socketServerUrl;

// β版設定（Stripe Test Modeのみ。実課金は行わない）
window.STRIPE_PUBLISHABLE_KEY = window.STRIPE_PUBLISHABLE_KEY || 'pk_test_51TYG38FX94mMTqKmoEWEDqVdxvlClqSlws84ay5MNZL7CvpwJ2LqxhrBmqUNI7he0OXrPBcri0riYSdq3jduiLPE00zxOcKfjI';
window.BETA_MODE = true;
window.KAJISHIFT_SUPPORT_EMAIL = window.KAJISHIFT_SUPPORT_EMAIL || 'support@kajishift.jp';
window.KAJISHIFT_SUPPORT_URL = window.KAJISHIFT_SUPPORT_URL || '/legal.html#contact';
