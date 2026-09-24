---
phase: 06-menu-tmavy-rezim
plan: 01
subsystem: ui
tags: [tailwind4, css-variables, light-dark, dark-mode, leaflet]

requires:
  - phase: 05
    provides: obrazovky a komponenty (vrátane /nastavenia)
provides:
  - sémantické farebné tokeny (canvas, surface, ink, muted, accent, love, sun…) v palete Riviéra ráno / noc na pláži
  - téma Svetlý / Tmavý / Ako mobil cez cookie adelka_theme, vykreslená na serveri
  - server action setTheme (UI príde v 06-02)
  - mapa v tme (stmavené OSM dlaždice, značky, popisky, polygóny cez CSS)
affects: [06-02 menu (prepínač vzhľadu), 07 dizajnový systém]

tech-stack:
  added: []
  patterns:
    - "Farby len cez tokeny (bg-surface, text-ink…); každý token má light-dark() hodnotu"
    - "Farby Leaflet polygónov cez className + CSS, nie hex v pathOptions"

key-files:
  created: [src/lib/theme.ts, src/lib/theme.test.ts, src/app/theme-actions.ts]
  modified: [src/app/globals.css, src/app/layout.tsx, eslint.config.mjs, 17 komponentov a stránok]

key-decisions:
  - "light-dark() namiesto zdvojených paliet; color-scheme volí tému"
  - "Téma v cookie (nie localStorage), aby ju server vykreslil bez bliknutia"
  - "Tmavé dlaždice cez CSS filter invert + hue-rotate, bez ďalšieho poskytovateľa máp"

duration: ~40min
completed: 2026-09-25
---

# Phase 6 Plan 01: Farebné tokeny a tmavý režim

**Všetky obrazovky používajú sémantické tokeny v palete návrhu. Téma Svetlý / Tmavý / Ako mobil sa pamätá v cookie a vykreslí sa na serveri. Mapa funguje aj v tme.**

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Téma bez bliknutia | Pass | `data-theme` prichádza v HTML zo servera. Bez cookie rozhoduje `prefers-color-scheme`, overené emuláciou: tmavá → #0E1A21, svetlá → #FBF6EE |
| AC-2: Tokeny | Pass | 226 automatických náhrad + ručne privítanie, gombík prepínača, polygóny. Grep: ostali len prekrytia na fotkách (Gallery, „Už nie je v ponuke“) a biely gombík prepínača |
| AC-3: Čitateľnosť | Pass | Automatická kontrola kontrastu na 5 obrazovkách × 2 témy: 0 prvkov pod 4.5:1 (3:1 pre veľký text). Snímky domova a zoznamu v tme |

## Verification

- `npm test`: 80 passed, 1 skipped; `lint`, `tsc`, `build` čisté
- dev-mock: svetlá, tmavá a „ako mobil“ téma; bez chýb aplikácie v logu servera

## Deviations from Plan

| # | Odchýlka | Dôvod |
|---|----------|-------|
| 1 | `light-dark()` namiesto dvoch blokov premenných | Jedna definícia na token, žiadne zdvojenie. Podpora: Chrome 123+, Safari 17.5+, Firefox 120+ |
| 2 | `eslint.config.mjs`: ignoruje `.next-*/**` | Lint kontroloval build priečinok dev-mock servera (6127 falošných hlásení) |
| 3 | Gombík prepínača na /nastavenia ostáva biely v oboch témach | Konvencia prepínačov, kontrast voči tmavej aj svetlej dráhe |

## Next Phase Readiness

**Ready:** `setTheme` a `parseTheme` pre prepínač v menu (06-02); tokeny pre fázu 7.

**Concerns:** Staršie prehliadače bez `light-dark()` (pred 2024) by farby nezobrazili. U Adelkinho mobilu to treba overiť; ak treba, v 06-02 pridáme fallback.

**Blockers:** None

---
*Phase: 06-menu-tmavy-rezim, Plan: 01 · Completed: 2026-09-25*
