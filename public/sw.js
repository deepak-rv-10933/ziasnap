/* ZiaSnap service worker: makes the app installable and usable offline.
 * - /_next/static/*: cache-first. Those files are content-hashed, so they never go stale.
 * - Pages: network-first, falling back to the last cached copy, then /offline.html.
 * - API calls and Catalyst auth are never cached: always live, or the offline
 *   outbox in the app takes over.
 */
const VERSION = "ziasnap-v1";
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const PRECACHE = ["/offline.html", "/icon.svg", "/icons/icon-192.png", "/manifest.webmanifest"];
/** Filled in at build time by scripts/prepare-slate.mjs: every page and script of this build. */
const BUILD_ASSETS = [];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(PRECACHE);
      // The rest downloads in the background, a few at a time; a miss just falls back to the network.
      const pending = [...BUILD_ASSETS];
      const worker = async () => {
        while (pending.length) {
          const url = pending.shift();
          try {
            const response = await fetch(url, { cache: "no-cache" });
            const isPage = url.endsWith("/") || url.endsWith("/index.txt");
            if (response.ok) await (isPage ? caches.open(PAGE_CACHE) : Promise.resolve(cache)).then((c) => c.put(url, response));
          } catch {
            /* offline or flaky: skip, it'll be cached on first real use */
          }
        }
      };
      await Promise.all(Array.from({ length: 6 }, worker));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // functions, Zia, fonts: always network
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/__catalyst/")) return;

  // Client-side navigation payloads (/home/index.txt?_rsc=…): cached by path, refreshed in the background.
  if (url.pathname.endsWith("/index.txt")) {
    event.respondWith(
      caches.open(PAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(url.pathname);
        const network = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(url.pathname, response.clone());
            return response;
          })
          .catch(() => undefined);
        if (cached) {
          event.waitUntil(network);
          return cached;
        }
        return (await network) || Response.error();
      }),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || PRECACHE.includes(url.pathname) || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  if (request.mode === "navigate") {
    // Pages are static files: answer from cache at once and refresh it in the background.
    const key = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
    event.respondWith(
      caches.open(PAGE_CACHE).then(async (cache) => {
        const cached = (await cache.match(key)) || (await cache.match(request));
        const network = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(key, response.clone());
            return response;
          })
          .catch(() => undefined);
        if (cached) {
          event.waitUntil(network);
          return cached;
        }
        return (await network) || (await caches.match("/offline.html"));
      }),
    );
  }
});
