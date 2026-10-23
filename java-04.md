# Java 04 — AAB RideShare: Lidhja me PostgreSQL / Neon

**Lënda:** Programimi për Pajisje Mobile (2026/2027) — Kolegji AAB\
**Studenti:** Edi Terholli\
**ID:** RE-30087/24\
**Data e verifikimit:** 22 tetor 2026\
**Repository:** https://github.com/blackstackdev777/rideshare-mobile\
**Statusi:** Kodi dhe dokumentimi janë përgatitur; Neon dhe shtresa e të dhënave janë testuar. Instalimi i plotë dhe verifikimi i aplikacionit mbeten të bllokuar nga hapësira në disk.

## 1. Objektivi dhe burimi i kërkesave

Qëllimi i Javës 4 është që aplikacioni ekzistues të lexojë udhëtimet nga PostgreSQL në Neon, në vend të grupit statik të Javës 3. Ruhen lista, detajet, simulimi i kërkesës për vend, gjuha shqipe dhe rrugët me ID 1, 2 dhe 3.

Në repository nuk u gjet një dokument zyrtar i profesorit për Javën 4. Ky raport mbështetet në kërkesat e dhëna për këtë detyrë dhe në aplikacionin ekzistues. Para dorëzimit duhet krahasuar me udhëzimin zyrtar të profesorit, veçanërisht nëse kërkohen fotografi ose demonstrim në klasë. Dokumentet e javëve të mëparshme nuk janë ndryshuar.

## 2. Analiza e aplikacionit ekzistues

Aplikacioni gjendet në `aplikacioni/` dhe përdor Next.js App Router, React dhe TypeScript me `strict: true`.

| Skedari / rruga | Gjendja e Javës 3 | Ndryshimi për Javën 4 |
| --- | --- | --- |
| `src/lib/udhetimet.ts` | Tri udhëtime statike; kërkim me `.find()` | Lexim asinkron me SQL në server |
| `src/app/page.tsx` — `/` | Lista dhe numri fiks 3 | Lista nga PostgreSQL dhe numërim dinamik |
| `src/components/KartaUdhetimi.tsx` | Prezantimi i udhëtimit të kaluar si prop | Ruhet pa ndryshim |
| `src/app/udhetimi/[id]/page.tsx` | Detajet nga grupi statik | Kërkim i parametrizuar sipas ID-së |
| `src/app/udhetimi/[id]/kerkesa/page.tsx` | Simulim pa regjistrim rezervimi | Lexon gjendjen aktuale të vendeve nga PostgreSQL |
| `src/app/udhetimi/[id]/not-found.tsx` | Mesazh për ID të panjohur | Ruhet pa ndryshim |
| `src/app/error.tsx` | Nuk ekzistonte | Mesazh i përgjithshëm gabimi dhe rifreskim |

Nuk u shtuan pagesa, autentikim, API publike ose regjistrim kërkesash. Kërkesa vazhdon të jetë **simulim**, jo rezervim i ruajtur dhe jo mesazh i dërguar shoferit.

## 3. Teknologjitë dhe konfigurimi

- Next.js 15, React 19 dhe TypeScript; ruhet struktura ekzistuese.
- PostgreSQL i hostuar në Neon.
- `@neondatabase/serverless` për SQL përmes HTTPS.
- `server-only` për të ndaluar importimin e modulit të bazës nga komponentë klienti.
- ESLint për kontrollin e kodit.
- Testet përdorin Node.js dhe `node:assert/strict`; nuk shtohet bibliotekë testimi.

`DATABASE_URL` ekziston lokalisht në `aplikacioni/.env.local`. Vlera nuk përfshihet në raport, kod ose fotografi. Next.js e lexon në server me `process.env.DATABASE_URL`; nuk përdoret prefiksi `NEXT_PUBLIC_` dhe nuk dërgohet te komponentët klientë.

Për një instalim të ri, përdoret `aplikacioni/.env.example` si model bosh dhe vendoset privatisht vlera reale në `.env.local`. Mos mbishkruaj `.env.local` ekzistues. Pas ndryshimit të konfigurimit të mjedisit, rinise serverin.

## 4. Struktura e bazës

Skema dhe të dhënat fillestare dokumentohen në [`schema.sql`](./schema.sql).

| Kolona | Tipi | Kufizimet / kuptimi |
| --- | --- | --- |
| `id` | `INTEGER` | Çelës primar; ruan ID-në e rrugës |
| `nisja` | `VARCHAR(100)` | `NOT NULL` |
| `destinacioni` | `VARCHAR(100)` | `NOT NULL` |
| `ora` | `TIME` | `NOT NULL`; ora lokale e nisjes |
| `cmimi` | `NUMERIC(6,2)` | `NOT NULL`; çmimi në euro |
| `vendet_e_lira` | `INTEGER` | `NOT NULL`, `CHECK (vendet_e_lira >= 0)` |

Leximi real gjatë testimit ktheu:

| ID | Nisja | Destinacioni | Ora | Çmimi | Vende të lira |
| --- | --- | --- | --- | --- | --- |
| 1 | Prishtinë | AAB | 08:00 | 2 € | 2 |
| 2 | Fushë Kosovë | AAB | 08:15 | 2 € | 1 |
| 3 | Lipjan | AAB | 07:45 | 3 € | 0 |

`schema.sql` përdor `CREATE TABLE IF NOT EXISTS` dhe `INSERT ... ON CONFLICT (id) DO NOTHING` brenda një transaksioni. Ekzekutimi përsëri nuk mbishkruan orët ose vendet ekzistuese. Skedari është dokumentim i përsëritshëm, jo migrim që korrigjon automatikisht një skemë tjetër. Nuk është ekzekutuar mbi bazën ekzistuese gjatë implementimit.

Skema nuk përmban `vendtakimi`. Për të ruajtur detajet e Javës 3, etiketat e vendtakimit për ID 1–3 mbeten metadata lokale në modulin e serverit. Një ID e re nga baza merr etiketën “Përcaktohet nga shoferi”. Kjo nuk krijon udhëtime rezervë: një udhëtim shfaqet vetëm nëse ekziston në PostgreSQL.

## 5. Si lexohen të dhënat në server

`lexoUdhetimet()` kryen një `SELECT` me kolonat e përcaktuara dhe `ORDER BY id`. `gjejUdhetimin(id)` kërkon vetëm rreshtin e ID-së përkatëse:

```ts
const rreshtat = await sql`
  SELECT id, nisja, destinacioni, ora, cmimi, vendet_e_lira
  FROM udhetimet
  WHERE id = ${Number(id)}
`;
```

Ky është një **tagged template** i drejtuesit Neon. Drejtuesi e dërgon ID-në si parametër `$1`, veçmas nga teksti SQL. Nuk përdoret bashkim vargjesh ose `unsafe()`. ID-të e pavlefshme, me zero në fillim, negative ose jashtë kufirit pozitiv të `INTEGER` refuzohen përpara lidhjes.

Konvertimi në tipin `Udhetim` ruan kontratën ekzistuese të komponentëve:

- `id` kthehet në `string` për rrugët ekzistuese.
- `ora` nga `HH:MM:SS` paraqitet si `HH:MM`; nuk bëhet konvertim zone kohore.
- `NUMERIC` konvertohet me `Number(...)` në çmim numerik.
- `vendet_e_lira` bëhet `vende: number`.

Të tri faqet përdorin `dynamic = "force-dynamic"`. Kërkesat e drejtuesit përdorin `cache: "no-store"` dhe afat 15 sekonda. Hapja ose rifreskimi i faqes lexon përsëri bazën; nuk nevojitet rindërtim i aplikacionit pas ndryshimit të orës në Neon. Nuk ka përditësim automatik në një faqe të lënë hapur.

`KartaUdhetimi.tsx` importon vetëm tipin me `import type`. Faqja e gabimit është komponent klienti dhe nuk importon modulin e bazës ose konfigurimin privat.

## 6. Lista bosh, udhëtimi që mungon dhe gabimet

Këto raste trajtohen veçmas:

1. **Query i suksesshëm me zero rreshta:** faqja kryesore shfaq “Nuk ka udhëtime për momentin” dhe numrin 0.
2. **ID pa rresht përkatës:** `gjejUdhetimin()` kthen `undefined`; faqja thërret `notFound()` dhe shfaq “Udhëtimi nuk u gjet”.
3. **Gabim lidhjeje, timeout ose konfigurim që mungon:** funksioni hedh një gabim me tekst të përgjithshëm. `error.tsx` shfaq “Udhëtimet nuk mund të ngarkohen” dhe butonin “Provo përsëri”, i cili rifreskon faqen.
4. **Zero vende:** udhëtimi mbetet i dukshëm, butoni “Kërko vend” te detajet është i çaktivizuar dhe hapja direkte e `/kerkesa` nuk shfaq kërkesë në pritje.

Gabimi origjinal i drejtuesit nuk afishohet dhe nuk shkruhet me `console.error(error)`. Nuk ruhet as si `cause` në gabimin e ri. Gabimi i PostgreSQL nuk zëvendësohet në heshtje me listë bosh ose të dhëna demonstrative.

## 7. Siguria

Rregullat `.gitignore` në rrënjë dhe në `aplikacioni/` përjashtojnë `.env`, `.env.local` dhe variantet private; vetëm modeli bosh `.env.example` lejohet. `git check-ignore` konfirmoi përjashtimin e `.env.local` dhe `.env.production`; `.env.local` nuk figuron te skedarët e ndjekur nga Git.

Testet e lidhjes kryejnë vetëm `SELECT`. Nuk u përdorën `DELETE`, `DROP`, `TRUNCATE`, reset ose rikrijim i bazës. Nuk u ndryshuan orët apo vendet e të dhënave reale gjatë testimit dhe nuk u bë push në GitHub.

## 8. Provat dhe rezultatet e verifikuara

**Mjedisi:** Windows PowerShell, Node.js 25.6.0, npm 11.8.0. Testi `test:data` kërkon mbështetjen e drejtpërdrejtë të TypeScript të Node.js 22.18+ ose 24+.

Instalimi fillestar u bllokua nga kufizimi i rrjetit të sandbox-it; pas lejimit të npm u shkarkuan paketat. Instalimi më pas hasi `ENOSPC` sepse disku C: kishte 0 MB të lirë. U pastruan vetëm skedarë të rigjenerueshëm të këtij instalimi në `aplikacioni/node_modules`, pa prekur dokumente ose projekte të tjera.

U krijua me sukses `package-lock.json` nga metadata e ruajtur nga npm (`npm install --package-lock-only --offline --ignore-scripts --no-audit --no-fund`). Kjo nuk barazohet me instalim të plotë. Edhe tentativa e pastër nga cache nuk përfundoi për shkak të hapësirës. Në fund u hoq vetëm pema e paplotë `node_modules` e krijuar gjatë këtyre tentativave. Për të vazhduar, liro të paktën 1 GB në C: dhe ekzekuto `npm ci`.

| Kontrolli | Rezultati i verifikuar |
| --- | --- |
| Lidhja me Neon: `npm run test:db` | **Kaloi** me leje rrjeti; PostgreSQL ktheu tri udhëtimet e tabelës më sipër |
| ID-të, drejtimet dhe tipi i kolonave | **Kaloi** për rreshtat realë |
| Udhëtimi 3 me zero vende | **Kaloi** në leximin real të bazës |
| Konvertimi i ID-së, orës, çmimit dhe vendeve: `npm run test:data` | **Kaloi** me përgjigje HTTP të kontrolluara vetëm në procesin e testit |
| SQL i parametrizuar dhe `no-store` | **Kaloi**; testi kontrolloi `$1` dhe parametrin e veçuar |
| Lista bosh dhe ID që mungon | **Kaloi** në shtresën e të dhënave, pa zbrazur bazën reale |
| ID e pavlefshme, SQL injection dhe tejkalim INTEGER | **Kaloi**; nuk u nis query |
| Gabim drejtuesi dhe `DATABASE_URL` që mungon | **Kaloi** në shtresën e të dhënave; mesazh i pastruar, pa të dhëna rezervë |
| `.env.local` i përjashtuar dhe i pandjekur nga Git | **Kaloi** |
| Sintaksa e tri skripteve: `node --check` | **Kaloi** |
| Përputhja e varësive të manifestit me lockfile-in | **Kaloi** |
| `git diff --check` dhe ruajtja e dokumenteve të mëparshme | **Kaloi**; nuk ka ndryshime në dokumentet e Javës 1–3 |
| Instalimi i plotë | **Nuk përfundoi**: `ENOSPC`; varësitë janë deklaruar dhe janë fiksuar në lockfile |
| TypeScript: `npm run typecheck` dhe ekzekutim i drejtpërdrejtë i `tsc` | **I bllokuar nga varësitë e paplota**: mungonin deklarimet e Next.js dhe më pas bibliotekat standarde të TypeScript; nuk raportohet si sukses |
| Lint: `npm run lint` dhe ekzekutim i drejtpërdrejtë i ESLint | Një kontroll i hershëm pati 0 gabime dhe 1 paralajmërim konfigurimi. Paralajmërimi u korrigjua, por kontrolli përfundimtar u **bllokua nga varësitë e paplota** (`acorn` / metadata e ESLint që mungonin); nuk raportohet si verifikim final i kaluar |
| Build: `npm run build` | **Nuk u përfundua**: instalimi nuk kishte krijuar komandën `next`; nuk ka build prodhimi të verifikuar |
| Lista, detajet, simulimi dhe 404 përmes HTTP | **Nuk u testuan në aplikacionin e nisur**: serveri nuk mund të nisej pa instalimin e plotë; skripti `test:routes` është përgatitur, jo raportuar si i kaluar |
| Mesazhi vizual i gabimit dhe lista bosh në shfletues | **Nuk u testuan vizualisht**; sjellja e modulit të të dhënave u verifikua veçmas |
| Layout në 375 px dhe klikimet e kthimit | **Të pakryera** për të njëjtën pengesë; CSS ekzistuese nuk u ndryshua |

Testet me përgjigje të kontrolluara nuk paraqiten si prova të leximit real të Neon. Për lidhjen reale përdoret veçmas `test:db`; `test:routes` krahason faqet HTTP me të dhënat aktuale të PostgreSQL.

Nuk është kryer ndryshim real i orës në Neon. Udhëzimi i seksionit 9 është provë manuale që duhet kryer para dorëzimit. Nuk ka fotografi ekrani të pretenduara si prova.

## 9. Si të ndryshohet ora në Neon

1. Hape projektin ekzistues në Neon dhe zgjidh degën dhe databazën që përdor konfigurimi lokal.
2. Te **SQL Editor**, lexo vlerën aktuale:

   ```sql
   SELECT id, nisja, destinacioni, ora
   FROM udhetimet
   WHERE id = 1;
   ```

3. Shëno orën origjinale. Për shembull, ndrysho vetëm udhëtimin 1:

   ```sql
   UPDATE udhetimet
   SET ora = TIME '08:30'
   WHERE id = 1
   RETURNING id, nisja, destinacioni, ora;
   ```

4. Rifresko `/` dhe `/udhetimi/1`; të dyja duhet të shfaqin `08:30`.
5. Nëse ky ishte vetëm test, rikthe orën që shënove dhe rifresko përsëri. Për të dhënat fillestare të kësaj detyre, ora origjinale është `08:00`.

Mos fotografo panelin e lidhjes, `.env.local`, fjalëkalimet ose adresën private të lidhjes. Fotografia e aplikacionit mund të përfshijë vetëm listën ose detajet e udhëtimit.

## 10. Komandat lokale

Në PowerShell, brenda dosjes së aplikacionit:

```powershell
Set-Location C:\Users\Lenovo\Documents\GitHub\rideshare-mobile\aplikacioni
npm.cmd install
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test:data
npm.cmd run test:db
npm.cmd run build
npm.cmd run start
```

Meqë `package-lock.json` tani ekziston, përdor `npm.cmd ci` në vend të `npm.cmd install` për instalim të riprodhueshëm. Instalimi i plotë duhet të përfundojë përpara komandave të tjera. Mesazhi `MODULE_TYPELESS_PACKAGE_JSON` gjatë `test:data` në Node.js 25 ishte paralajmërim interpretimi moduli; të gjitha pohimet e atij testi kaluan.

Mbaje serverin aktiv. Në një terminal të dytë, brenda `aplikacioni/`:

```powershell
npm.cmd run test:routes
```

Për zhvillim përdoret `npm.cmd run dev` dhe hapet `http://localhost:3000`. Për një port tjetër, për shembull: `npm.cmd run start -- --port 3004` dhe `npm.cmd run test:routes -- http://localhost:3004`.

`test:db` pret të dhënat e detyrës me ID 1–3 dhe udhëtimin 3 pa vende; orët lexohen dinamikisht. `test:routes` kontrollon listën, detajet, çmimet, vendet, kërkesat demonstrative dhe 404 për ID 99, tekst, tejkalim numerik dhe tentativë SQL injection. Ai nuk kryen klikime në shfletues dhe nuk ndryshon të dhëna.

## 11. Kontrolli manual dhe dorëzimi

- Liro hapësirën dhe përfundo `npm ci`, TypeScript, lint, build dhe `test:routes`; këto nuk duhen shënuar si të kaluara pa i ekzekutuar.
- Kontrollo listën dhe detajet në gjerësi 375 px dhe në telefon; sigurohu që nuk ka lëvizje horizontale.
- Ndiq lidhjen “Kërko vend” për ID 1 dhe 2, statusin “Simulim: Në pritje” dhe kthimin te detajet dhe lista.
- Hape ID 3 dhe `/udhetimi/3/kerkesa`; kontrollo mungesën e vendeve. Hape ID 99 dhe kontrollo mesazhin 404.
- Kryej ndryshimin e kontrolluar të orës nga seksioni 9 dhe shëno rezultatin real.
- Krahaso raportin me kërkesat zyrtare të profesorit dhe shto vetëm prova të kryera realisht.

Para commit-it, nga rrënja:

```powershell
git status --short
git diff --check
git check-ignore -v aplikacioni/.env.local
git ls-files -- aplikacioni/.env.local
```

Komanda e fundit duhet të mos kthejë skedar. Përfshi skedarët e kodit, testet, modelin bosh, `schema.sql`, `java-04.md` dhe lockfile-in kur instalimi të ketë përfunduar me sukses. Mos përfshi `node_modules/`, `.next/` ose mjedisin privat. Kontrollo `git diff --cached` përpara `git commit -m "Implemento Java 4: lidhja me Neon PostgreSQL"`. Push-i bëhet manualisht nga studenti në degën e zgjedhur.

### Skedarët e dorëzimit

**Të krijuar:** `.gitignore`, `schema.sql`, `java-04.md`, `aplikacioni/.env.example`, `aplikacioni/package-lock.json`, `aplikacioni/src/app/error.tsx`, `aplikacioni/scripts/test-database.mjs`, `aplikacioni/scripts/test-data.mjs`, `aplikacioni/scripts/test-routes.mjs`.

**Të ndryshuar:** `aplikacioni/.gitignore`, `aplikacioni/package.json`, `aplikacioni/eslint.config.mjs`, `aplikacioni/src/lib/udhetimet.ts`, `aplikacioni/src/app/page.tsx`, `aplikacioni/src/app/layout.tsx`, `aplikacioni/src/app/udhetimi/[id]/page.tsx`, `aplikacioni/src/app/udhetimi/[id]/kerkesa/page.tsx`.

Varësitë e reja të deklaruara janë `@neondatabase/serverless` 1.2.0 dhe `server-only` 0.0.1; lockfile-i regjistron versionet e sakta. Nuk janë ndryshuar dokumentet e Javës 1–3, komponenti i kartës, faqja `not-found` ose CSS.

## 12. Përfundimi

Burimi i udhëtimeve është zhvendosur në PostgreSQL me query vetëm në server dhe pa ndryshuar rrjedhën demonstrative të kërkesës. Lidhja reale me Neon dhe sjellja e shtresës së të dhënave janë verifikuar. Kontrollet e mbetura të aplikacionit dhe demonstrimi manual duhet të shënohen sipas rezultateve reale, pa i quajtur të përfunduara paraprakisht.

## Burime teknike zyrtare

- [Drejtuesi serverless i Neon](https://neon.com/docs/serverless/serverless-driver).
- [Konfigurimi i drejtuesit: parametrat SQL dhe fetchOptions](https://github.com/neondatabase/serverless/blob/main/CONFIG.md).
- [Next.js 15: konfigurimi force-dynamic](https://nextjs.org/docs/15/app/api-reference/file-conventions/route-segment-config).
- [Next.js: mbrojtja e moduleve me server-only](https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning).
- [Next.js 15: trajtimi i gabimeve dhe notFound](https://nextjs.org/docs/15/app/getting-started/error-handling).
- [Neon SQL Editor](https://neon.com/docs/get-started/query-with-neon-sql-editor).
