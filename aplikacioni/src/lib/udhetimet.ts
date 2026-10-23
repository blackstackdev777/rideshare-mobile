import "server-only";
import { neon } from "@neondatabase/serverless";

export type Udhetim = {
  id: string;
  nisja: string;
  destinacioni: string;
  ora: string;
  vendtakimi: string;
  vende: number;
  cmimi: number;
};

// Skema ekzistuese nuk ka kolonë për vendtakimin. Ruajmë vetëm
// këto etiketa të Javës 3; të gjitha fushat e tjera lexohen nga PostgreSQL.
const vendtakimet: Record<string, string> = {
  "1": "Stacioni i autobusëve",
  "2": "Te stacioni kryesor",
  "3": "Qendra e qytetit",
};

type RreshtUdhetimi = {
  id: number;
  nisja: string;
  destinacioni: string;
  ora: string;
  cmimi: string | number;
  vendet_e_lira: number;
};

function lidhja() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Lidhja me bazën e të dhënave nuk është konfiguruar.");
  }

  return neon(databaseUrl, {
    fetchOptions: { cache: "no-store", signal: AbortSignal.timeout(15000) },
  });
}

function konvertoUdhetimin(rreshti: RreshtUdhetimi): Udhetim {
  const id = String(rreshti.id);
  return {
    id,
    nisja: rreshti.nisja,
    destinacioni: rreshti.destinacioni,
    ora: rreshti.ora.slice(0, 5),
    cmimi: Number(rreshti.cmimi),
    vende: Number(rreshti.vendet_e_lira),
    vendtakimi: vendtakimet[id] ?? "Përcaktohet nga shoferi",
  };
}

export async function lexoUdhetimet(): Promise<Udhetim[]> {
  try {
    const sql = lidhja();
    const rreshtat = await sql`
      SELECT id, nisja, destinacioni, ora, cmimi, vendet_e_lira
      FROM udhetimet
      ORDER BY id
    `;
    return (rreshtat as RreshtUdhetimi[]).map(konvertoUdhetimin);
  } catch {
    // Gabimi origjinal i klientit mund të përmbajë hollësi private.
    throw new Error("Udhëtimet nuk mund të ngarkohen nga baza e të dhënave.");
  }
}

export async function gjejUdhetimin(id: string): Promise<Udhetim | undefined> {
  // Ruajmë formatin e ID-ve të rrugëve dhe kufirin INTEGER të PostgreSQL.
  if (!/^[1-9]\d{0,9}$/.test(id) || Number(id) > 2147483647) {
    return undefined;
  }

  try {
    const sql = lidhja();
    const rreshtat = await sql`
      SELECT id, nisja, destinacioni, ora, cmimi, vendet_e_lira
      FROM udhetimet
      WHERE id = ${Number(id)}
    `;
    const rreshti = rreshtat[0] as RreshtUdhetimi | undefined;
    return rreshti ? konvertoUdhetimin(rreshti) : undefined;
  } catch {
    throw new Error("Udhëtimi nuk mund të ngarkohet nga baza e të dhënave.");
  }
}
