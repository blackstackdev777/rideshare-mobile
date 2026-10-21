import Link from "next/link";
export default function NotFound() { return <main><div className="status-box"><div className="status-icon">?</div><h1>Udhëtimi nuk u gjet</h1><p>Kjo adresë nuk përputhet me asnjë udhëtim në listë.</p><Link className="button primary" href="/">Kthehu te lista</Link></div></main>; }
