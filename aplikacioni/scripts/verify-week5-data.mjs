import assert from "node:assert/strict";
import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";

// Real Neon verification uses SELECT only. No session is created and no
// private GitHub identity, connection string or secret is printed.
nextEnv.loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
let step = "read-only Neon connection";
try {
  const sql = neon(process.env.DATABASE_URL, {
    fetchOptions: { cache: "no-store", signal: AbortSignal.timeout(15000) },
  });
  const rows = await sql`SELECT u.id, to_char(u.ora, 'HH24:MI:SS') AS ora,
      u.shofer_id = (SELECT shofer_id FROM udhetimet WHERE id = 2) AS owned_by_trip2_driver,
      EXISTS (SELECT 1 FROM profilet p WHERE p.github_id = u.shofer_id AND p.roli = 'shofer') AS owner_is_driver
    FROM udhetimet u WHERE u.id IN (1, 2) ORDER BY u.id`;
  step = "trip 1 stays 08:00, trip 2 stays 08:25, and their drivers differ";
  assert.deepEqual(rows.map(row => [row.id, row.ora]), [[1, "08:00:00"], [2, "08:25:00"]]);
  assert.equal(rows[0].owned_by_trip2_driver, false);
  assert.equal(rows[1].owned_by_trip2_driver, true);
  assert.equal(rows[1].owner_is_driver, true);
  const guard = await sql`SELECT count(*)::integer AS matching_rows
    FROM udhetimet
    WHERE id = 1 AND shofer_id = (SELECT shofer_id FROM udhetimet WHERE id = 2)
      AND EXISTS (SELECT 1 FROM profilet
        WHERE github_id = (SELECT shofer_id FROM udhetimet WHERE id = 2) AND roli = 'shofer')`;
  assert.equal(guard[0].matching_rows, 0);
  console.table(rows);
  console.log("PASS: real Neon SELECT confirms ID 1 08:00, ID 2 08:25, different owners, and trip 2 owner has driver role. No write performed.");
  console.log("PASS: read-only PostgreSQL evaluation of the UPDATE ownership/role predicate matches zero rows for trip 1 when using trip 2's owner.");
  console.log("LIMIT: this query does not authenticate a browser user or execute an UPDATE; use production fixture tests for the HTTP ownership-denial check.");
} catch {
  console.error(`FAIL: ${step}. Private details hidden.`);
  process.exitCode = 1;
}
