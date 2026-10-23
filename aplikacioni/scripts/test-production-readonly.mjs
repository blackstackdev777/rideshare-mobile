import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { access } from "node:fs/promises";
import { createServer } from "node:net";
import { lexoPerTestim } from "./test-database.mjs";

// Runs only GETs and the existing SELECT-based route test against a fresh
// production process. No logged-in cookies, actions or migration are sent.
let server, output = "";
try {
  await access(".next/BUILD_ID");
  const socket = createServer().listen(0, "127.0.0.1");
  await once(socket, "listening");
  const port = socket.address().port;
  await new Promise(resolve => socket.close(resolve));
  const base = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, ["./node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Startup timeout")), 25000);
    const collect = data => { output = (output + data).slice(-100000); if (output.includes("Ready in")) { clearTimeout(timeout); resolve(); } };
    server.stdout.on("data", collect); server.stderr.on("data", collect);
    server.once("exit", () => { clearTimeout(timeout); reject(new Error("Production process exited")); });
    server.once("error", reject);
  });
  const routes = spawn(process.execPath, ["./scripts/test-routes.mjs", base], { stdio: "inherit", windowsHide: true });
  const [code] = await once(routes, "exit"); assert.equal(code, 0);
  const response = await fetch(base + "/api/udhetimet");
  assert.equal(response.status, 200); assert.equal(response.headers.get("cache-control"), "no-store");
  const { trips } = await response.json();
  assert.equal(trips.length, 3);
  const databaseRows = await lexoPerTestim();
  assert.deepEqual(trips.map(t => t.ora), databaseRows.map(t => t.ora.slice(0, 5)));
  const panel = await (await fetch(base + "/panel")).text();
  assert.ok(panel.includes("Hyr me GitHub")); assert.ok(!panel.includes("Ruaj orën"));
  const configured = Boolean((process.env.GITHUB_ID || process.env.AUTH_GITHUB_ID) &&
    (process.env.GITHUB_SECRET || process.env.AUTH_GITHUB_SECRET) &&
    (process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET) && process.env.NEXTAUTH_URL);
  if (!configured) {
    assert.ok(panel.includes("ende nuk është konfiguruar"));
    const session = await fetch(base + "/api/auth/session");
    assert.equal(session.status, 503); assert.equal(session.headers.get("cache-control"), "no-store");
    console.log("PASS: missing private OAuth config shows setup notice and sanitized no-store 503; no insecure fallback session.");
  }
  console.log("PASS: real Neon production GETs return three trips with matching database times; anonymous panel has no edit form.");
  console.log("LIMIT: HTTP only; no real GitHub OAuth, logged-in Neon writes, browser/offline/visual acceptance.");
} catch {
  console.error("FAIL: read-only production checks. Private details hidden."); process.exitCode = 1;
} finally {
  if (server && server.exitCode === null && server.signalCode === null) {
    const stopped = once(server, "exit"); server.kill(); await stopped;
  }
}
