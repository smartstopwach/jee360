/* ============================================================
   JEE360 Service Worker — fast + offline
   Strategy: stale-while-revalidate
   (pehle cache se turant serve → background mein fresh version
    update → agli baar naya mile. Offline pe bhi sab chalta hai.)
   ============================================================ */
const CACHE = 'jee360-v26';

const PRECACHE = [
  './',
  './index.html',
  './chapters.html',
  './planner.html',
  './study-mode.html',
  './dashboard.html',
  './data.js',
  './sync.js',
  './firebase-config.js',
  './pwa.js',
  './manifest.webmanifest',
  './favicon-32.png',
  './favicon-48.png',
  './favicon.ico',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './icon-maskable-192.png',
  './notif-icon-96.png',
  './notif-badge-36.png'
];

/* Firebase/Google API calls — kabhi cache nahi (live data) */
const NETWORK_ONLY = [
  'firestore.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'www.googleapis.com',
  'accounts.google.com',
  'apis.google.com'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;

  const url = new URL(req.url);
  if(NETWORK_ONLY.some(h => url.hostname.includes(h))) return;   // live API — network only

  /* HTML pages: NETWORK-FIRST — hamesha fresh version, offline pe cache.
     (Isse naye updates turant milte hain, purana version atakta nahi.) */
  if(req.mode === 'navigate' || req.destination === 'document'){
    e.respondWith(
      fetch(req).then(res => {
        if(res && res.status === 200){
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() =>
        caches.open(CACHE).then(c =>
          c.match(req, { ignoreSearch: true }).then(r => r || c.match('./index.html'))
        )
      )
    );
    return;
  }

  /* baaki assets: stale-while-revalidate (fast) */
  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(req, { ignoreSearch: url.origin === location.origin }).then(cached => {
        const fresh = fetch(req).then(res => {
          if(res && (res.status === 200 || res.type === 'opaque'))
            cache.put(req, res.clone());
          return res;
        }).catch(() => cached);
        return cached || fresh;
      })
    )
  );
});

/* ============================================================
   Push notifications — FCM data messages ko style ke saath
   dikhana (icon, badge, action buttons, tap = dashboard)
   ============================================================ */
self.addEventListener('push', e => {
  let p = {};
  try { p = e.data ? e.data.json() : {}; } catch(_){}
  const d = p.data || p.notification || p;
  if(!d || !d.title) return;
  e.waitUntil(self.registration.showNotification(d.title, {
    body: d.body || '',
    icon: 'notif-icon-96.png',
    /* badge = Android status-bar icon. Ye sirf ALPHA channel padhta hai,
       isliye notif-badge-36.png me letters opaque + background transparent
       hai (warna solid white blob ban jaata). */
    badge: 'notif-badge-36.png',
    tag: d.tag || 'jee360',
    renotify: true,
    data: { url: d.url || './dashboard.html' },
    actions: [
      { action: 'open',  title: '📖 Padhne chalo' },
      { action: 'later', title: '✕ Baad me' }
    ]
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if(e.action === 'later') return;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for(const c of list){
        if(c.url.indexOf('dashboard') !== -1 && 'focus' in c) return c.focus();
      }
      return clients.openWindow(
        (e.notification.data && e.notification.data.url) || './dashboard.html');
    })
  );
});
