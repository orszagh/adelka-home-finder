# Roadmap: adelka-home-finder

## Overview

Od prázdneho repozitára k funkčnej appke na adel.orszagh.online: najprv mapa s oblasťami a ponukami (mock dáta za vymeniteľným rozhraním), potom automatické upozornenia a AI prehľad lokality, potom AI drafty správ realitkám s manuálnym odoslaním, a nakoniec produkčné nasadenie s ochranou prístupu.

## Milestones

| Version | Name | Phases | Status | Completed |
|---------|------|--------|--------|-----------|
| v0.1 | Initial Release (mapa, notifikácie, AI, nasadenie) | 1-4 | ✅ Live | 2026-09-23 |
| v0.2 | Reálne dáta (Apify), ranné privítanie, regióny/provincie | – (na požiadanie, bez fáz) | ✅ Live | 2026-09-24 |
| v0.3 | Dizajn, UX a domčeky pri mori | 5-8 | 🚧 In progress | - |

## Current Milestone

**v0.3 Dizajn, UX a domčeky pri mori** (v0.3.0)
Status: In progress
Phases: 1 of 4 complete (25 %)
Zadanie: [.paul/phases/v0.3-dizajn-ux/ZADANIE.md](phases/v0.3-dizajn-ux/ZADANIE.md)

## Phases

| Phase | Name | Plans | Status | Completed |
|-------|------|-------|--------|-----------|
| 1 | MVP: mapa a ponuky | 2 | Complete | 2026-09-23 |
| 2 | Automatizácia a AI prehľad lokality | 2 | Complete | 2026-09-23 |
| 3 | Komunikačný modul | 1 | Complete | 2026-09-23 |
| 4 | Produkčné nasadenie | 1 | Complete | 2026-09-23 |
| 5 | Pobrežný pás a nastavenia vyhľadávania | 2/2 | ✅ Complete | 2026-09-25 |
| 6 | Hamburger menu, odhlásenie, tmavý režim | TBD | Not started | - |
| 7 | Dizajnový systém, animácie, výrazné stavy | TBD | Not started | - |
| 8 | Značka a zábava (logo, „reklamy“ od Lubka) | TBD | Not started | - |

## Phase Details

### Phase 1: MVP: mapa a ponuky

**Goal:** Adelka nakreslí alebo vyberie oblasť na mape, vidí v nej ponuky s fotkami a parametrami a vie si ich uložiť.
**Depends on:** Nothing (first phase)
**Research:** Unlikely (štandardný Next.js + Leaflet)

**Scope:**
- Next.js scaffold (App Router, TS, Tailwind)
- Dátová vrstva: Supabase server klient + in-memory fallback, `PropertyProvider` s mock dátami
- Mapa s kreslením oblastí a preddefinovanými regiónmi, filter ponúk v polygóne
- Detail inzerátu s fotkami, uloženie obľúbených s poznámkou

**Plans:**
- [x] 01-01: Scaffold + dátová vrstva (provider, repozitár, sync)
- [x] 01-02: Mapa, oblasti, zoznam a detail ponúk, obľúbené

### Phase 2: Automatizácia a AI prehľad lokality

**Goal:** Nové inzeráty a zmeny cien v sledovaných oblastiach prídu Adelke emailom do 24h; ku každému mestu si vie vyžiadať AI prehľad.
**Depends on:** Phase 1 (dátová vrstva, sledované oblasti)
**Research:** Likely (Claude API, email provider)

**Scope:**
- Cron endpoint: sync z providera, detekcia nových a zlacnených ponúk, email cez Resend
- Vercel Cron konfigurácia (1× denne), chránené `CRON_SECRET`
- AI prehľad lokality cez Claude API, cache v `location_notes`

**Plans:**
- [x] 02-01: Sync + notifikácie + cron
- [x] 02-02: AI prehľad lokality

### Phase 3: Komunikačný modul

**Goal:** Adelka povie zámer, appka pripraví draft správy realitke (taliansky + slovenský preklad), Adelka ho upraví a sama odošle.
**Depends on:** Phase 1 (detail inzerátu), Phase 2 (Claude klient)
**Research:** Unlikely

**Scope:**
- API route na generovanie draftu, UI s editáciou
- Odoslanie výhradne cez akciu Adelky (mailto / kopírovanie), nič automaticky

**Plans:**
- [x] 03-01: Draft správ s manuálnym odoslaním

### Phase 4: Produkčné nasadenie

**Goal:** Appka je nasadená na Verceli, chránená heslom, zdokumentovaná a pripravená na doménu adel.orszagh.online.
**Depends on:** Phase 1-3
**Research:** Unlikely

**Scope:**
- Ochrana prístupu (heslo cez middleware), výnimka pre cron
- README s env premennými, nasadením a DNS postupom
- Push na GitHub → Vercel deploy

**Plans:**
- [x] 04-01: Ochrana prístupu, dokumentácia, nasadenie

## v0.3 Phase Details

Poradie je návrh; o finálnom poradí a rozdelení na plány sa rozhodne na začiatku dizajnovej session (/paul:plan).

### Phase 5: Pobrežný pás a nastavenia vyhľadávania

**Goal:** Predvolene sa hľadajú len domčeky pri mori; Adelka si v nastaveniach môže zapnúť „Hľadať aj vnútrozemie“ so vzdialenosťou od pobrežia alebo celou oblasťou.
**Depends on:** v0.2 (regióny/provincie, Apify provider)
**Research:** Likely (odvodenie pobrežnej čiary a pásov v geo:build)

**Scope:**
- Pobrežná čiara z hraníc provincií (bez štátnych hraníc); pásy 3 / 10 / 20 / 40 km počítané za behu
- Apify: Immobiliare hľadá v prieniku provincie a pásu; filter v appke rovnako
- Nastavenie v `app_state` (platí aj pre ranný cron)
- Odstrániť kreslenie oblasti ťukaním

**Plans:**
- [x] 05-01: Pobrežná čiara, nastavenie hľadania, Apify pozdĺž pobrežia, filter a km od mora
- [x] 05-02: Obrazovka „Kde hľadať“, uloženie nastavenia, štítok na mape, odstránenie kreslenia

### Phase 6: Hamburger menu, odhlásenie, tmavý režim

**Goal:** Navigácia v hamburger menu s nastaveniami vyhľadávania, prepínačom tmavého režimu a odhlásením.
**Depends on:** Phase 5 (nastavenia vyhľadávania)

### Phase 7: Dizajnový systém, animácie, výrazné stavy

**Goal:** Appka je pekná, animovaná a interaktívna; stavy (sťahovanie ponúk, chyby, úspech) sú dobre viditeľné; funguje svetlá aj tmavá téma.
**Depends on:** Phase 6
**Research:** Likely (načítať dizajnový skill pred návrhom)

### Phase 8: Značka a zábava

**Goal:** Logo „La casetta di Adelka“ (Higgsfield, domček so srdiečkom), nový názov v UI, vtipné „platené reklamy“ s Lubkovou fotkou a hravé mikrotexty.
**Depends on:** Phase 7 (vizuálny štýl)
**Blocker:** Lubkova fotka pre „reklamy“

---
*Roadmap created: 2026-09-23*
*Last updated: 2026-09-25*
