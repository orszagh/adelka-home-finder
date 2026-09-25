---
phase: 08-znacka-zabava
plan: 01
subsystem: ui
tags: [branding, svg, icons, microcopy]

requires:
  - phase: 07
    provides: tokeny, písma, toasty
provides:
  - LogoMark / Logo (src/components/Logo.tsx), APP_NAME
  - app/icon.svg a app/apple-icon.png (180 px), bez starého favicon.ico
  - názov „La casetta di Adelka“ v UI, titulkoch (template) a emailoch
  - talianske pozdravy v privítaní, toasty pri srdiečku
affects: [08-02 reklamy]

key-decisions:
  - "Logo ako SVG podľa návrhu (artboard 1/8) namiesto Higgsfield – Ľubo zastavil míňanie kreditu; Higgsfield verzia môže prísť neskôr"
  - "Logo cez tokeny (var(--c-accent), --c-love), funguje vo svetlej aj tmavej téme"

duration: ~25min
completed: 2026-09-25
---

> Dodatok: v 08-02 SVG logo nahradil Higgsfield návrh 4 (Ľubo povolil Higgsfield).

# Phase 8 Plan 01: Logo, názov, mikrotexty

**Appka sa volá „La casetta di Adelka“ a má logo: morský domček so srdiečkom a terakotovou strechou. Je v hlavičke, menu, na prihlásení aj ako ikona v prehliadači a na ploche mobilu. Privítanie je po taliansky a srdiečko sa ozve hláškou.**

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Logo | Pass (odchýlka) | SVG logo namiesto Higgsfield; /icon.svg a /apple-icon.png vracajú 200, `<link rel=icon>` aj `apple-touch-icon` v HTML |
| AC-2: Názov | Pass | Titulok „La casetta di Adelka“, template „%s · La casetta di Adelka“, email from/predmet/nadpis, testy upravené |
| AC-3: Mikrotexty | Pass | Buongiorno / Buon pomeriggio / Buonasera (testy), toast „Uložené do srdiečka ♥“ s odkazom a „Odložené bokom…“ |

## Deviations from Plan

| # | Odchýlka | Dôvod |
|---|----------|-------|
| 1 | Úloha 1 a rozhodovací checkpoint (Higgsfield) vynechané | Ľubo prerušil volanie Higgsfield; bez výslovného súhlasu sa kredit nemíňa. Logo nakreslené v SVG podľa schváleného návrhu |
| 2 | `favicon.ico` zmazaný, ikona cez `icon.svg` | Next 16 konvencia, ostré v každej veľkosti |
| 3 | Kontrolný checkpoint spojený s 08-02 | Ľubo poslal fotky a pokyn pokračovať; overí sa celá fáza naraz |

## Verification

- `npm test`: 81 passed, 1 skipped; `lint`, `tsc`, `build` čisté
- dev-mock: hlavička s logom, titulok, ikony 200, toast pri srdiečku

---
*Phase: 08-znacka-zabava, Plan: 01 · Completed: 2026-09-25*
