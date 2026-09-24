---
phase: 06-menu-tmavy-rezim
plan: 02
subsystem: ui
tags: [navigation, dialog, a11y, server-actions]

requires:
  - phase: 06-01
    provides: tokeny, setTheme, téma v cookie
provides:
  - hamburger menu (AppMenu) s Domčeky, Uložené (počet), Nastavenia hľadania (popis pásu), Vzhľad, Odhlásiť sa
  - odhlásenie (logout server action)
  - čistá hlavička: logo + menu
affects: [07 dizajnový systém (vzhľad menu), 08 logo v hlavičke a menu]

key-files:
  created: [src/components/AppMenu.tsx, src/app/session-actions.ts, src/app/session-actions.test.ts]
  modified: [src/app/layout.tsx]

key-decisions:
  - "Menu dáta (počet uložených, popis pásu) načíta layout len pri prihlásení"
  - "Hlavička bez backdrop-blur: filter vytváral containing block pre fixed menu"
  - "Téma sa aplikuje optimisticky na <html>, cookie cez setTheme"

duration: ~25min
completed: 2026-09-25
---

# Phase 6 Plan 02: Hamburger menu, vzhľad, odhlásenie

**Hlavička má logo a jediné tlačidlo menu. Menu sa vysunie sprava s položkami Domčeky, Uložené, Nastavenia hľadania, Vzhľad (Svetlý / Tmavý / Ako mobil) a Odhlásiť sa.**

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Hlavička a menu | Pass | dev-mock: aria-expanded, aria-current na aktuálnej stránke, Esc a pozadie zatvárajú, fokus na „Zavrieť“ a späť na hamburger, body sa neroluje. Na /prihlasenie bez session sa menu nevykreslí (v dev-mock je session vždy) |
| AC-2: Prepínač vzhľadu | Pass | Téma sa zmení hneď, aria-pressed, cookie adelka_theme=dark prežije navigáciu |
| AC-3: Odhlásenie | Pass | Test (zmazanie cookie + redirect) + dev-mock presmerovanie; reálne zrušenie session sa overí na produkcii |

## Verification

- `npm test`: 81 passed, 1 skipped; `lint`, `build` čisté
- Snímky menu vo svetlej aj tmavej téme; checkpoint schválený Ľubom („poď na to, nasaď to“)

## Deviations from Plan

| # | Odchýlka | Dôvod |
|---|----------|-------|
| 1 | Hlavička bez `backdrop-blur` a priesvitnosti | `backdrop-filter` na predkovi obmedzil fixed menu na výšku hlavičky |
| 2 | Zmena DOM témy vo funkcii mimo komponentu | Pravidlo `react-hooks/immutability` |

## Next Phase Readiness

**Ready:** Navigácia a témy hotové; fáza 7 môže pracovať s tokenmi a komponentmi.
**Concerns:** Podpora `light-dark()` na Adelkinom mobile neoverená (06-01).
**Blockers:** None

---
*Phase: 06-menu-tmavy-rezim, Plan: 02 · Completed: 2026-09-25*
