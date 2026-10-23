import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

// Execute the exact public worker and reader scripts in a Node VM with
// simulated CacheStorage/DOM. This is not a browser acceptance test.
const origin = "http://localhost:3000";
const workerCode = await readFile("public/sw.js", "utf8");
const html = await readFile("public/offline.html", "utf8");
const readerCode = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const stores = new Map();
let quota = false, offline = false, bad = false, time = "08:15", networkCalls = 0;
const keyOf = key => new URL(typeof key === "string" ? key : key.url, origin).href;
const caches = {
  async open(name) {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name);
    return {
      async match(key) { return store.get(keyOf(key))?.clone(); },
      async put(key, response) { if (quota) throw new Error("QuotaExceededError"); store.set(keyOf(key), response.clone()); },
      async addAll(paths) {
        for (const path of paths) store.set(keyOf(path), new Response(path === "/offline.html" ? html : "icon"));
      },
    };
  },
  async keys() { return [...stores.keys()]; },
  async delete(key) { return stores.delete(key); },
};
const sample = () => ({ trips: [1, 2, 3].map(id => ({
  id: String(id), nisja: `Nisja ${id}`, destinacioni: "AAB", ora: id === 2 ? time : "08:00",
  vendtakimi: "Stacioni", vende: id === 3 ? 0 : 2,
  email: "PRIVATE_FIXTURE_FIELD", shofer_id: "PRIVATE_FIXTURE_OWNER",
})) });
function worker() {
  const handlers = {};
  let claimed = false, skipped = false;
  vm.runInNewContext(workerCode, {
    self: { location: { origin }, addEventListener(name, fn) { handlers[name] = fn; },
      async skipWaiting() { skipped = true; }, clients: { async claim() { claimed = true; } } },
    caches, Response, Headers, URL, AbortSignal,
    async fetch(request, options) {
      networkCalls++;
      if (offline) throw new TypeError("offline fixture");
      if (new URL(request.url, origin).pathname === "/api/udhetimet") {
        assert.equal(options.credentials, "omit"); assert.equal(options.cache, "no-store");
        assert.ok(options.signal instanceof AbortSignal);
        if (bad) return new Response("bad gateway", { status: 503 });
        return Response.json(sample(), { headers: { "set-cookie": "PRIVATE_FIXTURE_COOKIE" } });
      }
      return new Response("network document");
    },
  });
  return {
    async lifecycle(name) { let task; handlers[name]({ waitUntil(promise) { task = promise; } }); await task; },
    async request(path, options = {}) {
      let response;
      const request = { url: new URL(path, origin).href, method: "GET", mode: "cors", ...options };
      handlers.fetch({ request, respondWith(promise) { response = promise; } });
      return response ? await response : undefined;
    },
    claimed: () => claimed, skipped: () => skipped,
  };
}
let sw = worker();
await caches.open("rideshare-public-old"); await caches.open("other-app-cache");
await sw.lifecycle("install"); await sw.lifecycle("activate");
assert.equal(sw.claimed(), true); assert.equal(sw.skipped(), true);
assert.ok(!stores.has("rideshare-public-old")); assert.ok(stores.has("other-app-cache"));
console.log("PASS: exact worker install/activate logic caches shell; clears only old RideShare caches and claims clients (VM).");

offline = true;
assert.equal((await sw.request("/api/udhetimet")).status, 503);
assert.ok((await (await sw.request("/", { mode: "navigate" })).text()).includes("Lista e ruajtur"));
console.log("PASS: first offline request without snapshot returns 503; shell does not invent trips (VM).");

offline = false;
const online = await sw.request("/api/udhetimet");
assert.equal(online.headers.get("x-rideshare-source"), "network");
const timestamp = online.headers.get("x-rideshare-saved-at"); assert.ok(Number.isFinite(Date.parse(timestamp)));
assert.equal(online.headers.get("set-cookie"), null);
const payload = await online.text(); assert.ok(!payload.includes("PRIVATE_FIXTURE"));
assert.equal(JSON.parse(payload).trips.length, 3);
const publicStore = stores.get("rideshare-public-v1");
assert.deepEqual([...publicStore.keys()].map(path => new URL(path).pathname).sort(), ["/offline.html", "/icons/icon-192.png", "/icons/icon-512.png", "/api/udhetimet"].sort());
console.log("PASS: successful list saves three public trips with timestamp; extra private fields and cookie headers removed (VM).");

for (const [path, options] of [["/panel"], ["/api/auth/session"], ["/udhetimi/2"], ["/api/udhetimet?private=1"],
  ["/api/udhetimet", { method: "POST" }], ["/panel", { method: "POST" }], ["https://other.invalid/api/udhetimet"]]) {
  assert.equal(await sw.request(path, options), undefined);
}
console.log("PASS: panel, auth, details, queries, cross-origin requests and all POSTs bypass the worker; no write queue (VM).");

offline = true;
// A new worker instance shares persistent storage: no old JS view is reused.
sw = worker();
assert.ok((await (await sw.request("/", { mode: "navigate" })).text()).includes("<html lang=\"sq\">"));
const cached = await sw.request("/api/udhetimet");
assert.equal(cached.headers.get("x-rideshare-source"), "cache");
assert.equal(cached.headers.get("x-rideshare-saved-at"), timestamp);
assert.equal((await cached.json()).trips.length, 3);

function element() {
  return { textContent: "", children: [], dataset: {}, disabled: false,
    append(...nodes) { this.children.push(...nodes); }, replaceChildren() { this.children = []; },
    removeAttribute() {}, addEventListener(name, fn) { this[name] = fn; } };
}
const elements = Object.fromEntries(["source", "saved", "refresh", "trips", "book"].map(id => [id, element()]));
elements.book.disabled = true;
const events = {};
const context = vm.createContext({
  document: { querySelector(selector) { return elements[selector.slice(1)]; }, createElement: element },
  window: { addEventListener(name, fn) { events[name] = fn; } },
  fetch: path => sw.request(path),
});
await vm.runInContext(readerCode, context);
assert.equal(elements.trips.children.length, 3);
assert.match(elements.source.textContent, /cache/);
assert.equal(elements.saved.dateTime, timestamp);
assert.equal(elements.book.disabled, true);
console.log("PASS: recreated worker plus exact reader script shows three cached cards after simulated reload, same timestamp and disabled reservation (VM DOM, not browser).");

offline = false; time = "08:25";
events.online();
assert.match(elements.source.textContent, /Rifresko listën/);
assert.equal(elements.saved.dateTime, timestamp);
const beforeRefresh = networkCalls;
await elements.refresh.click();
assert.ok(networkCalls > beforeRefresh);
assert.ok(elements.trips.children[1].children[1].textContent.includes("08:25"));
assert.match(elements.source.textContent, /nga serveri/);
assert.ok(Date.parse(elements.saved.dateTime) >= Date.parse(timestamp));
assert.equal(elements.book.disabled, true);
console.log("PASS: online event alone preserves stale timestamp; explicit refresh fetches 08:25 from fixture server, new source/time, still no reservation (VM).");

bad = true;
const failed = await sw.request("/api/udhetimet");
assert.equal(failed.headers.get("x-rideshare-source"), "cache");
bad = false; quota = true;
const unpersisted = await sw.request("/api/udhetimet");
assert.equal(unpersisted.headers.get("x-rideshare-source"), "network");
assert.equal(unpersisted.headers.get("x-rideshare-saved-at"), null);
console.log("PASS: server error falls back to marked cache; storage quota failure returns fresh data without claiming saved timestamp (VM).");
console.log("LIMIT: browser SW registration/lifecycle, real offline refresh, installability, DevTools and mobile layout remain manual.");
