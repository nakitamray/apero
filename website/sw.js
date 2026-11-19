// Lets phones install apero from the website. It only keeps the app's fixed files (scripts, fonts,
// pictures, whose names change whenever they do), so it opens faster; pages always come fresh.
const CACHE = 'apero-files-v1';
const FIXED = /\/app\/(_expo\/static|assets)\//;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !FIXED.test(new URL(req.url).pathname)) return;
  e.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          }),
      ),
    ),
  );
});
