import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { access } from "node:fs/promises";
import { createServer } from "node:net";

// Teston vetëm humbjen e lidhjes server -> databazë në build-in e prodhimit.
// Nuk simulon shfletuesin offline, nuk lexon kredenciale reale dhe nuk bën SQL.
const fixtureUrl = "postgresql://week56_fixture:week56_fixture@localhost/fixture";
const sentinel = "PRIVATE_NETWORK_OUTAGE_TEST_SENTINEL";
let server;
let output = "";
let step = "Build-i i prodhimit duhet të ekzistojë";

async function freePort() {
  const socket = createServer();
  socket.listen(0, "127.0.0.1");
  await once(socket, "listening");
  const port = socket.address().port;
  await new Promise((resolve, reject) => socket.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function startFixture(port) {
  // Konfigurimi dhe fetch-i ndryshohen vetëm brenda procesit të izoluar.
  // Bllokohen të gjitha kërkesat dalëse, edhe nëse Next lexon .env.local.
  const script = `
    process.env.DATABASE_URL = ${JSON.stringify(fixtureUrl)};
    globalThis.fetch = async () => {
      throw new TypeError(${JSON.stringify(sentinel)});
    };
    process.argv = [process.execPath, require.resolve('next/dist/bin/next'),
      'start', '--hostname', '127.0.0.1', '--port', ${JSON.stringify(String(port))}];
    require('next/dist/bin/next');
  `;
  server = spawn(process.execPath, ["--input-type=commonjs", "-"], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: fixtureUrl, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  });
  const ready = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Fixture startup timeout")), 20000);
    const cleanup = () => clearTimeout(timeout);
    const collect = (data) => {
      output = (output + data.toString()).slice(-1024 * 1024);
      if (output.includes("Ready in")) {
        cleanup();
        resolve();
      }
    };
    server.stdout.on("data", collect);
    server.stderr.on("data", collect);
    server.once("error", (error) => { cleanup(); reject(error); });
    server.once("exit", () => { cleanup(); reject(new Error("Fixture exited before checks completed")); });
  });
  server.stdin.end(script);
  await ready;
}

try {
  await access(".next/BUILD_ID");
  step = "Nisja e procesit të izoluar me rrjet dalës të bllokuar";
  const port = await freePort();
  await startFixture(port);
  const base = `http://127.0.0.1:${port}`;

  const paths = ["/", ...[1, 2, 3].flatMap((id) => [
    `/udhetimi/${id}`, `/udhetimi/${id}/kerkesa`,
  ])];
  for (const path of paths) {
    step = `${path}: gabim lidhjeje HTTP 500, pa kërkesë të suksesshme ose të dhëna rezervë`;
    const response = await fetch(new URL(path, base), {
      cache: "no-store", signal: AbortSignal.timeout(20000),
    });
    const html = await response.text();
    assert.equal(response.status, 500);
    assert.ok(!html.includes(sentinel));
    assert.ok(!html.includes("week56_fixture"));
    assert.doesNotMatch(html, /postgres(?:ql)?:\/\//i);
    assert.ok(!html.includes('class="card"'));
    assert.ok(!html.includes("Simulim: Në pritje"));
    console.log(`PASS: ${step}.`);
  }

  for (const path of ["/udhetimi/abc", "/udhetimi/abc/kerkesa"]) {
    step = `${path}: ID e pavlefshme refuzohet pa lidhje me databazën`;
    const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(20000) });
    assert.equal(response.status, 404);
    assert.ok((await response.text()).includes("Udhëtimi nuk u gjet"));
    console.log(`PASS: ${step}.`);
  }
  step = "Public API fails with sanitized no-store HTTP 503 during database outage";
  const api = await fetch(base + "/api/udhetimet");
  assert.equal(api.status, 503);
  assert.equal(api.headers.get("cache-control"), "no-store");
  const body = await api.json();
  assert.deepEqual(Object.keys(body), ["error"]);
  assert.ok(!JSON.stringify(body).includes(sentinel));
  console.log(`PASS: ${step}.`);
  step = "Gabimi privat i simuluar nuk kalon në log-et e aplikacionit";
  assert.ok(!output.includes(sentinel));
  assert.ok(!output.includes("week56_fixture"));
  console.log(`PASS: ${step}.`);
  console.log("LIMIT: Ky test nuk fik internetin real dhe nuk provon klikime, refresh offline, layout ose Console në shfletues.");
} catch {
  console.error(`FAIL: ${step}. Hollësitë private nuk afishohen.`);
  process.exitCode = 1;
} finally {
  if (server && server.exitCode === null && server.signalCode === null) {
    const stopped = once(server, "exit");
    server.kill();
    await stopped;
  }
}
