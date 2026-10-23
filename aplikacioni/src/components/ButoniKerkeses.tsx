"use client";

import Link from "next/link";
import { useLidhjaMeRrjetin } from "@/lib/rrjeti";

export function ButoniKerkeses({ href }: { href: string }) {
  const neRrjet = useLidhjaMeRrjetin();

  if (!neRrjet) {
    return (
      <button disabled className="button primary wide">
        Pa lidhje — kërkesa nuk dërgohet
      </button>
    );
  }

  return <Link href={href} className="button primary wide">Kërko vend →</Link>;
}
