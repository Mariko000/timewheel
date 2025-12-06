//SW 更新検知用コード 古い SW が残るの防止
// === Skip waiting to activate updated SW ===
self.addEventListener("install", (event) => {
    console.log("🛠 Installing Service Worker...");
    self.skipWaiting();
  
    const cacheName = "timewheel-cache-v3";
    const assetsToCache = [
      "/",
      "/index.html",
      "/web-app-manifest-192x192.png",
      "/web-app-manifest-512x512.png",
      "/favicon.ico",
      "/favicon-96x96.png",
      "/apple-touch-icon.png"
    ];
  
    // Cache assets properly
    event.waitUntil(
      caches.open(cacheName).then((cache) => {
        return cache.addAll(assetsToCache);
      }).catch(err => {
        console.error("❌ Cache error:", err);
      })
    );
  });
  
  
  // === Activate Cleanup ===
  self.addEventListener("activate", (event) => {
    console.log("⚡ Service Worker activated");
    event.waitUntil(self.clients.claim());
  });
  
  
  // === Handle Push Notifications ===
  self.addEventListener("push", (event) => {
    const data = event.data?.json() || {};
  
    self.registration.showNotification(
      data.title || "TimeWheel ⏰",
      {
        body: data.body || "予定の時間です",
        icon: "/web-app-manifest-192x192.png",
        badge: "/web-app-manifest-192x192.png",
      }
    );
  });
  