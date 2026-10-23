// Ky test përdor ekzekutimin e TypeScript të Node.js 22.18+ (ose 24+).
// HTTP i Neon zëvendësohet vetëm brenda këtij procesi testimi; nuk prek bazën reale.
import assert from "node:assert/strict";
import { neonConfig } from "@neondatabase/serverless";
import { lexoUdhetimet, gjejUdhetimin } from "../src/lib/udhetimet.ts";

const databaseUrlOrigjinal = process.env.DATABASE_URL;
const fetchOrigjinal = neonConfig.fetchFunction;
process.env.DATABASE_URL = "postgresql://test:test@localhost/test";

const fields = [
  ["id", 23], ["nisja", 1043], ["destinacioni", 1043],
  ["ora", 1083], ["cmimi", 1700], ["vendet_e_lira", 23],
].map(([name, dataTypeID]) => ({ name, dataTypeID }));
let rows = [["1", "Prishtinë", "AAB", "09:25:00", "2.50", "2"]];
let query;
let calls = 0;

try {
  neonConfig.fetchFunction = async (_url, options) => {
    calls++;
    query = JSON.parse(options.body);
    assert.equal(options.cache, "no-store");
    return new Response(JSON.stringify({
      fields, rows, rowCount: rows.length, command: "SELECT", rowAsArray: true,
    }), { status: 200 });
  };

  const [u] = await lexoUdhetimet();
  assert.equal(u.id, "1");
  assert.equal(u.ora, "09:25");
  assert.equal(u.cmimi, 2.5);
  assert.equal(u.vende, 2);
  assert.equal(u.vendtakimi, "Stacioni i autobusëve");
  console.log("PASS: Konvertimi INTEGER, NUMERIC, TIME dhe etiketat e vendtakimit.");

  await gjejUdhetimin("1");
  assert.match(query.query, /WHERE id = \$1/);
  // Drejtuesi e serializon parametrin numerik si tekst në protokollin HTTP.
  assert.deepEqual(query.params, ["1"]);
  console.log("PASS: ID dërgohet si parametër SQL; cache është no-store.");

  rows = [];
  assert.deepEqual(await lexoUdhetimet(), []);
  assert.equal(await gjejUdhetimin("99"), undefined);
  console.log("PASS: Lista bosh dhe udhëtimi që mungon.");

  const before = calls;
  for (const id of ["abc", "1 OR 1=1", "2147483648", "01", "-1"]) {
    assert.equal(await gjejUdhetimin(id), undefined);
  }
  assert.equal(calls, before);
  console.log("PASS: ID të pavlefshme, tentativë SQL injection dhe tejkalim INTEGER.");

  // Mesazhi i gabimit të drejtuesit nuk duhet të kalojë në gabimin e aplikacionit.
  neonConfig.fetchFunction = async () => { throw new Error("PRIVATE_TEST_SENTINEL"); };
  await assert.rejects(lexoUdhetimet, {
    message: "Udhëtimet nuk mund të ngarkohen nga baza e të dhënave.",
  });
  await assert.rejects(() => gjejUdhetimin("1"), {
    message: "Udhëtimi nuk mund të ngarkohet nga baza e të dhënave.",
  });
  delete process.env.DATABASE_URL;
  await assert.rejects(lexoUdhetimet, {
    message: "Udhëtimet nuk mund të ngarkohen nga baza e të dhënave.",
  });
  console.log("PASS: Gabimet dhe konfigurimi që mungon trajtohen pa sekrete ose të dhëna rezervë.");
} finally {
  neonConfig.fetchFunction = fetchOrigjinal;
  if (databaseUrlOrigjinal === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = databaseUrlOrigjinal;
}
