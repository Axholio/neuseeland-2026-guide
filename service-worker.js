const CACHE_NAME = "nz-2026-guide-v5-4";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/css/styles.css",
  "./assets/data/trip-data.js",
  "./assets/js/app.js",
  "./assets/js/route-map.js",
  "./assets/js/photo-viewer.js",
  "./assets/js/pwa.js",
  "./assets/js/travel-mode.js",
  "./assets/js/calendar-export.js",
  "./assets/icons/fern.svg",
  "./assets/icons/app-icon-180.png",
  "./assets/icons/app-icon-192.png",
  "./assets/icons/app-icon-512.png",
  "./assets/images/ATTRIBUTIONS.md",
  "./assets/images/tranzalpine.jpg",
  "./assets/images/hokitika-gorge.jpg",
  "./assets/images/wanaka.jpg",
  "./assets/images/aoraki-mount-cook.jpg",
  "./assets/images/lake-tekapo.jpg",
  "./assets/images/kaikoura.jpg",
  "./assets/images/akaroa-harbour.jpg"
];

function isCacheable(response) {
  return response && (response.ok || response.type === "opaque");
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (isCacheable(response)) cache.put(request, response.clone());
    return response;
  } catch (_) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      return (await caches.match(new URL("./index.html", self.registration.scope).toString())) || Response.error();
    }
    return Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const network = fetch(request).then((response) => {
    if (isCacheable(response)) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || network || Response.error();
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Leaflet-Dateien werden nach dem ersten Online-Aufruf zwischengespeichert.
  if (url.hostname === "unpkg.com") {
    event.respondWith(staleWhileRevalidate(request));
  }
});
