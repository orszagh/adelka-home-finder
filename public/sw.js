/*
 * La casetta di Adelka – service worker.
 * Adelka travels around Italy with a weak signal, so the app keeps what it
 * last saw on the phone:
 *  - pages: network first, but at most PAGE_TIMEOUT_MS; then the last saved copy
 *    (refreshed in the background when the network answers later),
 *  - app files (/_next/static): from the phone, they never change,
 *  - map tiles and listing photos: from the phone, refreshed in the background,
 *  - anything that changes data (POST: saving, logging in, fetching from Apify) and
 *    the login page: always the network, never stored.
 */
// Each store has its own name. Bump only the one whose contents must go: renaming the
// tiles or photos store throws away everything the phone saved over a weak signal.
const PAGES = "pages-v2"; // v2: no more RSC data
const STATIC = "static-v2";
const TILES = "tiles-v2";
const PHOTOS = "photos-v2";
const KEEP = [PAGES, STATIC, TILES, PHOTOS];

const PAGE_TIMEOUT_MS = 2500;
const LIMITS = { [PAGES]: 40, [STATIC]: 300, [TILES]: 1500, [PHOTOS]: 400 };

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) if (!KEEP.includes(name)) await caches.delete(name);
      await self.clients.claim();
    })(),
  );
});

async function trim(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const extra = keys.length - LIMITS[cacheName];
  for (let i = 0; i < extra; i++) await cache.delete(keys[i]);
}

async function put(cacheName, request, response) {
  const cache = await caches.open(cacheName);
  await cache.put(request, response);
  await trim(cacheName);
}

/** Pages and their data: fresh when the network is quick, the saved copy when it is not. */
async function networkFirst(event, cacheName) {
  const { request } = event;
  const cache = await caches.open(cacheName);
  const network = fetch(request).then((response) => {
    // Only real pages: not redirects to the login, not errors.
    if (response.ok && !response.redirected && new URL(response.url).pathname !== "/prihlasenie") {
      event.waitUntil(put(cacheName, request, response.clone()));
    }
    return response;
  });
  const cached = await cache.match(request, { ignoreVary: true });
  if (!cached) return network;
  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), PAGE_TIMEOUT_MS));
  const fast = await Promise.race([network.catch(() => null), timeout]);
  if (fast) return fast;
  // Slow or offline: show what she saw last time; the network keeps going and refreshes the copy.
  event.waitUntil(network.catch(() => null));
  return cached;
}

/** Tiles and photos: instantly from the phone, refreshed quietly. */
async function staleWhileRevalidate(event, cacheName) {
  const { request } = event;
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok || response.type === "opaque") event.waitUntil(put(cacheName, request, response.clone()));
      return response;
    })
    .catch(() => null);
  if (cached) {
    event.waitUntil(network);
    return cached;
  }
  return (await network) ?? Response.error();
}

async function cacheFirst(event, cacheName) {
  const cached = await caches.match(event.request);
  if (cached) return cached;
  const response = await fetch(event.request);
  if (response.ok) event.waitUntil(put(cacheName, event.request, response.clone()));
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.hostname.endsWith("tile.openstreetmap.org")) {
    event.respondWith(staleWhileRevalidate(event, TILES));
    return;
  }
  if (url.origin !== self.location.origin) {
    if (request.destination === "image") event.respondWith(staleWhileRevalidate(event, PHOTOS));
    return;
  }
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(event, STATIC));
    return;
  }
  if (url.pathname.startsWith("/api/") || url.pathname === "/prihlasenie" || url.pathname === "/sw.js") return;
  if (request.destination === "image") {
    event.respondWith(staleWhileRevalidate(event, PHOTOS));
    return;
  }
  // Whole pages only. The data Next fetches when moving between pages (RSC) is left to the
  // network: a stale copy from an older version of the app stalls the navigation. Offline,
  // Next falls back to loading the whole page, which is served from here.
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(event, PAGES));
  }
});
