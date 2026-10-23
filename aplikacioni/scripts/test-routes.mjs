import assert from "node:assert/strict";
import { lexoPerTestim } from "./test-database.mjs";

// Nise serverin veçmas: npm run start (ose npm run dev).
// Port tjetër: npm run test:routes -- http://localhost:3004
// Lejohen vetëm adresa lokale që testi të mos dërgojë të dhëna te shërbime të tjera.
let hapi = "Leximi i të dhënave nga PostgreSQL";
try {
  const base = new URL(process.argv[2] ?? "http://localhost:3000");
  assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(base.hostname));
  assert.ok(["http:", "https:"].includes(base.protocol));
  const udhetimet = await lexoPerTestim();
  assert.equal(udhetimet.length, 3);

  async function hap(path, status = 200) {
    hapi = `${path}: HTTP ${status}`;
    const response = await fetch(new URL(path, base), {
      cache: "no-store", signal: AbortSignal.timeout(20000),
    });
    assert.equal(response.status, status);
    const html = await response.text();
    assert.doesNotMatch(html, /postgres(?:ql)?:\/\//i);
    if (process.env.DATABASE_URL) {
      assert.ok(!html.includes(process.env.DATABASE_URL));
    }
    console.log(`PASS: ${hapi}`);
    return html;
  }

  const lista = await hap("/");
  // HTML me status 200 nuk mjafton: dev/start mund të kenë mbishkruar
  // të njëjtën dosje .next dhe të kenë prishur CSS/JavaScript-in.
  const assets = [...new Set([...lista.matchAll(/(?:src|href)="([^\"]+)"/g)]
    .map((match) => match[1])
    .filter((path) => path.startsWith("/_next/static/") && /\.(?:js|css)(?:\?|$)/.test(path)))];
  hapi = "Faqja përmban burime CSS/JavaScript të Next.js";
  assert.ok(assets.length > 0);
  for (const path of assets) {
    hapi = `${path}: burimi publik ngarkohet me tipin e saktë`;
    const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(20000) });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /\.css(?:\?|$)/.test(path)
      ? /text\/css/i : /(?:application|text)\/(?:javascript|x-javascript)/i);
  }
  console.log(`PASS: ${assets.length} burime CSS/JavaScript ngarkohen me HTTP 200 dhe tipin e saktë.`);
  hapi = "Lista pasqyron tri udhëtimet nga PostgreSQL";
  assert.equal((lista.match(/class="card"/g) ?? []).length, udhetimet.length);
  for (const u of udhetimet) {
    const ora = u.ora.slice(0, 5);
    assert.ok(lista.includes(u.nisja));
    assert.ok(lista.includes(ora));
    assert.ok(lista.includes(`href="/udhetimi/${u.id}"`));

    const detajet = await hap(`/udhetimi/${u.id}`);
    hapi = `Detajet e udhëtimit ${u.id} përputhen me PostgreSQL`;
    assert.ok(detajet.includes(u.nisja));
    assert.ok(detajet.includes(u.destinacioni));
    assert.ok(detajet.includes(`<span>Ora</span><strong>${ora}</strong>`));
    assert.ok(detajet.includes(`<span>Vende të lira</span><strong>${u.vendet_e_lira}</strong>`));
    assert.ok(detajet.includes(`<span>Çmimi</span><strong>${Number(u.cmimi)}`));
    if (u.vendet_e_lira === 0) {
      assert.match(detajet, /<button disabled=""[^>]*>Nuk ka vende të lira<\/button>/);
      assert.ok(!detajet.includes(`href="/udhetimi/${u.id}/kerkesa"`));
    } else {
      assert.ok(detajet.includes(`href="/udhetimi/${u.id}/kerkesa"`));
    }
    console.log(`PASS: ${hapi}`);

    const kerkesa = await hap(`/udhetimi/${u.id}/kerkesa`);
    hapi = `Simulimi i kërkesës për udhëtimin ${u.id}`;
    assert.ok(kerkesa.includes(u.vendet_e_lira > 0 ? "Simulim: Në pritje" : "Nuk mund të kërkosh vend"));
    assert.ok(kerkesa.includes('href="/"'));
    console.log(`PASS: ${hapi}`);
  }

  for (const id of ["99", "abc", "2147483648", "1%20OR%201%3D1"]) {
    for (const suffix of ["", "/kerkesa"]) {
      const html = await hap(`/udhetimi/${id}${suffix}`, 404);
      assert.ok(html.includes("Udhëtimi nuk u gjet"));
    }
  }
  const perseri = await hap("/");
  hapi = "Përgjigjja dinamike pas rifreskimit";
  assert.equal((perseri.match(/class="card"/g) ?? []).length, udhetimet.length);
  console.log("PASS: Lista, detajet, simulimi, zero vende dhe ID-të e panjohura.");
  console.log("Shënim: testi nuk ndryshon orën në Neon dhe nuk verifikon pamjen vizuale.");
} catch {
  console.error(`FAIL: ${hapi}. Hollësitë private të gabimit nuk afishohen.`);
  process.exitCode = 1;
}
