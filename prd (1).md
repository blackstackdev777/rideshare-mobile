# PRD (Product Requirements Document) — Anima Production

**Shkurtesat:** PWA (Progressive Web App – aplikacion web progresiv); PRD (Product Requirements Document – dokumenti i kërkesave të produktit); MVP (Minimum Viable Product – produkti minimal i përdorshëm).

**Kursi:** Programimi për Pajisje Mobile (2026/2027) • **Kolegji AAB**  
**Emri i projektit:** Anima Production — Mobile PWA (projekt individual)  
**Themeluesi / Ekipi:** Edi Terholli, RE-30087/24  
**Data & Versioni:** 21 tetor 2026 • Versioni 1.0 (Draft për MVP)

---

## 1. Përdoruesi dhe Problemi Real

- **Kush e përjeton problemin?** Çiftet që planifikojnë dasma, si dhe personat që kërkojnë fotosesione.
- **Kur ndodh?** Kur kërkojnë shërbime të fotografisë dhe videografisë, krahasojnë punimet dhe duan të pyesin për një datë konkrete.
- **Si e zgjidhin sot?** Kryesisht përmes mesazheve në rrjete sociale ose telefonatave, duke kërkuar informacione për shërbimet dhe disponueshmërinë.

## 2. Evidenca e Vëzhgimit — 3 Skenarë të Simuluar

**Shënim metodologjik:** Tre skenarët më poshtë janë **simulime hipotetike të bisedave** për fazën e planifikimit; nuk janë intervista reale, citate autentike ose të dhëna empirike. Anima Production PWA nuk është ende publikuar. Këto hipoteza duhen validuar më vonë me përdorues realë.

- **Simulimi 1 — Çift që planifikon dasmë:**  
  **Pyetje:** “Si do ta kërkonit një fotograf ose videograf për datën e dasmës?”  
  **Përgjigje e simuluar:** “Do të shikoja fillimisht punimet nga telefoni dhe pastaj do të doja të pyesja menjëherë nëse data ime është e lirë.”  
  **Nevoja e hipotezuar:** Punime të qarta dhe formular i shkurtër për kërkesë disponueshmërie.

- **Simulimi 2 — Person që dëshiron fotosesion:**  
  **Pyetje:** “Çfarë do t'ju ndihmonte gjatë zgjedhjes së një shërbimi fotosesioni?”  
  **Përgjigje e simuluar:** “Do të doja t'i shihja llojet e fotosesioneve dhe disa fotografi shembull pa kërkuar informacion në shumë faqe.”  
  **Nevoja e hipotezuar:** Prezantim i thjeshtë i shërbimeve dhe portofol i optimizuar për telefon.

- **Simulimi 3 — Përfaqësues i biznesit:**  
  **Pyetje:** “Si do të ishte më e lehtë të menaxhoheshin kërkesat e klientëve?”  
  **Përgjigje e simuluar:** “Do të ishte më praktike nëse çdo kërkesë do të përmbante shërbimin, datën dhe kontaktin, që të mund t'i përgjigjem klientit pa kërkuar disa herë detaje.”  
  **Nevoja e hipotezuar:** Formular me të dhëna të strukturuara dhe kontroll të fushave të detyrueshme.

## 3. Hipoteza e Vlerës

> **Nëse** ofrojmë një PWA mobile me punime të përzgjedhura, shërbime të qarta dhe formular të shkurtër për kërkesë disponueshmërie, **atëherë** klientët do të jenë në gjendje të paraqesin kërkesat më lehtë nga telefoni dhe biznesi do të marrë informacione më të strukturuara.

**Si do ta provojmë:** Në testimin e MVP-së, pesë testues do të përpiqen të gjejnë shërbimin dhe të dërgojnë një kërkesë pa ndihmë. Do të regjistrohet numri i përfundimeve të suksesshme dhe problemet e hasura. Ky është plan testimi, jo rezultat i arritur.

## 4. Rrjedha Kryesore e Përdoruesit (Core Flow – Max 5 Hapa)

1. **Hyrja:** Klienti hap aplikacionin PWA në telefon.
2. **Shfletimi:** Shikon shërbimet dhe punimet shembull.
3. **Përzgjedhja:** Zgjedh shërbimin që i intereson.
4. **Kërkesa:** Plotëson datën e dëshiruar dhe informacionin e kontaktit.
5. **Konfirmimi:** Merr mesazh në ekran se kërkesa është pranuar për shqyrtim, jo se rezervimi është konfirmuar.

## 5. Kufijtë e MVP-së (Scope Contract)

**BRENDA MVP-së (maksimumi 3 funksione):**

1. Shfaqja e shërbimeve dhe një përzgjedhjeje të vogël punimesh publike.
2. Formulari mobile për kërkesë disponueshmërie.
3. Shfaqja e statusit të dërgimit të kërkesës dhe informacionit të kontaktit.

**JASHTË MVP-së:** Pagesat online; rezervimi automatik pa miratimin e biznesit; galeri private për çdo çift; chat në kohë reale.

## 6. Kërkesat Funksionale

- **RF-01:** Përdoruesi mund të shohë shërbimet e Anima Production nga telefoni.
- **RF-02:** Përdoruesi mund të plotësojë dhe dërgojë një kërkesë me shërbimin, datën dhe kontaktin.
- **RF-03:** Formulari kontrollon fushat e detyrueshme dhe shfaq mesazh të qartë suksesi ose gabimi.

## 7. Kërkesat Jofunksionale

- Dizajn i përshtatshëm për ekranet mobile.
- Navigim i qartë dhe i përdorshëm me prekje.
- Lidhje HTTPS në mjedisin e publikuar; asnjë sekret apo e dhënë private në repository.
- Manifest dhe ikonë PWA, sipas kërkesave teknike të javëve të mëvonshme.
- Imazhe të optimizuara për të kufizuar kohën e ngarkimit.

## 8. Kriteret e Pranimit dhe Testimit

- Testuesi hap listën e shërbimeve në telefon.
- Dërgimi i formularit pa plotësuar fushat e detyrueshme shfaq gabim validimi.
- Dërgimi i suksesshëm shfaq konfirmimin e pranimit të kërkesës.
- **Statusi:** Teste të planifikuara, ende të pakryera.

## 9. Rreziqet dhe Supozimet

- Datat e lira mund të ndryshojnë: dërgimi i kërkesës nuk garanton rezervim.
- Fotot dhe videot mund të ngadalësojnë PWA-në: do të përdoren materiale të optimizuara.
- Duhet verifikuar e drejta për përdorimin e fotografive dhe trajtimi i të dhënave të kontaktit.
- Skenarët e simuluar mund të mos përfaqësojnë nevojat reale të klientëve; hipotezat do të kontrollohen në testime me njerëz realë.
