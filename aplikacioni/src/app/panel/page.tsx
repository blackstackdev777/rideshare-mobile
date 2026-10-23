import Link from "next/link";
import Hyrja from "@/components/Hyrja";
import FormaOres from "@/components/FormaOres";
import { hyrjaKonfiguruar } from "@/lib/auth";
import { profiliIm, lexoUdhetiminTim } from "@/lib/lejet";
import { ruajOren } from "./actions";

export const dynamic = "force-dynamic";
const mesazhet: Record<string, string> = {
  hyr: "Hyr në llogari para se të ndryshosh udhëtimin.",
  ndaluar: "Nuk ke leje për këtë udhëtim. Ora nuk ndryshoi.",
  fushe: "Shkruaj një orë të vlefshme, p.sh. 08:25. ID duhet të jetë 1, 2 ose 3.",
  ruajtur: "Ora u ruajt me sukses në Neon. Ora aktuale shfaqet më poshtë.",
  databaza: "Ruajtja nuk u konfirmua për shkak të një gabimi të databazës. Rifresko orën aktuale para se të provosh përsëri.",
  verifikimi: "Databaza nuk konfirmoi orën e kërkuar. Kontrollo orën aktuale më poshtë dhe provo përsëri.",
};

export default async function Panel({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const configured = hyrjaKonfiguruar();
  let p = null;
  let udhetimi = null;
  let gabim = false;
  try {
    p = await profiliIm();
    if (p?.roli === "shofer") udhetimi = await lexoUdhetiminTim("2", p);
  } catch { gabim = true; }
  return <main>
    <Link href="/" className="back">← Kthehu te udhëtimet</Link>
    <section className="hero compact"><span className="eyebrow">HYRJA DHE LEJET</span><h1>Paneli im</h1></section>
    {m && Object.hasOwn(mesazhet, m) && <p className={`panel-feedback ${m === "ruajtur" ? "success" : "failure"}`} role={m === "ruajtur" ? "status" : "alert"}>{mesazhet[m]}</p>}
    {!configured && <p role="alert">Hyrja me GitHub ende nuk është konfiguruar në server. Plotëso konfigurimin privat sipas java-05.md.</p>}
    {gabim && <p role="alert">Profili ose ora aktuale nuk mund të lexohet nga databaza. <Link href="/panel">Rifresko dhe provo përsëri</Link></p>}
    {!p ? <p>Lista është publike. Për panelin hyr me llogarinë tënde GitHub.</p> : <>
      <p>Përshëndetje, {p.emri}. Roli: <strong>{p.roli}</strong>.</p>
      <p>ID ime GitHub: <code>{p.id}</code></p>
    </>}
    <Hyrja brenda={Boolean(p) || gabim} konfiguruar={configured} />
    {udhetimi ? <FormaOres key={`${udhetimi.id}:${udhetimi.ora}`} action={ruajOren} id={udhetimi.id} oraAktuale={udhetimi.ora} />
      : p?.roli === "shofer" ? !gabim && <p role="alert">Udhëtimi 2 nuk është i caktuar për këtë llogari si shofer. Nuk mund ta ndryshosh orën.</p>
      : p && <p>Si udhëtar mund të shohësh udhëtimet; nuk mund të ndryshosh orën e shoferit.</p>}
    <p className="muted">Kërkesa për vend mbetet simulim. Sesioni zgjat deri në dy orë.</p>
  </main>;
}
