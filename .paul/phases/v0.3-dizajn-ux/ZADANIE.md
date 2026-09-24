# Zadanie v0.3 – Dizajn, UX a „domčeky pri mori“

**Zadal:** Ľubo (Lubko), 2026-09-24
**Pre koho:** Adelka – Lubkova priateľka. Appka ju má tešiť a baviť, nielen fungovať.
**Forma práce:** samostatná session venovaná dizajnu a UX/UI. Od Clauda sa na jej začiatku očakáva **vlastný návrh**, nie otázky naslepo.

---

## 1. Vyhľadávanie: predvolene len domčeky pri mori

Kontrola produkcie (24. 9.) ukázala, že výsledky pre provincie Catania, Caltanissetta a Bari sú prevažne z vnútrozemia (Caltanissetta, Mussomeli, Caltagirone, Paternò, Grumo Appula…). Portál vráti 50 najnovších ponúk z celej provincie a pobrežie sa medzi nimi stratí.

Požiadavky:
- **Predvolene** sa hľadá len v pobrežnom páse (domčeky pri mori).
- V nastaveniach je **checkbox „Hľadať aj vnútrozemie“**.
- Keď je zapnutý, dá sa nastaviť, **ako ďaleko od pobrežia** sa hľadá, alebo **všetko v danom regióne/provincii**.

Technické poznámky z predchádzajúcej session:
- Pobrežnú čiaru vieme odvodiť z existujúcich hraníc: úseky hraníc provincií, ktoré nezdieľa žiadna iná provincia, mínus štátne hranice (zoznam `FOREIGN_BORDER` v `scripts/build-italy-geo.mjs`).
- Pásy (napr. 2 / 5 / 10 / 20 km) je rozumné predpočítať v `npm run geo:build` (mapshaper / buffer), nie počítať za behu.
- Immobiliare hľadá presne v polygóne (`vrt`), takže mu stačí poslať prienik provincie a pobrežného pásu. Idealista hľadá v kruhu; výsledky sa aj tak filtrujú podľa polygónu v appke.
- Nastavenie by malo byť uložené na serveri (tabuľka `app_state`), aby platilo na mobile aj počítači a aby ho použil aj ranný cron.
- Úspora: 50 ponúk na beh sa nebude míňať na vnútrozemie. Aktuálne náklady sú ~0,35–0,4 USD/deň pri 4 provinciách.

## 2. Navigácia a nastavenia – hamburger menu

- Odkazy z hlavičky („Ponuky“, „Uložené“) presunúť do **hamburger menu**.
- V menu:
  - **Nastavenia vyhľadávania** (checkbox „Hľadať aj vnútrozemie“ + vzdialenosť / celý región),
  - **prepínač tmavého režimu**,
  - **odhlásenie** (teraz v appke chýba; cookie `adelka_session` treba zmazať a vrátiť sa na `/prihlasenie`).

## 3. Čo odstrániť

- **Kreslenie oblasti ťukaním (min. 3 body)** – nemá zmysel, regióny/provincie sú krajšie a ľahšie ovládateľné. Odstrániť tlačidlo „✏️ Nakresliť“ aj kód kreslenia (`drawing`, `draftPoints`, `DrawHandler`, `createArea` z kresby).

## 4. Dizajn, animácie a interaktivita

- Stavové hlášky pri sťahovaní ponúk („Sťahujem ponuky pre …“) sú **takmer neviditeľné** – musia byť výrazné, dobre viditeľné (napr. toast/overlay s animáciou a priebehom).
- Appka má byť **pekne animovaná a interaktívna**.
- Pred návrhom si **načítať skill dobrého dizajnu** (napr. frontend/UI design skill z Anthropic skills) a použiť návyky svetových dizajnérov (typografia, rytmus, farby, mikrointerakcie, stavy načítania, prázdne stavy, prístupnosť).
- **Tmavá verzia** appky (prepínač v hamburger menu, pamätá si voľbu; predvolene podľa systému).
- Mobil je primárny (Adelka používa hlavne telefón).

## 5. Značka a zábava

- **Logo** vygenerovať cez **Higgsfield** (MCP je dostupný) s textom **„La casetta di Adelka“** – napr. domček so srdiečkom / srdiečkový domček. Použiť v hlavičke, ako favicon a na prihlasovacej stránke.
- Názov appky v UI zmeniť z „Domček pri mori“ na „La casetta di Adelka“ (zvážiť aj v emailoch).
- **Vtipné prvky** – Adelka sa má pri appke baviť:
  - občas „vyskočí“ Lubkova fotka ako **„platená reklama“**, napr. aby klikla, že súhlasí s ďalšími reklamami, alebo že za to musí dať **pusu** – prípadne aj pikantnejšie žartovné výzvy v štýle, ktorý navrhol Lubko,
  - ďalšie hravé mikrotexty a prekvapenia (napr. v privítaní, pri uložení domčeka, v prázdnych stavoch).
- **Treba od Lubka:** jeho fotku (alebo viac fotiek) pre „reklamy“; potvrdiť tón humoru a ako často sa môžu reklamy ukazovať.

## Nálezy z kontroly produkcie (24. 9. 2026)

- Produkcia beží so zdrojom `apify`, 12 behov z Vercelu, všetky úspešné (50 inzerátov na portál).
- Vybrané provincie: Bari, Crotone, Caltanissetta, Catania.
- Crotone sa sťahovalo 2× (odznačenie a znovuoznačenie spustí nové sťahovanie).
- Či prebehla Supabase migrácia `20260924_privitanie.sql`, nebolo možné overiť (bez prístupu k DB).
