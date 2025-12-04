//SW 更新検知用コード 古い SW が残るの防止
self.addEventListener("install", (event) => {
    self.skipWaiting();
  });

//キャッシュ登録
const cacheName = "timewheel-cache-v2";
const assetsToCache = [
  "/",
  "/index.html",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
  "/favicon.ico",
  "/favicon-96x96.png",
  "/apple-touch-icon.png"
];



self.addEventListener("install", () => {
    console.log("🛠 Service Worker installed");
  });
  
  self.addEventListener("activate", () => {
    console.log("⚡ Service Worker activated");
  });
  
  self.addEventListener("push", (event) => {
    const data = event.data?.json() || {};
    self.registration.showNotification(data.title || "TimeWheel", {
      body: data.body || "予定の時間です",
      icon: "/web-app-manifest-192x192.png",
      badge: "/web-app-manifest-192x192.png"
    });
  });
  