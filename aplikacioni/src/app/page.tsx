import { KartaUdhetimi } from "@/components/KartaUdhetimi";
import { lexoUdhetimet } from "@/lib/udhetimet";

export const dynamic = "force-dynamic";

export default async function Home() {
  const udhetimet = await lexoUdhetimet();

  return (
    <main>
      <section className="hero">
        <span className="eyebrow">TRANSPORTI STUDENTOR</span>
        <h1>Udhëto bashkë.<br /><span>Kurse më shumë.</span></h1>
        <p>Zgjidh një udhëtim drejt Kolegjit AAB. Udhëtimet lexohen nga PostgreSQL; kërkesa për vend mbetet demonstrim.</p>
      </section>
      <section>
        <div className="section-title">
          <h2>Udhëtimet e disponueshme</h2>
          <span>{udhetimet.length} {udhetimet.length === 1 ? "udhëtim" : "udhëtime"}</span>
        </div>
        {udhetimet.length > 0 ? (
          <div className="trips">
            {udhetimet.map((u) => <KartaUdhetimi key={u.id} udhetim={u} />)}
          </div>
        ) : (
          <div className="status-box" role="status">
            <h2>Nuk ka udhëtime për momentin</h2>
            <p>Lista është bosh. Provo përsëri më vonë.</p>
          </div>
        )}
      </section>
    </main>
  );
}
