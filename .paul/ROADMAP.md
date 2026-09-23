# Roadmap: adelka-home-finder

## Overview

Od prázdneho repozitára k funkčnej appke na adel.orszagh.online: najprv mapa s oblasťami a ponukami (mock dáta za vymeniteľným rozhraním), potom automatické upozornenia a AI prehľad lokality, potom AI drafty správ realitkám s manuálnym odoslaním, a nakoniec produkčné nasadenie s ochranou prístupu.

## Current Milestone

**v0.1 Initial Release** (v0.1.0)
Status: Complete (v kóde; čaká na Vercel env)
Phases: 4 of 4 complete

## Phases

| Phase | Name | Plans | Status | Completed |
|-------|------|-------|--------|-----------|
| 1 | MVP: mapa a ponuky | 2 | Complete | 2026-09-23 |
| 2 | Automatizácia a AI prehľad lokality | 2 | Complete | 2026-09-23 |
| 3 | Komunikačný modul | 1 | Complete | 2026-09-23 |
| 4 | Produkčné nasadenie | 1 | Complete | 2026-09-23 |

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

---
*Roadmap created: 2026-09-23*
*Last updated: 2026-09-23*
