const CACHE = "developer-interview-prep-v19";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./manager.css",
  "./layout.css",
  "./analyzer.css",
  "./analyzer.js",
  "./backup.js",
  "./editor.css",
  "./editor.js",
  "./settings.css",
  "./settings.js",
  "./vocabulary-profile.css",
  "./vocabulary-profile.js",
  "./vocabulary/index.html",
  "./app.js",
  "./data.js",
  "./data-1.js",
  "./data-2.js",
  "./data-3.js",
  "./data-4.js",
  "./packs/core-expansion.js",
  "./manifest.webmanifest",
  "./icon-192.svg",
  "./icon-512.svg"
];

const OPTIONAL_SHARED_ASSETS = [
  "/Vocabulary-Expander/vocabulary-toolkit.css",
  "/Vocabulary-Expander/vocabulary-toolkit.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(async cache => {
      await cache.addAll(ASSETS);
      await Promise.allSettled(OPTIONAL_SHARED_ASSETS.map(asset => cache.add(asset)));
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))),
      self.clients.claim()
    ])
  );
});

self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request, { cache: "no-store" })
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === "navigate") return caches.match("./index.html");
        throw new Error("Offline asset unavailable");
      })
  );
});
