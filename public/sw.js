const CACHE_NAME = "rail-darpan-pwa-v3";

const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/app.js",
  "/pwa.js",
  "/language.js",
  "/festival-theme.css",
  "/festival-theme.js",
  "/manifest.webmanifest",
  "/images/logo.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/favicon-32.png"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    await Promise.all(
      SHELL_ASSETS.map(async url => {
        try {
          const response = await fetch(url, { cache: "reload" });

          if (response.ok && response.type === "basic") {
            await cache.put(url, response);
          }
        } catch (_) {
          // One unavailable asset should not prevent installation.
        }
      })
    );

    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(key =>
          key.startsWith("rail-darpan-pwa-") && key !== CACHE_NAME
        )
        .map(key => caches.delete(key))
    );

    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  // Never cache live railway APIs, PNR or personal data.
  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);

        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put("/", response.clone());
        }

        return response;
      } catch (_) {
        return (
          await caches.match("/") ||
          await caches.match("/index.html") ||
          await caches.match("/offline.html") ||
          new Response("Offline", {
            status: 503,
            headers: { "Content-Type": "text/plain" }
          })
        );
      }
    })());

    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    const path = url.pathname;

    // Images and icons can load directly from the saved app shell.
    if (cached && /\.(png|jpg|jpeg|webp|svg|ico)$/i.test(path)) {
      return cached;
    }

    // Prefer current app scripts and styles; use saved copies offline.
    try {
      const response = await fetch(request);

      if (response.ok && response.type === "basic") {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }

      return response;
    } catch (_) {
      return cached || Response.error();
    }
  })());
});
