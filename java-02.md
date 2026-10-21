# JAVA 02 — RideShare: Nga ideja te plani

**Lënda:** Programimi për Pajisje Mobile (2026/2027) — Kolegji AAB  
**Studenti:** Edi Terholli  
**ID:** RE-30087/24  
**Data e javës:** 24 shtator 2026  
**Projekti i ushtrimeve:** AAB RideShare  
**Statusi:** Plan dhe skicë e përgatitur; testimi në seksionin 8 është simulim orientues, jo provë me koleg real.

## 1. Problemi real
Studentët që udhëtojnë drejt Kolegjit AAB shpesh nuk e dinë cilët kolegë udhëtojnë në të njëjtin drejtim dhe në të njëjtën orë. Për shembull, Arta ka nevojë për udhëtim në AAB, ndërsa Dreni ka dy vende të lira në veturë. Pa një platformë të përbashkët, koordinimi bëhet përmes mesazheve dhe shpesh është i paqartë.

## 2. Përdoruesit
- **Udhëtari (Arta):** dëshiron të gjejë një udhëtim, të shohë orën, pikën e takimit dhe të kërkojë një vend.
- **Shoferi (Dreni):** dëshiron të paraqesë udhëtimin e vet dhe të pranojë ose refuzojë kërkesën.

## 3. Hipoteza e vlerës
Nëse udhëtari i sheh udhëtimet e disponueshme dhe kërkon vend nga telefoni në disa hapa, atëherë koordinimi mes studentëve do të jetë më i qartë. Kjo është hipotezë për testim, jo rezultat i matur.

## 4. Tri funksionet e MVP-së
1. **Lista e udhëtimeve:** shfaq destinacionin, nisjen, orën dhe vendet e lira.
2. **Detajet e udhëtimit:** shfaq informacionin e udhëtimit dhe butonin “Kërko një vend”.
3. **Kërkesa në pritje:** pas dërgimit, shfaq mesazhin “Kërkesa u dërgua — prit konfirmimin e shoferit”. Kërkesa nuk është rezervim i konfirmuar.

## 5. Jashtë MVP-së
Pagesat online, hartat live, vlerësimet e shoferëve, njoftimet push dhe konfirmimi automatik i një vendi.

## 6. Rrjedha kryesore e përdoruesit
1. Arta hap listën e udhëtimeve.
2. Sheh udhëtimin e Drenit me dy vende të lira.
3. Hap detajet dhe kontrollon orën e pikën e takimit.
4. Shtyp “Kërko një vend”.
5. Sheh statusin “Në pritje”; Dreni duhet ta konfirmojë më vonë.

## 7. Tri ekranet
- **Ekrani 1 — Udhëtimet:** kartë “Prishtinë → AAB”, nisja 08:00, 2 vende, “Shiko”.
- **Ekrani 2 — Detajet:** nisja, ora, vendet, pika e takimit “Biblioteka” dhe “Kërko një vend”.
- **Ekrani 3 — Në pritje:** konfirmim i dërgimit të kërkesës; qartësohet se miratimi nga shoferi nuk është dhënë ende.

Skica shoqëruese: [`skica.png`](./skica.png). Skica është koncept vizual në gjuhën shqipe; veçoritë shtesë të paraqitura në figurë nuk janë zotim për MVP-në e kësaj jave.

## 8. Simulim i testimit të përdorshmërisë (jo test me koleg real)

**Shënim metodologjik:** Meqë nuk është realizuar një test me koleg, skenari më poshtë është një **simulim hipotetik** i sjelljes së një studenti. Nuk paraqitet si intervistë, vëzhgim apo provë e kryer realisht. Nëse profesori kërkon test fizik me koleg, ky simulim nuk e zëvendëson atë kërkesë.

- **Profili i simuluar:** Student i AAB-së që udhëton çdo ditë për në kampus dhe përdor telefonin për të gjetur transport.
- **Detyra:** “Gjej udhëtimin Prishtinë → AAB në orën 08:00 dhe kërko një vend pa udhëzime”.
- **Skenari i supozuar:** Studenti hap listën, gjen kartën “Prishtinë → AAB”, prek “Shiko”, kontrollon detajet dhe shtyp “Kërko një vend”. Në ekran shfaqet statusi “Në pritje”.
- **Pengesë e mundshme:** Nëse numri i vendeve të lira është pak i dukshëm, studenti mund të mos jetë i sigurt nëse udhëtimi ka vend.
- **Përmirësim i propozuar:** Të shfaqet qartë “2 vende të lira” në kartën e listës dhe të përdoret butoni “Kërko një vend”, jo thjesht “Vazhdo”.
- **Rezultati:** Nuk ka rezultat empirik, sepse kjo është vetëm analizë hipotetike e skicës.

**Për testim real më vonë:** Jepja skicën një studenti pa i treguar rrugën dhe shëno nëse arrin te ekrani “Në pritje”, ku heziton dhe çfarë ndryshimi propozon.

## 9. Kriteret e pranimit
- Udhëtari e kupton nga lista cilat udhëtime kanë vende të lira.
- Nga lista mund të kalojë te detajet e udhëtimit.
- Butoni “Kërko një vend” çon në ekranin e statusit “Në pritje”.
- Teksti i statusit nuk pretendon se vendi është rezervuar automatikisht.

**Shënim:** Ky është dokument planifikimi. Këto kritere nuk janë testuar ende në një aplikacion funksional.
