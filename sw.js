const CACHE = 'gym-log-v4';
const STATIC = [
  'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jsrsasign/10.5.25/jsrsasign-all-min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Never cache: HTML, API calls, Google Sheets, auth
  if (
    url.includes('googleapis.com') ||
    url.includes('workers.dev') ||
    url.includes('oauth2.google') ||
    url.includes('.html') ||
    url.endsWith('/gym-logger/') ||
    url.endsWith('/gym-logger')
  ) return;

  // Cache CDN assets only
  if (url.includes('cdnjs.cloudflare.com') || url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res && res.ok) {
            const resClone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, resClone));
          }
          return res;
        });
      })
    );
  }
});
