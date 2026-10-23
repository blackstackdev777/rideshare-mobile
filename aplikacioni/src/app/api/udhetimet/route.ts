import { lexoUdhetimet } from "@/lib/udhetimet";

export const dynamic = "force-dynamic";

export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    const rows = await lexoUdhetimet();
    // Explicit public projection: never include profiles, ownership or sessions.
    const trips = rows.map(({ id, nisja, destinacioni, ora, vendtakimi, vende }) =>
      ({ id, nisja, destinacioni, ora, vendtakimi, vende }));
    return Response.json({ trips }, { headers });
  } catch {
    return Response.json({ error: "Lista nuk mund të lexohet tani." }, { status: 503, headers });
  }
}
