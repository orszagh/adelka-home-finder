# adelka-home-finder

## What This Is

Responzívna webová appka pre Adelku, ktorá hľadá domček pri mori v Taliansku. Na jednom mieste kombinuje interaktívnu mapu s nakreslenou oblasťou záujmu, ponuky nehnuteľností (fotky, cena, plocha, izby), sledované inzeráty, emailové upozornenia na nové ponuky a zmeny cien, AI prehľad lokality (infraštruktúra, dostupnosť, klimatické riziká, spodná voda) a AI prípravu draftu správy realitke, ktorý Adelka vždy sama skontroluje a odošle.

## Core Value

Adelka nájde vhodný domček pri talianskom mori z jedného jednoduchého miesta a nemusí manuálne prechádzať realitné portály ani googliť každú lokalitu.

## Current State

| Attribute | Value |
|-----------|-------|
| Type | Application |
| Version | 0.0.0 |
| Status | Initializing |
| Last Updated | 2026-09-23 |

**Production URLs:**
- adel.orszagh.online: cieľová doména (DNS na Webglobe ešte nie je presmerované na Vercel)

## Requirements

### Core Features

- Interaktívna mapa s nakreslením/výberom oblasti pozdĺž talianskeho pobrežia
- Zobrazenie ponúk v oblasti (fotky, cena, plocha, počet izieb) bez preklikávania na portál
- Uloženie obľúbených/sledovaných inzerátov
- Emailová notifikácia pri novom inzeráte alebo zmene ceny v sledovanej oblasti (do 24h)
- AI prehľad lokality na vyžiadanie (infraštruktúra, dostupnosť, riziká)
- AI draft komunikácie s realitkou, odoslanie výhradne po explicitnom potvrdení Adelkou

### Validated (Shipped)
None yet.

### Active (In Progress)
None yet.

### Planned (Next)
- Fáza 1: základ appky, mapa s oblasťami, zobrazenie ponúk (mock dáta), obľúbené
- Fáza 2: automatizácia (polling + email notifikácie) a AI prehľad lokality
- Fáza 3: komunikačný modul (AI draft správ, manuálne odoslanie)
- Fáza 4: produkčné nasadenie (ochrana prístupu, dokumentácia, doména)

### Nice-to-Have (P1)
- Porovnanie viacerých inzerátov vedľa seba
- Push notifikácie
- Filter podľa rozpočtu, vzdialenosti od mora, roku výstavby
- História cenových zmien inzerátu

### Out of Scope
- Automatické vyjednávanie/odosielanie správ bez potvrdenia Adelkou: právne a etické riziko
- Vlastný scraper realitných portálov: ToS riziko, nestabilita; dáta idú cez komerčné API
- Iné krajiny ako Taliansko: možno v2
- Natívna mobilná appka: v1 je responzívny web
- Platobná/transakčná funkcionalita

## Target Users

**Primary:** Adelka
- Netechnická používateľka, ovláda appku hlavne z mobilu
- Hľadá kúpu domčeka pri mori (Ligúria, Toskánsko, Apúlia)
- Potrebuje jednoduché UI, zložitosť má ostať na pozadí

## Context

**Business Context:**
Osobný projekt Ľubomíra Országha pre Adelku. Immobiliare.it ani Idealista.it nemajú verejné API.

**Technical Context:**
Vercel projekt je prepojený s GitHub repom `orszagh/adelka-home-finder`. Supabase (Frankfurt, eu-central-1) má 4 tabuľky (`search_areas`, `properties`, `saved_listings`, `location_notes`) so zapnutým RLS bez policies. Env premenné `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` sú vo Verceli (Production + Preview).

## Constraints

### Technical Constraints
- Všetky DB operácie iba cez serverové API routes / server actions so `service_role` kľúčom, nikdy z klienta
- DB schéma je už spustená v Supabase; zmeny schémy vyžadujú ručné spustenie SQL
- Webglobe hosting nepodporuje Node.js, appka beží na Verceli (Webglobe = len DNS)
- Poskytovateľ reálnych dát nie je vybraný, takže v1 beží na mock dátach za vymeniteľným rozhraním
- Vercel Hobby cron: max 1× denne

### Business Constraints
- Part-time tempo, free tiery (Vercel, Supabase)
- Mesačný rozpočet na API volania (realitné dáta + Claude API) zatiaľ neurčený

### Compliance Constraints
- AI nikdy neodosiela nič menom Adelky bez jej potvrdenia
- Licenčné podmienky dátového poskytovateľa treba overiť pred nasadením reálnych dát

## Key Decisions

| Decision | Rationale | Date | Status |
|----------|-----------|------|--------|
| Next.js (App Router) + TypeScript + Tailwind | Natívna podpora na Verceli | 2026-08 | Active |
| Leaflet + OpenStreetMap namiesto Mapboxu | Bez API kľúča, zadarmo | 2026-08 | Active |
| DB prístup len serverovo so service_role | RLS bez policies, jednoduchšia bezpečnosť | 2026-08 | Active |
| Komerčné API namiesto vlastného scrapera | ToS riziko a nestabilita scrapingu | 2026-08 | Active |
| PAUL namiesto SEED, import z PRD | PRD už pokrýva plánovanie | 2026-09-23 | Active |
| Dátový zdroj za rozhraním `PropertyProvider`, default mock | Poskytovateľ ešte nie je vybraný | 2026-09-23 | Active |

## Success Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Adelka vie nakresliť oblasť a vidí v nej ponuky | Funguje na mobile | - | Not started |
| Notifikácia o novom inzeráte / zmene ceny | Do 24h | - | Not started |
| AI prehľad lokality | Na jedno kliknutie | - | Not started |
| Draft správy realitke | Nikdy sa neodošle bez potvrdenia | - | Not started |
| Build a nasadenie | `npm run build` prejde, Vercel deploy zelený | - | Not started |

## Tech Stack / Tools

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | Next.js (App Router), TypeScript | Hosting Vercel |
| Styling | Tailwind CSS | Mobilne prívetivé UI |
| Mapa | Leaflet + OpenStreetMap | Bez API kľúča |
| Databáza | Supabase Postgres | Frankfurt, RLS zapnuté |
| Automatizácia | Vercel Cron (n8n voliteľne) | Polling nových inzerátov |
| AI | Claude API | Prehľad lokality, drafty správ |
| Dáta nehnuteľností | Komerčné API (TBD), zatiaľ mock | RealtyAPI / PropAPIS / Apify |
| DNS | Webglobe | CNAME na Vercel |

## Links

| Resource | URL |
|----------|-----|
| Repository | https://github.com/orszagh/adelka-home-finder |
| Production | https://adel.orszagh.online (zatiaľ nepresmerované) |
| Specification | .paul/Adelka_Home_Finder_PRD.md |

---
*Created: 2026-09-23*
*Last updated: 2026-09-23*
