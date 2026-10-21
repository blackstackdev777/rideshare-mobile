import { KartaUdhetimi } from "@/components/KartaUdhetimi";
import { udhetimet } from "@/lib/udhetimet";
export default function Home() {
 return <main><section className="hero"><span className="eyebrow">TRANSPORTI STUDENTOR</span><h1>Udhëto bashkë.<br/><span>Kurse më shumë.</span></h1><p>Zgjidh një udhëtim drejt Kolegjit AAB. Për Javën 3, të gjitha udhëtimet janë demonstrative.</p></section><section><div className="section-title"><h2>Udhëtimet e disponueshme</h2><span>3 udhëtime</span></div><div className="trips">{udhetimet.map(u => <KartaUdhetimi key={u.id} udhetim={u} />)}</div></section></main>;
}
