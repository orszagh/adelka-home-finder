---
phase: 07-dizajn-animacie
plan: 02
subsystem: ui
tags: [animation, css-keyframes, toast, a11y, reduced-motion]

requires:
  - phase: 07-01
    provides: stavebné prvky, písma, tokeny
provides:
  - SyncSheet: výrazná karta sťahovania (loďka, vlny, neurčitý pásik, striedajúce sa texty)
  - ToastProvider / useToast: hlásenia úspechu a chýb
  - animácie v globals.css (bob, wave, sheen, rise, drop, fade-up, pop, burst) + prefers-reduced-motion
  - srdiečko s pop a burst, postupný nábeh kariet
  - homesLabel() v format.ts
affects: [08 zábava (reklamy môžu použiť rise/pop, toasty)]

key-files:
  created: [src/components/SyncSheet.tsx, src/components/Toast.tsx]
  modified: [src/app/globals.css, src/app/layout.tsx, HomeFinder, CheckNowButton, SearchSettingsForm, SaveButton, ListingCard, src/lib/format.ts]

key-decisions:
  - "Neurčitý pásik namiesto percent: server priebeh nehlási"
  - "Úspech zmizne po 5 s, chyba ostane do zavretia"
  - "Animácie čisto v CSS (Tailwind @theme keyframes), žiadna knižnica"

duration: ~35min
completed: 2026-09-25
---

# Phase 7 Plan 02: Animácie a výrazné stavy

**Sťahovanie ukazuje kartu s loďkou na vlnách a striedajúcimi sa textami. Výsledky sa ohlásia hláškou hore, srdiečko pri uložení poskočí s malými srdiečkami a karty nabiehajú postupne. Pri obmedzení pohybu sa všetko vypne.**

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Karta sťahovania | Pass | dev-mock s 8 s oneskorením: „Hľadám domčeky pri mori · Ligúria“, texty sa striedajú, po dokončení zmizne. Reálne (~minúta) sa overí na produkcii cez „Pozrieť teraz“ |
| AC-2: Toasty | Pass | Nastavenia: „Uložené. Ukáž mi ich“ (status, odkaz /). Chyby role=alert, bez auto-skrytia. Inline hlášky nahradené |
| AC-3: Mikrointerakcie | Pass | 6× burst + pop pri uložení; nábeh 0–400 ms; pravidlo reduced-motion v štýloch |

## Verification

- `npm test`: 81 passed, 1 skipped; `lint`, `tsc`, `build` čisté; server bez chýb
- Checkpoint schválený Ľubom („vyhoď to von“)

## Deviations from Plan

| # | Odchýlka | Dôvod |
|---|----------|-------|
| 1 | `homesLabel()` presunutý do `format.ts` | Zdieľa ho domov aj nastavenia |
| 2 | Reduced motion overený len prítomnosťou pravidla | Panel prehliadača nevie emulovať `prefers-reduced-motion` |

## Next Phase Readiness

**Ready:** Vizuálny štýl, pohyb a hlásenia hotové; fáza 8 (logo, názov, reklamy) môže na nich stavať.
**Concerns:** Podpora `light-dark()` na Adelkinom mobile stále neoverená.
**Blockers:** Lubkova fotka pre reklamy (fáza 8)

---
*Phase: 07-dizajn-animacie, Plan: 02 · Completed: 2026-09-25*
