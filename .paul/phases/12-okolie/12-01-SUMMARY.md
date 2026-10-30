---
phase: 12-okolie
plan: 01
status: complete
commits: [23b93c8, 14e85de]
---

# 12-01 Summary: okolie bez pásu, 100 km, Prehľadať tento okruh

## Výsledok
Všetky úlohy (1–5) hotové a nasadené. Overené v dev na mock dátach (375 px) a na produkcii: verzia 0.4.0 · 23b93c8 je v menu, okolie pri Fosdinove (10 km) ukazuje 190 domčekov. Testy: 135 passed, 1 skipped, tsc, lint a build OK.

## Acceptance criteria
| AC | Stav | Poznámka |
|----|------|----------|
| AC-1 okolie bez pásu | PASS | mock: 2 domy 7,8 km od mora v okolí áno, v Apúlii nie |
| AC-2 100 km čipmi | PASS | čipy sa zalomia do 2 riadkov, bez ťahania |
| AC-3 potvrdenie ceny | PASS | dialóg overený s dočasnou cenou v mock, Zrušiť nič nespustí |
| AC-4 len kruh, nesleduje sa | PASS (testy) | bandKm null, search_areas bez zmeny |
| AC-5 Zastaviť, pauza 10 min | PASS (testy) / reálne Apify neoverené | |
| AC-6 okolie inak nesťahuje | PASS | zmena okruhu bez requestu |
| AC-7 veľkosť, novinka, Nápoveda | PASS | HTML 67 150 → 67 311 B (mock) |
| AC-7b otáznik HelpTip | PASS | karta sa posúva, aby nevyšla z obrazovky |
| AC-8 priesvitná bodka | PASS | |
| AC-9 zbaliteľné okno | PASS | bublinka s loďkou vľavo dole, ťuknutie rozbalí |
| AC-10 verzia | PASS | po spätnej väzbe väčšie a svetlejšie písmo (14e85de) |

## Odchýlky
- Štítky Nové a zlacnel sa počítajú zo všetkých domov (aj mimo pásu), aby fungovali v okolí. Privítanie ostáva len v páse.
- HelpTip je umiestnený `fixed` podľa tlačidla (pôvodne absolute, pretekal vpravo).
- Riadok verzie: text-sm text-muted namiesto text-xs text-faint (Ľubo ho nevedel prečítať).

## Neoverené
- Reálny beh „Prehľadať tento okruh“ cez Apify a Zastaviť.

## Súbory
Nové: src/lib/near-search.ts(+test), src/lib/version.ts(+test), src/components/HelpTip.tsx, src/app/napoveda/OpenFromHash.tsx.
Upravené: page.tsx, listing-index.ts(+test), HomeFinder.tsx, MapView.tsx, globals.css, actions.ts(+test), geo.ts(+test), SyncSheet.tsx, ui.tsx, AppMenu.tsx, HelpContent.tsx, novelties.tsx, package.json, package-lock.json, next.config.ts.
