import "server-only";
import { getServerSession } from "next-auth";
import { authOptions, hyrjaKonfiguruar } from "./auth";
import { getSql } from "./db";

type Profil = { id: string; emri: string; roli: "udhetar" | "shofer" };
type UdhetimiPerNdryshim = { id: string; ora: string };

export async function profiliIm(): Promise<Profil | null> {
  if (!hyrjaKonfiguruar()) return null;
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id || !/^\d+$/.test(id)) return null;
  try {
    const sql = getSql();
    // The database default makes every new verified account a passenger.
    await sql`INSERT INTO profilet (github_id, emri)
      VALUES (${id}, ${session.user.name ?? "Student"})
      ON CONFLICT (github_id) DO NOTHING`;
    const rows = await sql`SELECT github_id AS id, emri, roli FROM profilet WHERE github_id = ${id}`;
    const p = rows[0] as Profil | undefined;
    return p && ["udhetar", "shofer"].includes(p.roli) ? p : null;
  } catch {
    throw new Error("Profili nuk mund të lexohet nga baza e të dhënave.");
  }
}

export async function lexoUdhetiminTim(id: string, p: Profil): Promise<UdhetimiPerNdryshim | null> {
  if (p.roli !== "shofer" || !/^[123]$/.test(id)) return null;
  try {
    const sql = getSql();
    const rows = await sql`SELECT id, ora FROM udhetimet
      WHERE id = ${Number(id)} AND shofer_id = ${p.id}
        AND EXISTS (SELECT 1 FROM profilet WHERE github_id = ${p.id} AND roli = 'shofer')`;
    const row = rows[0];
    return row ? { id: String(row.id), ora: String(row.ora).slice(0, 5) } : null;
  } catch {
    throw new Error("Ora aktuale nuk mund të lexohet nga baza e të dhënave.");
  }
}

export async function ndryshoOren(id: string, ora: string) {
  const p = await profiliIm();
  if (!p) return "hyr";
  if (p.roli !== "shofer") return "ndaluar";
  if (!/^[123]$/.test(id) || !/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(ora)) return "fushe";
  try {
    const sql = getSql();
    // Both ownership and the current database role are checked atomically.
    // No identity or role from FormData is trusted.
    const rows = await sql`UPDATE udhetimet SET ora = ${ora}
      WHERE id = ${Number(id)} AND shofer_id = ${p.id}
        AND EXISTS (SELECT 1 FROM profilet WHERE github_id = ${p.id} AND roli = 'shofer')
      RETURNING id, ora`;
    if (rows.length !== 1) return "ndaluar";
    // Confirm the value returned by PostgreSQL, not just the submitted value.
    return String(rows[0].id) === id && String(rows[0].ora).slice(0, 5) === ora
      ? "ruajtur" : "verifikimi";
  } catch {
    throw new Error("Ora nuk mund të ruhet në bazën e të dhënave.");
  }
}
