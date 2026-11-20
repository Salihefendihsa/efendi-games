/* Neon Galaksi service worker (vite.config.ts → dist/sw.js üretir). Yalnızca aynı origin statik varlıklar. */
const VERSION = '0.4.0-2-mwo8677p';
const CACHE = 'nova-' + VERSION;
const PRECACHE = ["./","./index.html","./manifest.webmanifest","./favicon.png","./icons/icon-192.png","./icons/icon-512.png","./icons/apple-touch-icon.png","./assets/index-D9YUn8-Y.js","./assets/dist-DwhOg3L3.js","./assets/esm-Ce4vPtLs.js","./assets/esm-DNN4H8sT.js","./assets/esm-DXZsTt4V.js","./assets/esm-DwuXF2YS.js","./assets/esm-pa3-Z5yk.js","./assets/web-BaaGUQZT.js","./assets/web-CPXai4JZ.js","./assets/web-CzaBsSOu.js","./assets/web-DABEF2XN.js","./assets/web-DbOpqLiH.js","./assets/web-zwke_BCu.js","./assets/index-RFOEg3PP.css"];
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
