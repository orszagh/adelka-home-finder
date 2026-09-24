---
phase: 05-pobrezny-pas
plan: 02
subsystem: ui
tags: [nextjs, server-actions, settings, leaflet]

requires:
  - phase: 05-01
    provides: search-settings.ts, bandKm, sync s pásom
provides:
  - server action saveSearchSettings (uloží a pri zmene pásu hneď stiahne ponuky)
  - obrazovka /nastavenia „Kde hľadať domček“
  - štítok s nastavením na mape
  - appka bez kreslenia oblasti
  - bezpečný lokálny režim dev-mock
affects: [06 hamburger menu (odkaz na /nastavenia), 07 dizajn obrazovky nastavení]

tech-stack:
  added: []
  patterns:
    - "Lokálne overovanie cez dev-mock: ukážkové dáta, pamäťová DB, bez hesla a Apify"

key-files:
  created: [src/app/nastavenia/page.tsx, src/components/SearchSettingsForm.tsx]
  modified: [src/app/actions.ts, src/components/HomeFinder.tsx, src/components/MapView.tsx, src/components/AreaBar.tsx, next.config.ts, .claude/launch.json]

key-decisions:
  - "Sťahuje sa len pri zmene pásu; uloženie bez zmeny nič nestojí"
  - "Štítok vpravo hore (vľavo je Leaflet zoom)"
  - "distDir cez NEXT_DIST_DIR, aby mohol bežať druhý dev server v tom istom priečinku"

duration: ~35min
completed: 2026-09-25T00:15:00+02:00
---

# Phase 5 Plan 02: Obrazovka „Kde hľadať domček“ a odstránenie kreslenia

**Adelka si na /nastavenia prepne „len pri mori“ alebo vnútrozemie 10/20/40 km či celú oblasť. Nastavenie sa uloží na server, pri zmene pásu sa hneď stiahnu ponuky a na mape je štítok s aktuálnym nastavením. Kreslenie oblasti je preč.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~35 min |
| Tasks | 3 auto + 1 checkpoint (schválený Ľubom) |
| Files | 2 nové, 10 upravených |
| Tests | 79 passed, 1 skipped |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Uloženie nastavenia | Pass | Testy: uloží a stiahne s novým pásom, bez zmeny nesťahuje, chýbajúca migrácia → chyba, zlyhanie sťahovania nastavenie ponechá |
| AC-2: Obrazovka | Pass | Overené v dev-mock; switch s aria-checked, voľby s aria-pressed, 48 px. Stavová karta počas sťahovania sa pri mock dátach neukáže (nič sa nesťahuje) |
| AC-3: Štítok na mape | Pass | „Len pri mori · 3 km“, po uložení „Do 10 km od mora“, vedie na /nastavenia |
| AC-4: Bez kreslenia | Pass | grep bez výsledku; výber regiónov funguje |

## Verification

- `npm test`: 79 passed, 1 skipped; `npm run lint`, `tsc --noEmit`, `npm run build` čisté
- Prehliadač (dev-mock, 3100): 34 ponúk pri 3 km → 36 pri 10 km (pribudlo Ostuni), bez chýb servera
- Checkpoint: Ľubo schválil („ok paráda“)

## Deviations from Plan

| Type | Count | Impact |
|------|-------|--------|
| Scope additions | 2 | Malé, nutné na overenie |

1. **`next.config.ts` + `.gitignore`**: `distDir` z `NEXT_DIST_DIR`. V priečinku už bežal iný `next dev` a Next 16 nepustí druhý s rovnakým `.next`. Produkcia používa predvolené `.next`.
2. **`src/lib/notices.ts`**: text „Nakresli si oblasť…“ nahradený textom o výbere regiónu (nadväzuje na AC-4).
3. `dev-mock` beží cez `APP_PASSWORD=""`, čo v dev režime vypína prihlásenie. Ľubo tak overuje bez zadávania hesla.

## Next Phase Readiness

**Ready:**
- `/nastavenia` existuje. Fáza 6 naň len pridá odkaz v hamburger menu
- Obrazovka je v súčasnom štýle; redizajn podľa návrhu „Riviéra ráno“ príde vo fáze 7

**Concerns:**
- Stavová karta sťahovania je overená len testami, naživo až na produkcii

**Blockers:** None

---
*Phase: 05-pobrezny-pas, Plan: 02*
*Completed: 2026-09-25*
