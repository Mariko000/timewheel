const CACHE_NAME = 'tw-cache-v2'; // バージョンを上げることで更新時に古いキャッシュ破棄
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/favicon.ico',
  '/favicon-96x96.png',
  '/favicon.svg',
];

// インストール時：必要なファイルをキャッシュ
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); // 新しいSWが即アクティブ化
});

// アクティベート時：古いキャッシュを削除
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim(); // SWがコントロールしているページを即更新
});

// フェッチ時：キャッシュ優先、ネットワーク fallback
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => {
        // オフライン時にキャッシュも無ければ、index.html を返す（SPA向け）
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
