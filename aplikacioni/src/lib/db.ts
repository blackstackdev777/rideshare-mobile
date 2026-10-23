import "server-only";
import { neon } from "@neondatabase/serverless";

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Lidhja me bazën e të dhënave nuk është konfiguruar.");
  return neon(url, {
    fetchOptions: { cache: "no-store", signal: AbortSignal.timeout(15000) },
  });
}
