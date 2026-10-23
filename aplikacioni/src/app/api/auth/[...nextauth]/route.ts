import NextAuth from "next-auth";
import { authOptions, hyrjaKonfiguruar } from "@/lib/auth";

export const dynamic = "force-dynamic";
const handler = NextAuth(authOptions);

async function auth(request: Request, context: { params: Promise<{ nextauth: string[] }> }) {
  if (!hyrjaKonfiguruar()) {
    return Response.json({ error: "Hyrja me GitHub ende nuk është konfiguruar." }, {
      status: 503, headers: { "Cache-Control": "no-store" },
    });
  }
  return handler(request, context);
}

export { auth as GET, auth as POST };
