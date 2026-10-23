import "server-only";
import type { DefaultSession, NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

// Accept the setup script's Auth.js names as well as the course's v4 names.
// Resolve once so the provider and configuration guard always agree.
const githubId = process.env.GITHUB_ID || process.env.AUTH_GITHUB_ID || "";
const githubSecret = process.env.GITHUB_SECRET || process.env.AUTH_GITHUB_SECRET || "";
const sessionSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;

export function hyrjaKonfiguruar() {
  return Boolean(githubId && githubSecret && sessionSecret && process.env.NEXTAUTH_URL);
}

export const authOptions: NextAuthOptions = {
  secret: sessionSecret,
  providers: [GitHubProvider({
    clientId: githubId,
    clientSecret: githubSecret,
  })],
  session: { strategy: "jwt", maxAge: 2 * 60 * 60 },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
  // Do not send provider/database errors or private configuration to logs.
  logger: {
    error() { console.error("Hyrja dështoi. Kontrollo konfigurimin privat të OAuth."); },
    warn() { console.warn("Kontrollo konfigurimin e hyrjes në server."); },
  },
};

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}
