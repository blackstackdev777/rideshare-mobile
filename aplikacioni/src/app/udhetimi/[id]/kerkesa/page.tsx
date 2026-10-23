import Link from "next/link";
import { notFound } from "next/navigation";
import { gjejUdhetimin } from "@/lib/udhetimet";

export const dynamic = "force-dynamic";

export default async function Kerkesa({ params }: { params: Promise<{ id: string }> }) {
 const {id} = await params;
 const u = await gjejUdhetimin(id);
 if(!u) notFound();
 return <main><Link className="back" href={`/udhetimi/${id}`}>← Kthehu te detajet</Link><div className="status-box"><div className="status-icon">◷</div>{u.vende > 0 ? <><span className="eyebrow">KËRKESË DEMONSTRATIVE</span><h1>Simulim: Në pritje</h1><p>Kërkesa për rrugën {u.nisja} → {u.destinacioni} nuk është dërguar realisht te shoferi.</p></> : <><h1>Nuk ka vende të lira</h1><p>Nuk mund të kërkosh vend në këtë udhëtim.</p></>}<Link href="/" className="button primary">Kthehu te lista</Link></div></main>;
}
