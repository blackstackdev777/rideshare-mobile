import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";

// Test vetëm me SELECT; nuk ndryshon skemën ose të dhënat.
export async function lexoPerTestim() {
  nextEnv.loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL mungon.");
  }
  const sql = neon(process.env.DATABASE_URL, {
    fetchOptions: { cache: "no-store", signal: AbortSignal.timeout(15000) },
  });
  return sql`
    SELECT id, nisja, destinacioni, ora, cmimi, vendet_e_lira
    FROM udhetimet ORDER BY id
  `;
}

async function testo() {
  let hapi = "Lidhja me PostgreSQL dhe leximi i tabelës udhetimet";
  try {
    const rreshtat = await lexoPerTestim();
    console.log(`PASS: PostgreSQL ktheu ${rreshtat.length} udhëtime.`);

    hapi = "Tri udhëtimet e detyrës me ID 1, 2, 3";
    assert.deepEqual(rreshtat.map((r) => r.id), [1, 2, 3]);
    const nisjet = ["Prishtinë", "Fushë Kosovë", "Lipjan"];
    rreshtat.forEach((r, i) => {
      assert.equal(r.nisja, nisjet[i]);
      assert.equal(r.destinacioni, "AAB");
      assert.match(r.ora, /^\d{2}:\d{2}:\d{2}/);
      assert.ok(Number.isFinite(Number(r.cmimi)));
      assert.ok(Number.isInteger(r.vendet_e_lira) && r.vendet_e_lira >= 0);
    });
    assert.equal(rreshtat[2].vendet_e_lira, 0);
    console.log("PASS: ID-të, drejtimet, tipat dhe udhëtimi pa vende.");
    // Vetëm të dhëna publike të udhëtimeve; asnjë URL ose kredencial.
    console.table(rreshtat.map((r) => ({
      id: r.id,
      nisja: r.nisja,
      destinacioni: r.destinacioni,
      ora: r.ora.slice(0, 5),
      cmimi: Number(r.cmimi),
      vende: r.vendet_e_lira,
    })));
  } catch {
    console.error(`FAIL: ${hapi}. Hollësitë private të gabimit nuk afishohen.`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await testo();
}
