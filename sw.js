/* ═══════════════════════════════════════════
   Service Worker - قرية التلاوة – نجع المهيدات
   ═══════════════════════════════════════════ */

const CACHE = "qaryat-tilawah-v1";
const ASSETS = [
  "/qaryat-al-tilawah/",
  "/qaryat-al-tilawah/index.html",
  "/qaryat-al-tilawah/style.css",
  "/qaryat-al-tilawah/script.js",
  "/qaryat-al-tilawah/manifest.json",
  "/qaryat-al-tilawah/icon-192.png",
  "/qaryat-al-tilawah/icon-512.png",
  "/qaryat-al-tilawah/favicon.ico"
];

/* التثبيت - تخزين كل الملفات في الكاش */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

/* التنشيط - مسح الكاشات القديمة */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/* الجلب - استخدام الكاش أولاً، ثم الشبكة */
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // خزّن نسخة من الردود الناجحة
        if (response && response.status === 200 && event.request.method === "GET") {
          const responseClone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, responseClone));
        }
        return response;
      }).catch(() => {
        // لو فشل الجلب، ارجع الصفحة الرئيسية
        return caches.match("/qaryat-al-tilawah/index.html");
      });
    })
  );
});
