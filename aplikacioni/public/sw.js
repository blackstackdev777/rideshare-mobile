/* global self, caches */
// Only these public resources are cached. Never cache Next.js HTML/RSC,
// /panel, /api/auth, private responses or mutations; never queue writes.
const CACHE = "rideshare-public-v1";
const API = "/api/udhetimet";
const SHELL = ["/offline.html", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith("rideshare-public-") && key !== CACHE)
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

function publicTrips(data) {
  if (!Array.isArray(data?.trips)) throw new Error("Invalid public list");
  return data.trips.map(trip => {
    if (!["id", "nisja", "destinacioni", "ora", "vendtakimi"].every(key => typeof trip?.[key] === "string") ||
        !Number.isInteger(trip.vende) || trip.vende < 0) throw new Error("Invalid trip");
    const { id, nisja, destinacioni, ora, vendtakimi, vende } = trip;
    return { id, nisja, destinacioni, ora, vendtakimi, vende };
  });
}

async function readPublicList(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request, {
      credentials: "omit", cache: "no-store", signal: AbortSignal.timeout(10000),
    });
    if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
      throw new Error("Public list unavailable");
    }
    // Rebuild both body and headers; no cookies/private fields enter the cache.
    const body = JSON.stringify({ trips: publicTrips(await response.json()) });
    const fresh = new Response(body, { headers: {
      "content-type": "application/json; charset=utf-8", "cache-control": "no-store",
      "x-rideshare-source": "network", "x-rideshare-saved-at": new Date().toISOString(),
    } });
    try { await cache.put(API, fresh.clone()); }
    catch { fresh.headers.delete("x-rideshare-saved-at"); }
    return fresh;
  } catch {
    const saved = await cache.match(API);
    if (!saved) return new Response(JSON.stringify({ error: "no_snapshot" }), {
      status: 503, headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
    const headers = new Headers(saved.headers);
    headers.set("x-rideshare-source", "cache");
    return new Response(await saved.text(), { status: 200, headers });
  }
}

self.addEventListener("fetch", event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname === API && !url.search) {
    event.respondWith(readPublicList(request));
  } else if (request.mode === "navigate" && ["/", "/offline.html"].includes(url.pathname)) {
    event.respondWith(fetch(request).then(async response => {
      if (response.ok) return response;
      const cache = await caches.open(CACHE);
      return (await cache.match("/offline.html")) || response;
    }).catch(async () => {
      const cache = await caches.open(CACHE);
      return (await cache.match("/offline.html")) || new Response("Hape RideShare një herë me internet.", { status: 503 });
    }));
  } else if (SHELL.includes(url.pathname) && !url.search) {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(url.pathname)) || fetch(request)));
  }
});
