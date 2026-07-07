const CACHE_NAME = "fitgoginki-v2";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  // Never cache Firebase/Firestore network traffic - always go to the network for those.
  if (req.url.includes("googleapis.com") || req.url.includes("firebaseio.com") || req.url.includes("gstatic.com")) return;

  // Network-first: always serve the latest deployed version when online (so app updates show up
  // immediately instead of needing a manual cache-version bump), falling back to the cached copy
  // only when there's no connection.
  event.respondWith(
    fetch(req, { cache: "no-store" })
      .then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
