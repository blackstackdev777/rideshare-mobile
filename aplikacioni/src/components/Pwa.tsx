"use client";

import { useEffect, useState } from "react";

export default function Pwa() {
  const [status, setStatus] = useState("Kopja e ruajtur mund të jetë e vjetër. Këtu nuk konfirmohen rezervime.");
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      setStatus("Ky shfletues nuk mbështet leximin offline. Përdor localhost ose HTTPS.");
      return;
    }
    let cancelled = false;
    let warming = false;
    async function warmSnapshot() {
      if (cancelled || warming || !navigator.serviceWorker.controller) return;
      warming = true;
      try {
        const response = await fetch("/api/udhetimet", { cache: "no-store", credentials: "omit" });
        if (cancelled) return;
        const saved = response.headers.get("x-rideshare-saved-at");
        setStatus(response.ok && saved
          ? response.headers.get("x-rideshare-source") === "cache"
            ? `Kopje nga cache: ${new Date(saved).toLocaleString("sq-AL")}. Mund të jetë vjetruar; serveri nuk u arrit.`
            : `Kopja publike u ruajt: ${new Date(saved).toLocaleString("sq-AL")}. Vendet duhen verifikuar përsëri.`
          : "Kopja publike ende nuk u ruajt. Hape listën me internet dhe provo përsëri.");
      } catch {
        if (!cancelled) setStatus("Lista nuk u arrit. Kopja, nëse ekziston, mund të jetë e vjetër.");
      } finally { warming = false; }
    }
    navigator.serviceWorker.addEventListener("controllerchange", warmSnapshot);
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then(() => navigator.serviceWorker.ready).then(warmSnapshot).catch(() => {
        if (!cancelled) setStatus("Leximi offline nuk u aktivizua. Provo përsëri online në localhost ose HTTPS.");
      });
    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", warmSnapshot);
    };
  }, []);
  return <aside className="pwa-notice">
    <a href="/offline.html">Lista për lexim pa internet</a>
    <p role="status">{status}</p>
  </aside>;
}
