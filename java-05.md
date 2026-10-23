# Java 05 — RideShare AAB: Verifikimi përfundimtar i lejeve

**Data:** 23 tetor 2026, Europe/Budapest\
**Koha e verifikimit të fundit:** 22 tetor 2026, 23:04:36 UTC / 23 tetor, 01:04:36 CEST\
**Burimi:** [Udhëzimi zyrtar i Javës 5](https://arbenl.github.io/lendet/2026-2027/mobile/java-05/ushtrimet.html)\
**Statusi:** Verifikimi automatik i refuzimit për ID 1 u përsërit dhe kaloi. SELECT-et reale në Neon konfirmojnë ID 1 = **08:00**, ID 2 = **08:25**, pronarë të ndryshëm dhe zero rreshta të autorizuar për kërkesën ndërmjet pronarëve. OAuth dhe ruajtja reale e ID 2 janë konfirmuar nga përdoruesi. **Përdoruesi ka konfirmuar gjithashtu se provat offline të Javës 6 në browser u kryen me sukses.** Ky rezultat i browser-it është dëshmi e përdoruesit, jo ekzekutim nga agjenti.

## Zbatimi dhe ruajtja e sigurisë

U ruajt projekti ekzistues, NextAuth 4.24.15, sesioni JWT dyorësh dhe konfigurimi privat. Identiteti vjen nga getServerSession/token.sub; roli lexohet nga profilet në Neon. Fusha e formularit nuk mund të caktojë identitet ose rol.

Leximi i formularit dhe UPDATE kërkojnë që shofer_id të përputhet me identitetin e sesionit dhe roli aktual në databazë të jetë shofer. UPDATE përdor parametra, kontrollon ID 1–3 dhe HH:mm, dhe kthen id/ora. Suksesi pranohet vetëm kur PostgreSQL kthen orën e kërkuar. Formulari shfaq orën e lexuar nga serveri, jo më vlerën fikse 08:15.

Në këtë verifikim nuk u ndryshua kodi i aplikacionit, autentikimi, pronësia, konfigurimi privat ose ndonjë rekord real. Testet ekzistuese u ekzekutuan përsëri; këtë herë u përditësuan vetëm raportet. Konfigurimi privat kontrollohet me hash dhe nuk afishohen vlera sekrete. Nuk u bë stage, commit ose push.

## Tri provat e Javës 5

| Prova | Rezultati i dokumentuar | Kufiri i provës |
| --- | --- | --- |
| 1. Hyrja / sesioni | Përdoruesi konfirmoi hyrjen reale me GitHub. Testet HTTP të prodhimit kaluan për sesion të vlefshëm, mungesë/skadim/falsifikim cookie-je, CSRF dhe logout | Agjenti nuk e përsëriti OAuth-in real në browser; sesionet automatike janë vetëm për serverin e izoluar të testimit |
| 2. Ruajtja ID 2 në 08:25 | Përdoruesi konfirmoi ruajtjen reale. SELECT-i i pavarur në Neon e konfirmoi **08:25:00** para dhe pas testit të sigurisë | Në këtë auditim nuk u dërgua UPDATE në Neon dhe nuk u ndryshua përsëri ora |
| 3. Refuzimi i ID 1 | Testi i vërtetë HTTP/Server Action në build prodhimi u autentikua si shoferi i ID 2, provoi ID 1 → 08:25 dhe mori **HTTP 303 → /panel?m=ndaluar**. GET i faqes së refuzimit ishte 200 dhe shfaqi mesazhin shqip me role=alert | Transporti SQL dhe rekordet e testit janë fixture në memorie; nuk është POST me cookie-n reale të përdoruesit kundër Neon |

Mesazhi i saktë i refuzimit: **Nuk ke leje për këtë udhëtim. Ora nuk ndryshoi.**

Pas kërkesës së refuzuar, testi krahasoi të gjitha fushat e të gjitha udhëtimeve me gjendjen para kërkesës: identike, përfshirë pronarët. ID 1 mbeti 08:00 dhe ID 2 mbeti 08:25. Fushat e falsifikuara të pronarit/rolit në formular nuk zëvendësuan identitetin e sesionit. Faqja e refuzimit nuk shfaqi mesazh suksesi.

Autentikimi nuk u çaktivizua. Testi përdor një çelës rastësor dhe cookie të vlefshme vetëm për procesin e izoluar; getServerSession dhe validimi i sesionit ekzekutohen normalisht. Sekretet/cookie-t e përdoruesit real nuk u përdorën për krijimin e ndonjë sesioni testimi.

## Verifikimi real në Neon — vetëm SELECT

| ID | Ora e verifikuar në Neon | Pronësia ndaj shoferit të ID 2 |
| --- | --- | --- |
| 1 | 08:00:00 | false — shofer tjetër |
| 2 | 08:25:00 | true — profil me rol shofer |

Një SELECT shtesë ekzekutoi kushtet e pronarit/rolit të UPDATE për ID 1 duke përdorur pronarin e ID 2: **0 rreshta përputheshin** në PostgreSQL real. Nuk ishte UPDATE dhe nuk mund ta ndryshonte ID 1. Ky kontroll nuk pretendon të lexojë sesionin e browser-it; identiteti i pronarit merret nga rekordet vetëm për provën e predikatit SQL.

## Komandat e ekzekutuara

Nga aplikacioni/:

| Komanda | Rezultati |
| --- | --- |
| Build prodhimi | Build-i i suksesshëm ekzistues u ripërdor; burimet nuk janë ndryshuar pas tij. Nuk u pretendua një build i ri në këtë kalim dokumentimi |
| npm.cmd run typecheck | Kaloi, exit 0 |
| npm.cmd run lint | Kaloi, exit 0 |
| npm.cmd test | Kaloi, exit 0: test:data, test:pwa, test:auth dhe test:network; përfshin refuzimin me emrat legacy dhe AUTH_* |
| npm.cmd run test:production | Kaloi, exit 0: 16 përgjigje faqesh dhe 10 asete CSS/JS, plus JSON publik/panel anonim me SELECT real në Neon |
| npm.cmd run verify:week5-data | Kaloi me leje rrjeti; vetëm SELECT, orët 08:00/08:25 dhe predikati i refuzimit me zero rreshta |

Për ta riprodhuar kontrollin automatik, ndal serverin RideShare përpara build-it; pastaj ekzekuto build, test:auth dhe verify:week5-data. Mos përdor dev/start mbi të njëjtën .next gjatë ndërtimit.

## Dëshmia e browser-it për Javën 6 dhe dorëzimi

Përdoruesi deklaroi: **“Week 6 browser offline tests have also been performed successfully.”** Provat e browser-it regjistrohen si të përfunduara me sukses sipas këtij konfirmimi. Nuk u dhanë emri/versioni i browser-it, fotografi, vlera të sakta timestamp-i, matje 375px ose një procesverbal për çdo hap. Këto hollësi nuk u shpikën dhe agjenti nuk pretendon se e përsëriti demonstrimin.

Shih [java-06.md](./java-06.md) dhe [seksionin 10 të raportit](./WEEK_5_6_IMPLEMENTATION_REPORT.md#10-submission-readiness-and-user-provided-browser-evidence--23-october-2026) për provat e funksionimit. Skedarët e kërkuar janë të pranishëm; commit, push dhe dorëzimi në GitHub mbeten të pakryera sipas udhëzimit të përdoruesit.

## Përgatitja për GitHub — 23 tetor 2026

Problemi i Git me next-env.d.ts u korrigjua: skedari i gjeneruar mbeti lokalisht i pandryshuar, u shtua në .gitignore dhe u hoq vetëm nga indeksi me git rm --cached. Vetëm kjo heqje është staged; nuk u fshi kod ose punë universitare. README tani përmban udhëzimet e nisjes, OAuth-it dhe testeve. SUBMISSION_FILES.txt përcakton 54 skedarët për shtimin e mëvonshëm; dry run i Git kaloi pa i shtuar ata në indeks.

Typecheck dhe lint kaluan përsëri pas përgatitjes. Provat e autorizimit dhe SELECT-et në tabelat më sipër janë rezultate të verifikimit të mëparshëm, jo prova të reja me kredenciale të rrotulluara. Rrotullimi i tri kredencialeve të raportuara si të ekspozuara dhe verifikimi pas tij mbeten në pritje të përdoruesit. Nuk u ndryshuan kredenciale ose rekorde Neon dhe nuk u përsërit OAuth në browser. Shih [auditimin aktual](./FINAL_SUBMISSION_AUDIT.md#10-current-submission-preparation--23-october-2026).

**Përditësimi i fundit për staging:** Skedarët e verifikuar të SUBMISSION_FILES.txt dhe heqja vetëm nga indeksi e next-env.d.ts janë staged. Build, typecheck, lint, testet automatike dhe kontrollet reale SELECT/HTTP kaluan përsëri; nuk u ndryshuan rekorde ose kredenciale. Konfirmimi i revokimit të sekreteve të vjetra dhe miratimi për commit/push mbeten në pritje. Statusi aktual dokumentohet në [auditimin final të staging](./FINAL_SUBMISSION_AUDIT.md#11-final-staged-submission-review--23-october-2026).
