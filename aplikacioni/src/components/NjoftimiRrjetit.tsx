"use client";

import { useEffect, useState } from "react";
import { useLidhjaMeRrjetin } from "@/lib/rrjeti";

export function NjoftimiRrjetit() {
  const neRrjet = useLidhjaMeRrjetin();
  const [kaHumburLidhjen, setKaHumburLidhjen] = useState(false);

  useEffect(() => {
    if (!neRrjet) setKaHumburLidhjen(true);
  }, [neRrjet]);

  if (neRrjet && !kaHumburLidhjen) return null;

  return (
    <aside className="network-notice" role="status" aria-live="polite">
      <strong>{neRrjet ? "Lidhja me rrjetin u rikthye" : "Je pa lidhje me rrjetin"}</strong>
      <p>
        Të dhënat e hapura mund të jenë të vjetruara. Vendet e lira nuk janë të konfirmuara.
        Kërkesa është vetëm simulim; asgjë nuk është dërguar te shoferi ose ruajtur në databazë.
      </p>
      {neRrjet ? (
        <button className="button secondary" onClick={() => window.location.reload()}>
          Rifresko të dhënat nga serveri
        </button>
      ) : (
        <p>Lidhu përsëri me rrjetin, pastaj rifresko faqen.</p>
      )}
    </aside>
  );
}
