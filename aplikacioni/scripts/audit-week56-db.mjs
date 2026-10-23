import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";

// Read-only metadata audit. No profile identity or secret is printed.
nextEnv.loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
try {
  const sql = neon(process.env.DATABASE_URL, {
    fetchOptions: { cache: "no-store", signal: AbortSignal.timeout(15000) },
  });
  const rows = await sql`SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name IN ('udhetimet', 'profilet')
    ORDER BY table_name, ordinal_position`;
  const has = (table, column) => rows.some(row => row.table_name === table && row.column_name === column);
  const ready = has("udhetimet", "shofer_id") && ["github_id", "emri", "roli"].every(c => has("profilet", c));
  console.log(ready ? "READY: Week 5 schema exists; OAuth/ownership acceptance still requires the real account."
    : "PENDING: Week 5 schema is incomplete. Review and manually run schema-java05.sql; no migration was executed.");
  console.table(rows);
} catch {
  console.error("FAIL: Read-only Week 5 schema audit. Private details hidden.");
  process.exitCode = 1;
}
