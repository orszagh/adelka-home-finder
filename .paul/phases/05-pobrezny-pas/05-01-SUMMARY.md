---
phase: 05-pobrezny-pas
plan: 01
subsystem: api
tags: [geo, mapshaper, natural-earth, apify, coast]

requires:
  - phase: v0.2
    provides: regióny/provincie (italy.ts, geo:build), Apify provider, app_state
provides:
  - pobrežná čiara provincií (src/data/italy-coast.json)
  - vzdialenosť od mora (distanceToSeaKm) a pobrežné úseky/pásy
  - nastavenie hľadania v app_state (search_settings), predvolene 3 km
  - Apify behy pozdĺž pobrežia, sync a zobrazenie podľa pásu
affects: [05-02 obrazovka nastavení, 06 hamburger menu, 07 dizajn kariet]

tech-stack:
  added: []
  patterns:
    - "Geo dáta sa predpočítajú v geo:build, appka ich len číta"
    - "Hľadanie pozdĺž pobrežia: úseky s rozdeleným maxItems, náklady rovnaké"

key-files:
  created: [src/lib/coast.ts, src/lib/search-settings.ts, src/data/italy-coast.json]
  modified: [scripts/build-italy-geo.mjs, src/lib/providers/apify/index.ts, src/lib/sync.ts, src/app/page.tsx]

key-decisions:
  - "Pobrežie = nezdieľané hrany provincií mínus štátne hranice (Natural Earth, 3,2 km)"
  - "Filter podľa pásu na serveri v page.tsx, vzdialenosť sa neukladá do DB"
  - "Vnútrozemské ponuky sa neoverujú a skryjú, ale nemažú"

duration: ~45min
started: 2026-09-24T22:30:00+02:00
completed: 2026-09-24T23:10:00+02:00
---

# Phase 5 Plan 01: Pobrežný pás – dáta, nastavenie, hľadanie

**Appka predvolene hľadá a zobrazuje len domčeky do 3 km od mora. Apify behy idú pozdĺž pobrežia bez zvýšenia nákladov a karta ukazuje vzdialenosť od mora.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~45 min |
| Tasks | 3 completed (všetky PASS) |
| Files | 6 nových, 13 upravených |
| Tests | 76 passed, 1 skipped (live) |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Pobrežná čiara provincií | Pass | 62/62 pobrežných provincií, 67 KB. Enna, Firenze nemajú čiaru; Imperia bez francúzskej hranice |
| AC-2: Vzdialenosť od mora | Pass | Aci Castello < 3 km, Caltanissetta > 20 km, Paternò > 15 km, San Marino > 10 km |
| AC-3: Nastavenie hľadania | Pass | Predvolene 3 km aj bez tabuľky app_state; neplatné hodnoty → predvolené |
| AC-4: Apify pozdĺž pobrežia | Pass | Catania: 2 úseky × 2 portály × 25 ponúk. Celá oblasť / oblasť bez pobrežia = pôvodné behy |
| AC-5: Sync a zobrazenie | Pass | Sync zahodí ponuky mimo pásu, neoveruje staré vnútrozemské. Stránka ich skryje, karta ukáže „do 1 km od mora“ |

## Accomplishments

- Pobrežná čiara vzniká v `npm run geo:build` z tých istých ISTAT hraníc (jemnejšie zjednodušenie 250 m), bez novej závislosti
- `coast.ts`: vzdialenosť od mora, pobrežie oblasti (región/provincia podľa názvu), úseky pobrežia, pás ≤ 40 vrcholov pre Immobiliare `vrt`
- Nastavenie `search_settings` v app_state používa cron, „Pozrieť teraz“ aj nová oblasť

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `scripts/build-italy-geo.mjs` | Modified | Druhý mapshaper beh, `buildCoast`, hranice z Natural Earth |
| `src/data/italy-coast.json` | Created | Pobrežné čiary podľa kódu provincie |
| `src/lib/coast.ts` (+ test) | Created | distanceToSeaKm, coastLinesForArea, coastChunks, bandPolygon |
| `src/lib/search-settings.ts` (+ test) | Created | Typ, predvolené, parse, bandKm, withinBand, formát |
| `src/lib/providers/index.ts` | Modified | `FetchOptions { bandKm }` |
| `src/lib/providers/apify/index.ts` | Modified | `coastJobs` / `areaJobs` |
| `src/lib/providers/apify/idealista.ts` | Modified | `idealistaCircleInput` |
| `src/lib/providers/apify/apify.test.ts` | Modified | 2 testy pobrežného hľadania |
| `src/lib/sync.ts` (+ test) | Modified | Filter podľa pásu, overovanie len v páse |
| `src/app/api/cron/sync/route.ts`, `src/app/actions.ts` | Modified | Čítajú nastavenie, posielajú bandKm |
| `src/app/page.tsx` | Modified | `sea_km` a filter podľa pásu |
| `src/lib/types.ts`, `src/lib/format.ts`, `src/components/ListingCard.tsx` | Modified | `sea_km`, `seaLabel`, zobrazenie na karte |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Štátne hranice cez Natural Earth s tolerancou 3,2 km | NE 10m hranice sú posunuté o 2–3 km | Prvé ~3 km pobrežia pri Ventimiglii a Muggii chýba |
| Enklávy: počítajú sa hrany aj dier | Inak enkláva (napr. v CL, PU) vyzerala ako pobrežie | Správne pobrežie |
| Úseky: max 4, min 25 km, maxItems/úsek = max(15, ⌈50/n⌉) | Rovnaké náklady ako doteraz | Pri celom regióne sa pokryjú 4 najdlhšie úseky |

## Deviations from Plan

| Type | Count | Impact |
|------|-------|--------|
| Zmena miesta | 1 | Bez dopadu na správanie |
| Neoverené | 1 | Vizuálna kontrola presunutá na 05-02 |

1. **Filter podľa pásu v `page.tsx` namiesto `HomeFinder`.** Server pošle klientovi len ponuky v páse, takže to naraz pokryje zoznam, mapu aj privítanie. `HomeFinder.tsx` sa nemenil.
2. **Bez kontroly v prehliadači.** Prihlásenie heslom robí Ľubo sám. Pokus o čítanie produkčnej DB (koľko ponúk je v páse) bol zablokovaný bezpečnostnými pravidlami. Logiku pokrývajú testy.

## Next Phase Readiness

**Ready:**
- `getSearchSettings`, `SEARCH_SETTINGS_KEY`, `formatSearchSettings`, `INLAND_OPTIONS` pre obrazovku nastavení (05-02)
- `sea_km` na ponukách pre budúci dizajn kariet (fáza 7)

**Concerns:**
- Po nasadení sa hneď skryjú vnútrozemské ponuky (Caltanissetta mesto, Paternò…); pri Caltanissette ostane len pobrežie pri Gele
- Chýba ukladanie nastavenia (server action) a UI; rieši 05-02

**Blockers:** None

---
*Phase: 05-pobrezny-pas, Plan: 01*
*Completed: 2026-09-24*
