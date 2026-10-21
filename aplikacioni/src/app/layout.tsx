import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
export const metadata: Metadata = { title: "RideShare AAB", description: "Udhëtime studentore — projekt demonstrues" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="sq"><body><header className="topbar"><Link href="/" className="brand"><span className="logo">R</span> RideShare <span className="aab">AAB</span></Link><span className="demo-label">DEMO · Java 3</span></header>{children}<footer>Projekt edukativ · Të dhëna fiktive · Nuk kryhen rezervime reale</footer></body></html>;
}
