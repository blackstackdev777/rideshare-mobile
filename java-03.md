# Java 03 — RideShare: Komponentët dhe App Router

**Lënda:** Programimi për Pajisje Mobile (2026/2027)  
**Studenti:** Edi Terholli  
**Repository:** https://github.com/blackstackdev777/rideshare-mobile

## Çfarë u ndërtua
- Next.js me App Router në dosjen `aplikacioni/`.
- Tri karta të krijuara nga një grup i vetëm të dhënash fiktive.
- Komponenti i ripërdorshëm `KartaUdhetimi.tsx`.
- Faqe e veçantë për çdo udhëtim (`/udhetimi/[id]`).
- Ekrani demonstrues i kërkesës (`/udhetimi/[id]/kerkesa`), pa regjistrim rezervimi.
- Mesazh për udhëtime me zero vende dhe trajtim i ID-ve të panjohura.

## Prova 1 — Lista në telefon
**Si të provohet:** Nise aplikacionin, hap `/` në Chrome dhe aktivizo Device Toolbar (375px).  
**Rezultati:** [SHKRUANI REZULTATIN PAS TESTIMIT: tri karta / pa scroll horizontal / problem nëse ka].

## Prova 2 — Detajet, zero vende dhe ID e panjohur
**Si të provohet:** Kliko kartën 2 dhe kontrollo vendtakimin; hap `/udhetimi/3` dhe `/udhetimi/99`.  
**Rezultati:** [SHKRUANI REZULTATIN PAS TESTIMIT: vendtakimi / butoni i çaktivizuar / 404].

## Prova 3 — Kërkesa demonstrative dhe kthimi
**Si të provohet:** Te udhëtimi 2 kliko `Kërko vend`; pastaj kthehu te detajet dhe lista.  
**Rezultati:** [SHKRUANI REZULTATIN PAS TESTIMIT: shfaqet 'Simulim: Në pritje' / lidhjet e kthimit].

**Shënim:** Provat e mësipërme janë udhëzime për testim, jo rezultate të verifikuara ende. Zëvendëso pjesët në kllapa me atë që ndodhi realisht para dorëzimit.
