---
phase: 07-dizajn-animacie
plan: 01
subsystem: ui
tags: [next-font, fraunces, dm-sans, design-system, tailwind4]

requires:
  - phase: 06
    provides: farebné tokeny, témy, menu
provides:
  - písma Fraunces (display) a DM Sans (text) cez next/font, latin-ext
  - stavebné prvky src/components/ui.tsx (Button, ButtonLink, buttonClass, Card, chipClass, Eyebrow, Icon, ICONS)
  - tiene shadow-card / shadow-lift, rádiusy 3xl
  - domov, detail, uložené, nastavenia (ilustrácia pásu), prihlásenie a menu podľa návrhu
  - Greeting.eyebrow („Štvrtok ráno“) počítaný na serveri
affects: [07-02 animácie a stavy, 08 logo a názov]

key-files:
  created: [src/components/ui.tsx]
  modified: [src/app/layout.tsx, src/app/globals.css, src/lib/greeting.ts, ListingCard, GreetingCard, SaveButton, AreaBar, CheckNowButton, HomeFinder, detail, uložené, nastavenia, prihlásenie, LocationSummary, MessageDraft, NoteForm, Gallery, AppMenu]

key-decisions:
  - "Stavebné prvky len ako triedy a tenké obaly, bez logiky"
  - "Ikony ako inline stroke SVG (ICONS), emoji v UI nahradené"
  - "Štítok dňa v privítaní počíta server (bez hydration mismatch)"

duration: ~50min
completed: 2026-09-25
---

# Phase 7 Plan 01: Písma, stavebné prvky, obrazovky podľa návrhu

**Appka vyzerá ako návrh „Riviéra ráno“: nadpisy a ceny vo Fraunces, text v DM Sans, veľké fotky v kartách, zaoblené karty s tieňmi a tlačidlá aspoň 44 px. Všetky obrazovky sú prerobené, vo svetlej aj tmavej téme.**

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Typografia | Pass | next/font Fraunces (opsz, italic) + DM Sans, latin-ext; hlavička, nadpisy, ceny vo Fraunces |
| AC-2: Komponenty domova | Pass | Snímka 390 px: privítanie s Eyebrow, karty s fotkou navrchu, srdiečko 44 px, cena Fraunces, km od mora, čipy oblastí, filtre |
| AC-3: Ostatné obrazovky, témy | Pass | Kontrast 0 chýb, žiadne vodorovné pretečenie na 5 obrazovkách × 2 témy; snímky prihlásenia a nastavení |

## Verification

- `npm test`: 81 passed, 1 skipped; `lint`, `tsc`, `build` čisté
- dev-mock snímky: domov (svetlá), prihlásenie (svetlá), nastavenia (tmavá)

## Deviations from Plan

| # | Odchýlka | Dôvod |
|---|----------|-------|
| 1 | `greeting.ts`: nové pole `eyebrow` + `dayPart()` | Štítok dňa musí počítať server, inak by sa server a klient líšili |
| 2 | Detail: „Lokalita“ nahradená „Od mora“ | Lokalita je už pod nadpisom; vzdialenosť od mora je pre Adelku podstatnejšia |
| 3 | Prihlásenie: „Vitaj, Adelka“ namiesto názvu appky, tlačidlo „Vstúpiť“ | Názov mení až fáza 8 |
| 4 | Nadpis privítania ostáva slovenský („Dobré ráno, Adelka ☕“) | Texty privítania sú testované; „Buongiorno“ zvážiť vo fáze 8 (mikrotexty) |

## Next Phase Readiness

**Ready:** Stavebné prvky a vzhľad pre animácie a stavy (07-02).
**Concerns:** Snímky v paneli prehliadača pri emulácii sa niekedy zdvojujú; overovanie cez JS merania funguje spoľahlivo.
**Blockers:** None

---
*Phase: 07-dizajn-animacie, Plan: 01 · Completed: 2026-09-25*
