---
phase: 09-rozpocet-offline
plans: [01 rozpočet Apify, 02 offline / PWA]
completed: 2026-10-27
---

# Phase 9: Rozpočet na Apify a appka bez signálu

**Sťahovanie sa zmestí do 5 € mesačne a appka ukáže naposledy uložené domčeky okamžite aj bez signálu.**

## Zistenia (Apify, 23.–27. 10.)
- Účet má tvrdý limit 5 USD/mesiac; minuté 0,55 USD za 4 dni (~0,09 USD/noc).
- Bežia len behy Idealista; **Immobiliare sa nespúšťa** (žiadny beh v účte) – na preskúmanie.

## 09-01 Rozpočet
- `src/lib/budget.ts`: tvrdá hranica `APIFY_MONTHLY_BUDGET_USD` (4,5), nočné tempo podľa ubehnutej časti cyklu (+0,25 USD rezerva)
- `getApifyUsage` (/users/me/limits), `provider.budget` / `provider.usage`
- `syncFromProvider({ budget })` → `SyncResult.skipped`; cron „nightly“ (email Lubkovi raz za cyklus), ručné akcie „manual“ s hláškou
- Stropy: 0,08 USD na beh, 30 overení za noc; prehľad spotreby na /nastavenia

## 09-02 Offline (PWA)
- `app/manifest.ts` + ikony 192/512/maskable; `appleWebApp.capable`
- `public/sw.js`: stránky network-first s limitom 2,5 s → uložená kópia; /_next/static cache-first; dlaždice a fotky stale-while-revalidate s limitmi; POST, /api, /prihlasenie nikdy
- `OfflineSupport`: registrácia (len produkcia) + hláška „Si bez signálu“
- proxy púšťa sw.js, manifest a ikony bez session; odhlásenie maže uložené stránky

## Overenie
- 95 testov, lint, build; lokálny produkčný build s ukážkovými dátami: SW aktívny, po zastavení servera sa stránka regiónu so zoznamom a fotkami načítala z pamäte

## Odchýlky
- Obe časti v jednej fáze bez checkpointu (Ľubo: „sprav bod 1 a 2“)
