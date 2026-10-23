"use client";

import { signIn, signOut } from "next-auth/react";
import { useState } from "react";
import { useLidhjaMeRrjetin } from "@/lib/rrjeti";

export default function Hyrja({ brenda, konfiguruar }: { brenda: boolean; konfiguruar: boolean }) {
  const online = useLidhjaMeRrjetin();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  async function vepro() {
    setBusy(true);
    setError(false);
    try {
      if (brenda) await signOut({ callbackUrl: "/panel" });
      else await signIn("github", { callbackUrl: "/panel" });
    } catch {
      setError(true);
    } finally { setBusy(false); }
  }
  return <>
    <button className="button primary" disabled={!online || !konfiguruar || busy} onClick={vepro}>
      {busy ? "Duke pritur…" : brenda ? "Dil" : "Hyr me GitHub"}
    </button>
    {error && <p role="alert">Hyrja ose dalja nuk përfundoi. Kontrollo lidhjen dhe provo përsëri.</p>}
  </>;
}
