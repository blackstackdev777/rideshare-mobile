import Link from "next/link";
import type { Udhetim } from "@/lib/udhetimet";

export function KartaUdhetimi({ udhetim }: { udhetim: Udhetim }) {
  return (
    <article className="card">
      <div className="card-top"><span className="pill">Udhëtim #{udhetim.id}</span><strong className="price">{udhetim.cmimi}€</strong></div>
      <h2>{udhetim.nisja} <span className="arrow">→</span> {udhetim.destinacioni}</h2>
      <p className="muted">Ora e nisjes: <strong>{udhetim.ora}</strong></p>
      <div className="card-bottom"><span className={udhetim.vende ? "available" : "unavailable"}>{udhetim.vende ? `${udhetim.vende} vende të lira` : "Nuk ka vende të lira"}</span><Link className="button secondary" href={`/udhetimi/${udhetim.id}`}>Detajet →</Link></div>
    </article>
  );
}
