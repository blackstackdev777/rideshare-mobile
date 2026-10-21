import Link from "next/link";
import { notFound } from "next/navigation";
import { gjejUdhetimin } from "@/lib/udhetimet";
export default async function Detajet({ params }: { params: Promise<{ id: string }> }) {
 const { id } = await params;
 const u = gjejUdhetimin(id);
 if (!u) notFound();
 return <main><Link href="/" className="back">← Kthehu te lista</Link><section className="hero compact"><span className="eyebrow">DETAJET E UDHËTIMIT</span><h1>{u.nisja} <span>→ {u.destinacioni}</span></h1><p>Informacione mbi udhëtimin e zgjedhur.</p></section><div className="details"><div><span>Nisja</span><strong>{u.nisja}</strong></div><div><span>Destinacioni</span><strong>{u.destinacioni}</strong></div><div><span>Ora</span><strong>{u.ora}</strong></div><div><span>Vendtakimi</span><strong>{u.vendtakimi}</strong></div><div><span>Vende të lira</span><strong>{u.vende}</strong></div><div><span>Çmimi</span><strong>{u.cmimi}€</strong></div></div>{u.vende > 0 ? <Link href={`/udhetimi/${id}/kerkesa`} className="button primary wide">Kërko vend →</Link> : <button disabled className="button primary wide">Nuk ka vende të lira</button>}<p className="note">Ky është demonstrim, jo rezervim real.</p></main>;
}
