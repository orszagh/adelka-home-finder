---
phase: 01-mvp-mapa-ponuky
plan: 02
subsystem: ui
tags: [react-leaflet, openstreetmap, server-actions, tailwind4]
requires:
  - phase: 01-01
    provides: getRepo, getProperties, geo utility
provides:
  - Hlavná stránka s mapou, oblasťami (kreslenie ťukaním + preddefinované regióny) a filtrovaným zoznamom
  - Detail inzerátu s galériou, uložené inzeráty s poznámkami
  - SVG ilustrácie pre mock inzeráty (/mock-photo/[seed])
affects: [02-automatizacia, 03-komunikacia]
key-files:
  created: [src/app/actions.ts, src/components/HomeFinder.tsx, src/components/MapView.tsx, src/components/AreaBar.tsx, src/components/ListingCard.tsx, src/components/SaveButton.tsx, src/components/Gallery.tsx, src/components/NoteForm.tsx, src/app/inzerat/[id]/page.tsx, src/app/ulozene/page.tsx, src/app/mock-photo/[seed]/route.ts, src/lib/format.ts, src/lib/regions.ts, src/lib/notices.ts]
  modified: [src/app/layout.tsx, src/app/globals.css, src/app/page.tsx, eslint.config.mjs]
key-decisions:
  - "Vlastné kreslenie polygónu ťukaním (bez leaflet-draw) – spoľahlivé na mobile, bez ďalšej závislosti"
  - "Pri zoome < 9 sa cenovky menia na bodky (prekrývanie)"
  - "Označenie 'Nové' sa počíta na serveri (react-hooks/purity)"
  - "Mock fotky ako generované SVG namiesto náhodných fotiek z picsum"
duration: 25min
completed: 2026-09-23
---

# Phase 1 Plan 02: Mapa, ponuky, obľúbené Summary

**Mobilne prívetivé slovenské UI: Leaflet mapa s cenovkami, oblasti kreslené ťukaním alebo pridané jedným ťuknutím (Ligúria, Toskánsko, Apúlia), filtre, detail s galériou a uložené inzeráty s poznámkami.**

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Oblasť na mape | Pass | Ligúria → 12 ponúk; nakreslená oblasť uložená, zjednotenie 26 ponúk |
| AC-2: Zobrazenie ponúk | Pass | 36 značiek, karty s fotkou/cenou/m²/izbami, detail s galériou |
| AC-3: Obľúbené | Pass | srdiečko, poznámka uložená a viditeľná na /ulozene |
| AC-4: Mobil | Pass | 375 px, scrollWidth = 375, mapa 50dvh |
| AC-5: Poctivosť dát | Pass | upozornenia na mock dáta a chýbajúcu DB |

## Deviations from Plan

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 4 | Nutné opravy, bez rozšírenia rozsahu |
| Scope additions | 2 | Malé UX vylepšenia |

1. Výška layoutu: `calc()` v Tailwinde potrebuje `_` okolo operátorov + `lg:flex-none`, inak mapa rástla s obsahom (5452 px) a fitBounds ukazoval Nórsko.
2. fitBounds sa odkladá, kým kontajner mapy nemá rozmer (`useEffectEvent` + ResizeObserver).
3. SVG generátor: znamienkový posun `>>` dával záporné indexy → `>>>`.
4. `Date.now()` v klientskom renderi → výpočet "Nové" presunutý na server.
5. (Pridané) Bodky namiesto cenoviek pri oddialení; generované SVG fotky pre mock dáta.

## Next Phase Readiness

**Ready:** Detail inzerátu má miesto pre AI prehľad lokality (02-02) a draft správy (03-01).
**Concerns:** Supabase repozitár zatiaľ neoverený naživo.
**Blockers:** None

---
*Phase: 01-mvp-mapa-ponuky, Plan: 02*
*Completed: 2026-09-23*
