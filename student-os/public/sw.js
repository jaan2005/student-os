// Deliberately minimal: a fetch handler is required for Chrome/Android to
// consider the app "installable" at all, but this one does no caching —
// just passes every request straight through to the network. That's an
// intentional choice, not an oversight: this app is being actively updated
// during launch week, and a caching service worker can easily end up
// serving students a stale, already-fixed-elsewhere version of the app
// after a deploy. Real offline support (caching the app shell, etc.) is a
// reasonable thing to add later, once the release cadence has slowed down.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request))
})
