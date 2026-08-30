// Deliberately minimal: this app is all live, per-user, RLS-scoped data
// (shifts, hours, tasks), so caching page content would risk showing
// someone stale or wrong data — worse than no offline support at all.
// This service worker's only job is to swap the browser's default
// connection-error page for the app's own offline screen when a
// navigation fails, so a dead zone at the arena doesn't look broken.

const CACHE = "video-room-offline-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL)),
  );
});
