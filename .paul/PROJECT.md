# adelka-home-finder

## What This Is

Responzívna webová appka pre Adelku, ktorá hľadá domček pri mori v Taliansku. Na jednom mieste kombinuje interaktívnu mapu s nakreslenou oblasťou záujmu, ponuky nehnuteľností (fotky, cena, plocha, izby), sledované inzeráty, emailové upozornenia na nové ponuky a zmeny cien, AI prehľad lokality (infraštruktúra, dostupnosť, klimatické riziká, spodná voda) a AI prípravu draftu správy realitke, ktorý Adelka vždy sama skontroluje a odošle.

## Core Value

Adelka nájde vhodný domček pri talianskom mori z jedného jednoduchého miesta a nemusí manuálne prechádzať realitné portály ani googliť každú lokalitu.

## Current State

| Attribute | Value |
|-----------|-------|
| Type | Application |
| Version | 0.2.0 |
| Status | Live so skutočnými inzerátmi (v0.2), v0.3 rozpracovaná (fáza 5 hotová) |
| Last Updated | 2026-09-25 |

**Production URLs:**
- https://adelka-home-finder.vercel.app: produkcia (live od 2026-09-24)
- adel.orszagh.online: cieľová doména (DNS na Webglobe ešte nie je presmerované na Vercel)

## Requirements

### Core Features

- Interaktívna mapa s výberom regiónov a provincií pozdĺž talianskeho pobrežia
- Zobrazenie ponúk v oblasti (fotky, cena, plocha, počet izieb) bez preklikávania na portál
- Uloženie obľúbených/sledovaných inzerátov
- Emailová notifikácia pri novom inzeráte alebo zmene ceny v sledovanej oblasti (do 24h)
- AI prehľad lokality na vyžiadanie (infraštruktúra, dostupnosť, riziká)
- AI draft komunikácie s realitkou, odoslanie výhradne po explicitnom potvrdení Adelkou

### Validated (Shipped)
- [x] Mapa s oblasťami (kreslenie + regióny), ponuky, detail, obľúbené s poznámkami — v0.1
- [x] Denný sync + email notifikácie (nové inzeráty, zmeny cien) — v0.1
- [x] AI prehľad lokality s cache — v0.1
- [x] AI draft správy realitke, odoslanie len Adelkou — v0.1
- [x] Prístup chránený heslom — v0.1
- [x] Reálne inzeráty z Idealista.it a Immobiliare.it cez Apify — v0.2
- [x] Ranné privítanie, overovanie aktuálnosti, zlacnenia, „Pozrieť teraz“ — v0.2
- [x] Výber oblastí cez klikateľné regióny a provincie — v0.2
- [x] Predvolene len domčeky pri mori (pás 3 km), vnútrozemie 10/20/40 km alebo celá oblasť v nastaveniach, km od mora na kartách — Phase 5
- [x] Kreslenie oblasti odstránené — Phase 5

### Active (In Progress)
- [ ] Hamburger menu s nastaveniami, tmavým režimom a odhlásením (fáza 6)

### Planned (Next) – v0.3, zadanie v .paul/phases/v0.3-dizajn-ux/ZADANIE.md
- Dizajnový systém, animácie, výrazné stavové hlášky, tmavá téma
- Logo „La casetta di Adelka“ (Higgsfield) a vtipné „reklamy“ od Lubka

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
- Dáta cez Apify actory (igolaizola/idealista-scraper, memo23/immobiliare-scraper), strop 50 ponúk na portál a oblasť
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
| Vercel Cron + Resend namiesto n8n | Menej infraštruktúry | 2026-09-23 | Active |
| claude-opus-5 so structured outputs | Spoľahlivý JSON, server-side fallback | 2026-09-23 | Active |
| Heslo + HMAC cookie | Chráni zápisy a AI kredit | 2026-09-23 | Active |
| Pobrežie z nezdieľaných hrán provincií mínus hranice Natural Earth | Bez novej závislosti, presnosť ~250 m | 2026-09-24 | Active |
| Pás 3 km predvolene, nastavenie v app_state | Adelka hľadá domček pri mori; platí aj pre cron | 2026-09-24 | Active |
| Apify pozdĺž pobrežia: max 4 úseky, maxItems rozdelené | Rovnaké náklady ako pri celej provincii | 2026-09-24 | Active |

## Success Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Adelka vie nakresliť oblasť a vidí v nej ponuky | Funguje na mobile | overené na 375 px | Achieved |
| Notifikácia o novom inzeráte / zmene ceny | Do 24h | cron 1× denne, email po nastavení Resend | On track |
| AI prehľad lokality | Na jedno kliknutie | hotové, živé volanie neoverené | On track |
| Draft správy realitke | Nikdy sa neodošle bez potvrdenia | len mailto/kopírovanie | Achieved |
| Build a nasadenie | `npm run build` prejde, Vercel deploy zelený | live na Verceli, 26 testov OK | Achieved |

## Tech Stack / Tools

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | Next.js (App Router), TypeScript | Hosting Vercel |
| Styling | Tailwind CSS | Mobilne prívetivé UI |
| Mapa | Leaflet + OpenStreetMap | Bez API kľúča |
| Databáza | Supabase Postgres | Frankfurt, RLS zapnuté |
| Automatizácia | Vercel Cron (n8n voliteľne) | Polling nových inzerátov |
| AI | Claude API | Prehľad lokality, drafty správ |
| Dáta nehnuteľností | Apify (Idealista.it + Immobiliare.it) | REST API run-sync-get-dataset-items |
| DNS | Webglobe | CNAME na Vercel |

## Links

| Resource | URL |
|----------|-----|
| Repository | https://github.com/orszagh/adelka-home-finder |
| Production | https://adel.orszagh.online (zatiaľ nepresmerované) |
| Specification | .paul/Adelka_Home_Finder_PRD.md |

---
*Created: 2026-09-23*
*Last updated: 2026-09-25 after Phase 5*
