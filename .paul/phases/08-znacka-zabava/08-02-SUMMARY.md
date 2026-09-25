---
phase: 08-znacka-zabava
plan: 02
subsystem: ui
tags: [fun, ads, localStorage, resend, tracking]

requires:
  - phase: 08-01
    provides: logo, názov, toasty
provides:
  - AdPopup: „Platená reklama“ s Lubkovou fotkou, max raz za deň (?reklama=1 na skúšku)
  - 7 štipľavých reklám (src/lib/ads.ts), míľniky pusí 3 a 10 so slovami od Ľuba
  - počítadlo pusí v prehliadači, „Poslať ešte jednu pusu“
  - sledovanie ťuknutí: app_state ad_choices (posledných 200) + email Lubkovi (LUBKO_EMAIL, predvolene orszagh.lubo@gmail.com)
  - logo z Higgsfield (návrh 4, Recraft V4.1 vector), prefarbené na tokeny
affects: []

key-files:
  created: [src/lib/ads.ts, src/lib/ads.test.ts, src/lib/ad-report.ts, src/lib/ad-report.test.ts, src/app/ad-actions.ts, src/components/AdPopup.tsx, public/lubko/1-3.webp]
  modified: [src/components/HomeFinder.tsx, src/app/globals.css (shake), src/components/Logo.tsx, src/app/icon.svg, src/app/apple-icon.png, .env.example, README.md]

key-decisions:
  - "Tón štipľavý a odvážny (Ľubo), texty míľnikov presne podľa Ľuba"
  - "Pusy len v localStorage, ťuknutia na serveri (app_state) a emailom"
  - "Fotky commitnuté do verejného repozitára na výslovný pokyn Ľuba"
  - "Logo: Higgsfield návrh 4 (1 kolo, 4 návrhy), vnútro srdiečka vo farbe pozadia kvôli tmavej téme"

duration: ~60min
completed: 2026-09-25
---

# Phase 8 Plan 02: Platené reklamy od Lubka

**Raz denne vyskočí štipľavá „platená reklama“ s Lubkovou fotkou. Pusy sa počítajú a na 3. a 10. puse Lubko pritvrdí. Každé ťuknutie sa zaznamená a Lubkovi príde email. K tomu logo z Higgsfield v celej appke.**

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Raz za deň | Pass | Testy `shouldShowAd`, `todayKey` (Europe/Bratislava); `?reklama=1` overené v dev-mock |
| AC-2: Obsah a ovládanie | Pass | Odpočet 3 s, Esc/pozadie až po odpočte, zaplatenie → „Platba prijatá“, shake „nefunguje“, míľniky 3 a 10 overené v dev-mock |
| AC-3: Fotky | Pass | 720×900 webp, 16–34 kB, za prihlásením (proxy) |
| Navyše: sledovanie | Pass | POST ťuknutí overený v dev-mock, bez chýb servera; email sa overí na produkcii (Resend) |

## Deviations from Plan

| # | Odchýlka | Dôvod |
|---|----------|-------|
| 1 | Míľniky pusí (3, 10) a „Poslať ešte jednu pusu“ | Požiadavka Ľuba počas práce |
| 2 | Sledovanie ťuknutí + email | Požiadavka Ľuba |
| 3 | Logo z Higgsfield namiesto SVG z 08-01 | Ľubo povolil Higgsfield, vybral návrh 4 |
| 4 | Checkpoint nahradený pokynmi Ľuba („daj 4“, „comitni“) | Ľubo priebežne kontroloval texty a rozhodol |

## Concerns

- Resend bez vlastnej domény posiela len na email vlastníka účtu; ak je iný než orszagh.lubo@gmail.com, treba `LUBKO_EMAIL` alebo overenú doménu.
- Pri 10 pusách za sebou príde 10 emailov (ponúknutý súhrnný email, zatiaľ nie).
- Fotky sú vo verejnom GitHub repozitári (na pokyn Ľuba).

---
*Phase: 08-znacka-zabava, Plan: 02 · Completed: 2026-09-25*
