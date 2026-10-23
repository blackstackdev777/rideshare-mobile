"use client";

import Link from "next/link";

export default function Gabim() {
  return (
    <main>
      <div className="status-box" role="alert">
        <div className="status-icon" aria-hidden="true">!</div>
        <h1>Udhëtimet nuk mund të ngarkohen</h1>
        <p>Ndodhi një problem gjatë lidhjes me bazën e të dhënave. Provo përsëri pas pak.</p>
        <button className="button primary" onClick={() => window.location.reload()}>
          Provo përsëri
        </button>
        <p><Link className="back" href="/">Kthehu te lista</Link></p>
      </div>
    </main>
  );
}
