import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { access } from "node:fs/promises";
import { createServer } from "node:net";
import { randomBytes } from "node:crypto";
import { encode, decode } from "next-auth/jwt";

// Actual production HTTP/session/action tests with in-memory SQL fixtures.
// They do not execute GitHub OAuth or browser/Service Worker lifecycle tests.
let child, output = "", step = "production build";
const secret = randomBytes(32).toString("hex");
const aliases = process.argv.includes("--auth-aliases");
let sequence = 0;
async function command(command, extra = {}) {
  const id = ++sequence;
  const reply = new Promise((resolve, reject) => {
    const timer = setTimeout(() => { child.off("message", listener); reject(new Error("Fixture IPC timeout")); }, 5000);
    function listener(message) {
      if (message.fixture === id) { clearTimeout(timer); child.off("message", listener); resolve(message); }
    }
    child.on("message", listener);
  });
  child.send({ id, command, ...extra });
  return reply;
}
try {
  await access(".next/BUILD_ID");
  const socket = createServer().listen(0, "127.0.0.1");
  await once(socket, "listening");
  const port = socket.address().port;
  await new Promise(resolve => socket.close(resolve));
  const base = `http://127.0.0.1:${port}`;
  const authEnv = aliases
    ? { GITHUB_ID: "", GITHUB_SECRET: "", NEXTAUTH_SECRET: "", AUTH_GITHUB_ID: "fixture-id", AUTH_GITHUB_SECRET: "fixture-secret", AUTH_SECRET: secret }
    : { GITHUB_ID: "fixture-id", GITHUB_SECRET: "fixture-secret", NEXTAUTH_SECRET: secret, AUTH_GITHUB_ID: "", AUTH_GITHUB_SECRET: "", AUTH_SECRET: "" };
  child = spawn(process.execPath, ["--import", "./scripts/fixtures/week56.mjs", "./node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    env: { ...process.env, DATABASE_URL: "postgresql://fixture:fixture@localhost/fixture", ...authEnv,
      NEXTAUTH_URL: base, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe", "ipc"], windowsHide: true,
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Startup timeout")), 25000);
    const collect = data => { output = (output + data).slice(-100000); if (output.includes("Ready in")) { clearTimeout(timer); resolve(); } };
    child.stdout.on("data", collect); child.stderr.on("data", collect);
    child.once("exit", () => { clearTimeout(timer); reject(new Error("Fixture exited")); });
    child.once("error", reject);
  });
  const token = await encode({ secret, token: { sub: "12345", name: "Fixture Driver" }, maxAge: 7200 });
  const cookie = `next-auth.session-token=${token}`;
  const expired = await encode({ secret, token: { sub: "12345" }, maxAge: -60 });
  async function get(path, sessionCookie = "") {
    return fetch(base + path, { headers: { cookie: sessionCookie }, redirect: "manual", signal: AbortSignal.timeout(20000) });
  }
  async function update(id, ora, sessionCookie, actionId, extras = {}) {
    const form = new FormData();
    form.set(`$ACTION_ID_${actionId}`, ""); form.set("id", id); form.set("ora", ora);
    for (const [key, value] of Object.entries(extras)) form.set(key, value);
    const response = await fetch(base + "/panel", { method: "POST", headers: { cookie: sessionCookie, origin: base }, body: form, redirect: "manual" });
    assert.equal(response.status, 303);
    return new URL(response.headers.get("location"), base).searchParams.get("m");
  }
  step = "public list and safe JSON projection";
  const api = await get("/api/udhetimet", cookie);
  assert.equal(api.status, 200); assert.equal(api.headers.get("cache-control"), "no-store");
  const { trips } = await api.json(); assert.equal(trips.length, 3);
  assert.deepEqual(Object.keys(trips[0]).sort(), ["id", "nisja", "destinacioni", "ora", "vendtakimi", "vende"].sort());
  console.log("PASS: public API returns three trips with only allowed fields, no-store, even when a session is sent.");

  step = "anonymous, valid, expired and tampered sessions";
  assert.deepEqual(await (await get("/api/auth/session")).json(), {});
  const session = await (await get("/api/auth/session", cookie)).json(); assert.equal(session.user.id, "12345");
  const ttl = (Date.parse(session.expires) - Date.now()) / 1000;
  assert.ok(ttl > 7190 && ttl <= 7201, "production session config must expire in two hours");
  const decoded = await decode({ secret, token }); assert.equal(decoded.exp - decoded.iat, 7200);
  for (const invalid of [expired, token.slice(0, -8) + "INVALID!"]) {
    assert.deepEqual(await (await get("/api/auth/session", `next-auth.session-token=${invalid}`)).json(), {});
  }
  console.log("PASS: signed fixture identity, two-hour expiry, absent/expired/tampered cookie handling (no OAuth login).");

  step = "GitHub authorization redirect wiring";
  const providers = await (await get("/api/auth/providers")).json();
  assert.equal(providers.github.type, "oauth");
  const anonymousPanel = await (await get("/panel")).text();
  const loginButton = anonymousPanel.match(/<button([^>]*)>Hyr me GitHub<\/button>/);
  assert.ok(loginButton && !loginButton[1].includes("disabled"));
  assert.ok(!anonymousPanel.includes("ende nuk është konfiguruar"));
  console.log(`PASS: ${aliases ? "AUTH aliases" : "legacy variables"} enable the production login button and GitHub provider.`);
  const startCsrf = await get("/api/auth/csrf");
  const startCookies = startCsrf.headers.getSetCookie().map(c => c.split(";")[0]).join("; ");
  const startBody = await startCsrf.json();
  const signIn = await fetch(base + "/api/auth/signin/github", { method: "POST", headers: {
    cookie: startCookies, "content-type": "application/x-www-form-urlencoded",
  }, body: new URLSearchParams({ csrfToken: startBody.csrfToken, callbackUrl: base + "/panel", json: "true" }), redirect: "manual" });
  assert.equal(signIn.status, 200);
  const authorization = new URL((await signIn.json()).url);
  assert.equal(authorization.origin, "https://github.com");
  assert.equal(authorization.searchParams.get("redirect_uri"), base + "/api/auth/callback/github");
  assert.ok(authorization.searchParams.get("state"));
  console.log("PASS: CSRF-protected GitHub sign-in initiation returns GitHub authorization URL, state and correct callback (dummy app; redirect not followed).");

  step = "driver panel and server action";
  const panel = await (await get("/panel", cookie)).text();
  assert.ok(panel.includes("Fixture Driver")); assert.ok(panel.includes("Ruaj orën"));
  assert.match(panel, /name="ora"[^>]*value="08:15"/);
  const actionId = panel.match(/name="\$ACTION_ID_([a-f0-9]+)"/)?.[1]; assert.ok(actionId, "server action form ID");
  assert.equal(await update("2", "08:25", cookie, actionId), "ruajtur");
  let state = await command("inspect"); assert.equal(state.trips[1].ora, "08:25:00");
  const writtenQuery = state.queries.find(q => /UPDATE udhetimet SET ora/.test(q.query));
  assert.deepEqual(writtenQuery.params, ["08:25", "2", "12345", "12345"]);
  const savedPanel = await (await get("/panel?m=ruajtur", cookie)).text();
  assert.match(savedPanel, /name="ora"[^>]*value="08:25"/);
  assert.match(savedPanel, /data-testid="ora-aktuale">08:25<\/strong>/);
  assert.ok(savedPanel.includes("Ora u ruajt me sukses në Neon"));
  const details = await (await get("/udhetimi/2")).text(); assert.ok(details.includes("08:25"));
  const beforeDeniedUpdate = await command("inspect");
  assert.equal(await update("1", "08:25", cookie, actionId, { shofer_id: "54321", roli: "shofer" }), "ndaluar");
  state = await command("inspect"); assert.equal(state.trips[0].ora, "08:00:00");
  assert.deepEqual(state.trips, beforeDeniedUpdate.trips, "Unauthorized request must preserve every trip field, including ownership");
  assert.equal(state.trips[1].ora, "08:25:00");
  const deniedQuery = state.queries.filter(q => /UPDATE udhetimet SET ora/.test(q.query)).at(-1);
  assert.deepEqual(deniedQuery.params, ["08:25", "1", "12345", "12345"]);
  const deniedResponse = await get("/panel?m=ndaluar", cookie);
  assert.equal(deniedResponse.status, 200);
  const deniedHtml = await deniedResponse.text();
  assert.match(deniedHtml, /role="alert">Nuk ke leje për këtë udhëtim\. Ora nuk ndryshoi\./);
  assert.ok(!deniedHtml.includes("Ora u ruajt me sukses"));
  console.log("PASS: official scenario via real production server action: own ID 2 -> 08:25; foreign ID 1 rejected, still 08:00; forged owner ignored (fixture DB).");
  console.log("PASS: unauthorized POST returns HTTP 303 -> /panel?m=ndaluar; denial page HTTP 200 shows Albanian alert; all trip fields unchanged, ID 1 08:00 and ID 2 08:25 (fixture DB).");
  console.log("PASS: posted HH:mm reaches SQL unchanged; session ID matches ownership predicate; refreshed panel/input read 08:25 from fixture storage, not a hard-coded default.");

  step = "another authenticated driver cannot edit trip 2";
  const otherDriver = await encode({ secret, token: { sub: "54321", name: "Other Driver" }, maxAge: 7200 });
  const otherCookie = `next-auth.session-token=${otherDriver}`;
  const otherPanel = await (await get("/panel", otherCookie)).text();
  assert.ok(otherPanel.includes("Udhëtimi 2 nuk është i caktuar"));
  assert.ok(!otherPanel.includes('name="ora"'));
  assert.equal(await update("2", "09:00", otherCookie, actionId), "ndaluar");
  console.log("PASS: another real fixture driver gets no edit form for trip 2 and cannot use the owner's action to modify it.");

  step = "database failure and returned-value mismatch do not report success";
  await command("update-fault", { fault: "error" });
  assert.equal(await update("2", "09:00", cookie, actionId), "databaza");
  const failurePanel = await (await get("/panel?m=databaza", cookie)).text();
  assert.ok(failurePanel.includes("Ruajtja nuk u konfirmua"));
  assert.ok(!failurePanel.includes("PRIVATE_FIXTURE_UPDATE_ERROR"));
  await command("update-fault", { fault: "mismatch" });
  assert.equal(await update("2", "09:00", cookie, actionId), "verifikimi");
  state = await command("inspect"); assert.equal(state.trips[1].ora, "08:25:00");
  console.log("PASS: database error and an unconfirmed returned time show failure; no false save-success status.");

  step = "invalid input, missing login and revoked database role";
  for (const [id, time] of [["1 OR 1=1", "08:25"], ["2", "24:00"], ["2", "08:99"], ["99", "08:25"]]) {
    assert.equal(await update(id, time, cookie, actionId), "fushe");
  }
  assert.equal(await update("2", "09:00", "", actionId), "hyr");
  assert.equal(await update("2", "09:00", `next-auth.session-token=${expired}`, actionId), "hyr");
  await command("role", { role: "udhetar" });
  assert.equal(await update("2", "09:00", cookie, actionId), "ndaluar");
  await command("role", { role: "shofer" }); await command("race");
  assert.equal(await update("2", "09:00", cookie, actionId), "ndaluar");
  state = await command("inspect"); assert.equal(state.trips[1].ora, "08:25:00");
  const passenger = await encode({ secret, token: { sub: "77777", name: "New Passenger" }, maxAge: 7200 });
  assert.ok((await (await get("/panel", `next-auth.session-token=${passenger}`)).text()).includes("udhetar"));
  state = await command("inspect"); assert.equal(state.profiles.find(p => p.id === "77777").roli, "udhetar");
  console.log("PASS: invalid IDs/times, anonymous write, passenger role, role removal and role change between SELECT/UPDATE all fail closed.");

  step = "CSRF-protected logout and stale form without cookie";
  const csrfResponse = await get("/api/auth/csrf", cookie);
  const { csrfToken } = await csrfResponse.json();
  const csrfCookie = csrfResponse.headers.getSetCookie().map(c => c.split(";")[0]).join("; ");
  const logout = await fetch(base + "/api/auth/signout", { method: "POST", headers: {
    cookie: `${cookie}; ${csrfCookie}`, "content-type": "application/x-www-form-urlencoded",
  }, body: new URLSearchParams({ csrfToken, callbackUrl: base + "/panel", json: "true" }), redirect: "manual" });
  assert.equal(logout.status, 200);
  assert.ok(logout.headers.getSetCookie().some(c => /next-auth.session-token=;/.test(c) && /Max-Age=0/i.test(c)));
  assert.deepEqual(await (await get("/api/auth/session")).json(), {});
  assert.equal(await update("2", "09:00", "", actionId), "hyr");
  console.log("PASS: actual NextAuth logout clears fixture session cookie; old form without cookie requires login (HTTP, not browser logout).");

  step = "manifest, icons, worker delivery and offline document";
  const manifest = await (await get("/manifest.webmanifest")).json();
  assert.equal(manifest.name, "RideShare AAB"); assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/"); assert.equal(manifest.scope, "/");
  for (const size of [192, 512]) {
    const icon = await get(`/icons/icon-${size}.png`); assert.equal(icon.status, 200);
    const bytes = Buffer.from(await icon.arrayBuffer());
    assert.equal(bytes.readUInt32BE(16), size); assert.equal(bytes.readUInt32BE(20), size);
  }
  const sw = await get("/sw.js"); assert.equal(sw.status, 200); assert.match(sw.headers.get("cache-control"), /no-store/);
  const offline = await (await get("/offline.html")).text();
  assert.match(offline, /id="book"[^>]*disabled/); assert.ok(offline.includes("asnjë rezervim nuk është konfirmuar"));
  assert.ok(offline.includes("textContent"));
  assert.ok((await (await get("/")).text()).includes('rel="manifest"'));
  assert.ok(!output.includes(secret));
  console.log("PASS: production manifest/link, standalone scope, real 192/512 PNG dimensions, no-store SW, self-contained read-only offline page.");
  console.log("LIMIT: no real GitHub OAuth, real database writes, browser refresh/offline/installation, layout or Console test performed.");
} catch (error) {
  console.error(`FAIL: ${step}: ${error.message.replaceAll(secret, "[redacted]")}`);
  process.exitCode = 1;
} finally {
  if (child && child.exitCode === null && child.signalCode === null) {
    const stopped = once(child, "exit"); child.kill(); await stopped;
  }
}
