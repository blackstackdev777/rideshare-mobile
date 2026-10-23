import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { NjoftimiRrjetit } from "@/components/NjoftimiRrjetit";
import Pwa from "@/components/Pwa";
import "./globals.css";
export const metadata: Metadata = { title: "RideShare AAB", description: "Udhëtime studentore — projekt demonstrues" };
export const viewport: Viewport = { themeColor: "#367cf5" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="sq"><body><header className="topbar"><Link href="/" className="brand"><span className="logo">R</span> RideShare <span className="aab">AAB</span></Link><Link href="/panel" className="demo-label">Hyr / Paneli im</Link></header><NjoftimiRrjetit /><Pwa />{children}<footer>Projekt edukativ · PostgreSQL / Neon · Nuk kryhen rezervime reale</footer></body></html>;
}
