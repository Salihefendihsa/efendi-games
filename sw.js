/* Neon Galaksi service worker (vite.config.ts → dist/sw.js üretir). Yalnızca aynı origin statik varlıklar. */
const VERSION = '0.8.0-4-mwor38o1';
const CACHE = 'nova-' + VERSION;
const PRECACHE = ["./","./index.html","./manifest.webmanifest","./favicon.png","./icons/icon-192.png","./icons/icon-512.png","./icons/apple-touch-icon.png","./assets/index-DEDpfDv8.js","./assets/dist-DwhOg3L3.js","./assets/esm-BQYWf-jD.js","./assets/esm-CDb4yWQS.js","./assets/esm-CLBnPJ9q.js","./assets/esm-Di6-kqWd.js","./assets/esm-IZdaEQS2.js","./assets/web-Bf5t6qM8.js","./assets/web-BvaLXKW7.js","./assets/web-CQmKUTje.js","./assets/web-CxP6LZvx.js","./assets/web-D7CcXyZi.js","./assets/web-KvWc4m9E.js","./assets/index-B1jxFapM.css"];
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
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('nova-') && k !== CACHE && k !== CACHE + '-fonts' && !k.endsWith('-fonts')).map((k) => caches.delete(k))))
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
  // Faz 5: yazı tipleri (Google Fonts) önbellekten, arkada tazelenir → çevrimdışı da aynı görünüm
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(CACHE + '-fonts').then((c) =>
        c.match(req).then((hit) => {
          const net = fetch(req)
            .then((res) => {
              if (res.ok || res.type === 'opaque') c.put(req, res.clone());
              return res;
            })
            .catch(() => hit);
          return hit || net;
        }),
      ),
    );
    return;
  }
  // Supabase ve diğer origin'ler: dokunma
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
