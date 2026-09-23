# Adelka Home Finder — Špecifikácia projektu (v1.1)

**Repozitár:** https://github.com/orszagh/adelka-home-finder.git
**Doména (cieľová):** adel.orszagh.online (subdoména orszagh.online; Webglobe zatiaľ len registrátor/DNS, presmerovanie na Vercel ešte neprebehlo)
**Autor:** Ľubomír Országh
**Vytvorené:** august 2026 · **Aktualizované:** september 2026
**Stav infraštruktúry:** Vercel projekt aktívny, Supabase databáza s Row Level Security vytvorená, env premenné nastavené — pripravené na štart Fázy 1 v Claude Code.

---

## 1. Problém a cieľ

Adelka hľadá vhodný domček pri mori v Taliansku, ale manuálne prehľadávanie realitných portálov (Immobiliare.it, Idealista.it) je zdĺhavé, neprehľadné a nové ponuky ľahko unikajú pozornosti. Chýba jednoduchý spôsob, ako mať na jednom mieste mapu, filtrovanú ponuku, kontext o lokalite (infraštruktúra, počasie, riziká) a možnosť rýchlo reagovať na zaujímavý inzerát.

**Cieľ appky:** Jedno miesto — jednoduché na ovládanie, sofistikované na pozadí — kde si Adelka vyberie oblasť na mape, appka jej priebežne donáša relevantné ponuky, kontext o regióne a na jej pokyn pripraví/odošle komunikáciu s realitkou.

---

## 2. Ciele (Goals)

1. Adelka vie na interaktívnej mape nakresliť/vybrať oblasť záujmu pozdĺž talianskeho pobrežia.
2. Appka jej zobrazí existujúce ponuky v tejto oblasti s fotkami, cenou, základnými parametrami.
3. Appka ju upozorní (notifikácia) na nový inzerát alebo zmenu ceny do 24h od zverejnenia.
4. Appka vie ku každej lokalite/mestu dodať AI-sumarizovaný prehľad: infraštruktúra, dostupnosť, klimatické riziká, riziko spodnej vody, zaujímavosti.
5. Appka vie na jej výslovný pokyn pripraviť draft komunikácie s realitkou/predajcom — **nikdy neodosiela nič automaticky bez jej potvrdenia.**

## 3. Non-Goals (v1)

- **Automatické vyjednávanie/uzatváranie obchodu bez ľudského potvrdenia** — appka pripravuje, Adelka schvaľuje a odosiela. Právne a etické riziko autonómneho konania menom niekoho iného.
- **Vlastný scraper realitných portálov** — v1 rieši dátovú vrstvu cez komerčné API tretích strán (pozri sekciu 5), nie vlastný scraping (ToS riziko, nestabilita).
- **Podpora iných krajín/regiónov mimo Talianska** — možné v2, ale v1 sa zameriava len na taliansky trh.
- **Mobilná natívna appka (iOS/Android)** — v1 je responzívna webová appka, natívna appka je téma pre v2+.
- **Platobná/transakčná funkcionalita** (rezervačné poplatky a pod.) — appka je informačný a komunikačný nástroj, nie platobná brána.

---

## 4. Užívateľské príbehy

- Ako Adelka chcem na mape nakresliť oblasť pozdĺž pobrežia, aby som videla len ponuky, ktoré ma reálne zaujímajú.
- Ako Adelka chcem dostať notifikáciu, keď sa objaví nový dom v mojej oblasti, aby som nemusela portály kontrolovať manuálne.
- Ako Adelka chcem pri každom meste vidieť krátky prehľad (infraštruktúra, počasie, riziká), aby som vedela posúdiť lokalitu bez vlastného googlenia.
- Ako Adelka chcem appke povedať "napíš tejto realitke, že mám záujem a chcem obhliadku v septembri", aby appka pripravila draft správy, ktorý ja len skontrolujem a odošlem.
- Ako Adelka chcem vidieť fotky a dôležité detaily inzerátu priamo v appke, bez preklikávania na pôvodný portál.

---

## 5. Technická architektúra

### 5.1 Infraštruktúra — dôležité rozhodnutie

Doména **orszagh.online** zostáva registrovaná na **Webglobe** (len DNS správa). Samotná appka sa nasadzuje inde, keďže Webglobe shared hosting nepodporuje Node.js runtime ani serverless funkcie potrebné pre tento typ appky:

| Vrstva | Nástroj | Prečo |
|---|---|---|
| Frontend hosting | **Vercel** | natívna podpora Next.js, serverless funkcie, free tier stačí na MVP |
| Databáza | **Supabase** (Postgres) | free tier, auth, storage pre fotky, jednoduché API |
| Automatizácia / cron | **n8n** (cloud alebo self-host na malom VPS) | polling nových inzerátov, notifikácie — už poznáš z iných projektov |
| AI vrstva | **Claude API** | sumarizácia lokalít, príprava draftov správ |
| Dátový zdroj nehnuteľností | komerčné API (pozri 5.2) | Immobiliare.it/Idealista.it nemajú verejné API |

DNS na Webglobe len nasmeruješ (CNAME/A záznam) na Vercel podľa jeho inštrukcií — registrátor sa meniť nemusí.

**Konkrétne technologické rozhodnutia (aby Claude Code nemusel hádať/pýtať sa):**
- Framework: **Next.js (App Router), TypeScript**
- Styling: **Tailwind CSS**
- Mapa: **Leaflet + OpenStreetMap dlaždice** — zvolené namiesto Mapboxu, lebo nevyžaduje ďalší API kľúč a je zadarmo bez limitov pre tento rozsah. Dá sa neskôr vymeniť za Mapbox, ak bude treba lepší vizuál.
- Prístup k databáze: **všetky DB operácie (čítanie aj zápis) idú cez Next.js API routes / server actions** so `service_role` kľúčom, nikdy priamo z klienta cez `anon`/publishable kľúč. Zjednodušuje to bezpečnosť aj RLS policies pre v1 — keďže RLS je zapnuté bez definovaných policies, priamy prístup z frontendu by aj tak nič nevrátil.

### 5.2 Zdroj dát o nehnuteľnostiach

Immobiliare.it aj Idealista.it **nemajú verejné developerské API**. Reálne funkčné možnosti pre v1:

- Komerčné normalizované API tretích strán (napr. RealtyAPI, PropAPIS, Apify actors) — vracajú dáta z Immobiliare.it/Idealista.it v JSON, platené podľa počtu requestov.
- Pred výberom konkrétneho poskytovateľa treba overiť: cenu, limity, aktuálnosť dát, a licenčné podmienky (niektorí operujú v šedej zóne voči ToS portálov — toto over ako Open Question nižšie).

### 5.3 Databázová schéma (Supabase Postgres)

```sql
create table search_areas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  polygon jsonb not null, -- GeoJSON oblasti nakreslenej na mape
  created_at timestamptz default now()
);

create table properties (
  id uuid primary key default gen_random_uuid(),
  external_id text unique not null, -- ID z realitného API
  title text,
  price numeric,
  area_sqm numeric,
  rooms int,
  city text,
  region text,
  latitude double precision,
  longitude double precision,
  photos jsonb, -- pole URL fotiek
  listing_url text,
  source text, -- immobiliare / idealista
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now()
);

create table saved_listings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id),
  note text,
  saved_at timestamptz default now()
);

create table location_notes (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  region text,
  ai_summary text, -- AI-generovaný prehľad lokality
  infrastructure_notes text,
  climate_risk_notes text,
  groundwater_risk_notes text,
  generated_at timestamptz default now()
);
```

Aktuálny stav: Vercel projekt vytvorený a prepojený s GitHub repozitárom `adelka-home-finder`. Supabase projekt (región Frankfurt eu-central-1) je aktívny, vyššie uvedený SQL skript bol spustený s povoleným Row Level Security. Všetky tri env premenné (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) sú nastavené vo Vercel Environment Variables pre Production a Preview.

### 5.4 Komunikačný modul — bezpečnostný princíp

AI nikdy neodosiela správu realitke sama. Flow:
1. Adelka appke povie zámer ("mám záujem, chcem obhliadku v septembri").
2. Claude API pripraví draft emailu/správy.
3. Adelka draft vidí, upraví (ak chce) a **sama klikne odoslať**.

Toto platí pre v1 bez výnimky — automatizované odosielanie mien Adelky je mimo scope.

---

## 6. Požiadavky (Requirements)

### Must-Have (P0)
- [ ] Interaktívna mapa s možnosťou nakreslenia/výberu oblasti (Mapbox alebo Leaflet)
- [ ] Zobrazenie ponúk v oblasti s fotkami, cenou, plochou, počtom izieb
- [ ] Uloženie obľúbených/sledovaných inzerátov
- [ ] Notifikácia (email) pri novom inzeráte v sledovanej oblasti
- [ ] AI prehľad lokality (mesto/región) na vyžiadanie — infraštruktúra, dostupnosť, základné riziká
- [ ] Príprava draftu komunikácie s realitkou na pokyn, s explicitným potvrdením pred odoslaním
- [ ] Jednoduché, mobilne prívetivé rozhranie (Adelka nie je technická)

### Nice-to-Have (P1)
- [ ] Porovnanie viacerých inzerátov vedľa seba
- [ ] Push notifikácie (nielen email)
- [ ] Filter podľa rozpočtu, vzdialenosti od mora, roku výstavby
- [ ] História cenových zmien inzerátu

### Future Considerations (P2)
- [ ] Rozšírenie na ďalšie krajiny/regióny
- [ ] Natívna mobilná appka
- [ ] Automatizované plánovanie obhliadok cez kalendár

---

## 7. Otvorené otázky

- **[Právne/technické]** Ktorý poskytovateľ dát o nehnuteľnostiach (RealtyAPI/PropAPIS/iný) má najlepší pomer cena/kvalita/legálnosť pre tento účel? — treba porovnať pred v1 developmentom.
- **[Produkt]** Aký presný zdroj pre "riziko spodnej vody a počasia" v Taliansku použiť — talianske open data (napr. ISPRA), alebo komerčné weather/klimatické API?
- **[Produkt]** Má appka podporovať aj prenájom, alebo výlučne kúpu nehnuteľnosti?
- **[Náklady]** Aký mesačný rozpočet je akceptovateľný pre API volania (real estate dáta + Claude API)? Toto určí frekvenciu pollingu a limity.

---

## 8. Fázovanie (návrh)

**Fáza 1 — MVP (2–4 týždne pri part-time tempe):**
Mapa + zobrazenie ponúk (statický fetch cez komerčné API) + uloženie obľúbených. Bez notifikácií, bez AI komunikácie.

**Fáza 2 — Automatizácia:**
n8n polling + email notifikácie na nové inzeráty. AI prehľad lokality on-demand.

**Fáza 3 — Komunikačný modul:**
Draft generovanie správ cez Claude API s manuálnym schválením a odoslaním.

---

## 9. Stav a ďalší krok

**Infraštruktúra — hotovo:**
- [x] Vercel projekt založený, prepojený s GitHub repozitárom `adelka-home-finder`
- [x] Supabase databáza vytvorená (Frankfurt), 4 tabuľky, Row Level Security zapnuté
- [x] Environment variables nastavené vo Verceli (Production a Preview)
- [x] SQL schéma spustená

**Aktívny krok — Fáza 1 v Claude Code:**
Claude Code je pripojený na repozitár `https://github.com/orszagh/adelka-home-finder.git` a má za úlohu postaviť Next.js appku (mapa + zobrazenie ponúk) s mock/ukážkovými dátami — poskytovateľ reálnych dát o nehnuteľnostiach ešte nie je vybraný (pozri sekciu 7, Otvorené otázky).

**Paralelne, mimo Claude Code:**
1. Over si dátového poskytovateľa (RealtyAPI/PropAPIS/Apify) — free tier, pokrytie regiónu (Ligúria, Toskánsko, Apúlia — podľa toho, kde Adelka hľadá), cena, licenčné podmienky.
2. Keď bude appka funkčná na Vercel preview URL, nastav DNS na Webglobe pre `adel.orszagh.online` podľa presných inštrukcií z Vercel → Settings → Domains.
3. Po funkčnom MVP sa vráť sem do chatu na doladenie Fázy 2 a 3 (n8n automatizácia, AI komunikačný modul).

---

*Tento dokument je referenčný pre Claude Code pri implementácii — odovzdaj mu ho pri štarte nového projektu.*
