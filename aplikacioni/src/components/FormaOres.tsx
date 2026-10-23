"use client";

import { useFormStatus } from "react-dom";
import { useLidhjaMeRrjetin } from "@/lib/rrjeti";

export default function FormaOres({ action, id, oraAktuale }: {
  action: (data: FormData) => Promise<void>;
  id: string;
  oraAktuale: string;
}) {
  const online = useLidhjaMeRrjetin();
  return <form action={action} className="edit-form">
    <h2>Ndrysho orën e udhëtimit tim</h2>
    <p>Udhëtimi #{id} · Ora aktuale në Neon: <strong data-testid="ora-aktuale">{oraAktuale}</strong></p>
    <input type="hidden" name="id" value={id} />
    <label htmlFor="ora">Ora e re</label>{" "}
    <input id="ora" name="ora" type="time" step={60} defaultValue={oraAktuale} aria-describedby="ora-ndihme" required disabled={!online} />{" "}
    <Ruaj online={online} />
    <p id="ora-ndihme">Përdor orën 24-orëshe, p.sh. 08:25. Serveri verifikon pronarin edhe nëse ID ndryshohet.</p>
  </form>;
}

function Ruaj({ online }: { online: boolean }) {
  const { pending } = useFormStatus();
  return <button className="button primary" type="submit" disabled={!online || pending}>
    {!online ? "Pa lidhje — ora nuk ruhet" : pending ? "Duke ruajtur…" : "Ruaj orën"}
  </button>;
}
