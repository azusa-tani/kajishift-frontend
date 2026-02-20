/**
 * KAJISHIFT Service Worker
 * オフライン対応とキャッシュ戦略を実装
 */

const CACHE_NAME = 'kajishift-v1';
const RUNTIME_CACHE = 'kajishift-runtime-v1';

// キャッシュするリソース
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/validation.js',
  '/images/common/Gemini_Generated_Image_8i0b6m8i0b6m8i0b_4.png',
  '/images/common/alyson-mcphee-yWG-ndhxvqY-unsplash.jpg',
  '/errors/404.html',
  '/errors/500.html',
  '/errors/403.html'
];

// インストール時の処理
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        // 新しいサービスワーカーを即座にアクティブ化
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Cache installation failed:', error);
      })
  );
});

// アクティベート時の処理
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // 古いキャッシュを削除
              return cacheName !== CACHE_NAME && 
                     cacheName !== RUNTIME_CACHE;
            })
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        // すべてのクライアントを制御下に置く
        return self.clients.claim();
      })
  );
});

// フェッチ時の処理（ネットワーク優先、フォールバックでキャッシュ）
self.addEventListener('fetch', (event) => {
  // GETリクエストのみ処理
  if (event.request.method !== 'GET') {
    return;
  }

  // クロスオリジンのリクエストはスキップ
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // レスポンスが有効な場合、キャッシュに保存
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          
          caches.open(RUNTIME_CACHE)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }
        
        return response;
      })
      .catch(() => {
        // ネットワークエラーの場合、キャッシュから取得
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // キャッシュにもない場合、オフラインページを返す
            if (event.request.destination === 'document') {
              return caches.match('/errors/404.html');
            }
            
            return new Response('オフラインです', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain; charset=utf-8'
              })
            });
          });
      })
  );
});

// メッセージ受信時の処理（キャッシュ更新など）
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_UPDATE') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => {
          return cache.addAll(STATIC_CACHE_URLS);
        })
    );
  }
});
