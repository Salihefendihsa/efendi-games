/* Neon Galaksi service worker (vite.config.ts → dist/sw.js üretir). Yalnızca aynı origin statik varlıklar. */
const VERSION = '0.4.0-2-mwo8mpjs';
const CACHE = 'nova-' + VERSION;
const PRECACHE = ["./","./index.html","./manifest.webmanifest","./favicon.png","./icons/icon-192.png","./icons/icon-512.png","./icons/apple-touch-icon.png","./assets/index-IX29jcyj.js","./assets/dist-DwhOg3L3.js","./assets/esm-BCvFFzW7.js","./assets/esm-BDr1dHhq.js","./assets/esm-BigJvSiS.js","./assets/esm-CW2Ydpbu.js","./assets/esm-DByfa5mF.js","./assets/web-B_IevoP9.js","./assets/web-Bqt4YhJW.js","./assets/web-CGXQgfKe.js","./assets/web-CSgjrzV9.js","./assets/web-DBxTNas8.js","./assets/web-DZj4fQU4.js","./assets/index-RFOEg3PP.css"];
/** Asla önbelleğe alınmayanlar: sürüm bilgisi, APK, indirme ve bilgi sayfaları. */
const SKIP = [/\/version\.json$/, /\.apk$/, /\/indir\/?/, /\/gizlilik\/?/, /\/hesap-silme\/?/, /\/destek\/?/];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).catch(() => undefined));
});

self.addEventListener('activate', (e) => {
  // Yeni sürüm: eski önbellekleri temizle
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('nova-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Supabase, yazı tipleri ve diğer origin'ler: dokunma
  if (url.origin !== self.location.origin) return;
  if (SKIP.some((r) => r.test(url.pathname))) return;
  if (req.mode === 'navigate') {
    // Sayfa: önce ağ (yeni sürüm hemen görünsün), çevrimdışıysa önbellekteki oyun
    e.respondWith(fetch(req).catch(() => caches.match('./index.html', { ignoreSearch: true }).then((r) => r || caches.match('./'))));
    return;
  }
  // Statik varlıklar: önce önbellek (dosya adları içerik özetli)
  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok && (url.pathname.includes('/assets/') || url.pathname.includes('/icons/'))) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
