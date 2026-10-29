---
phase: 10-novinky
plan: 02
status: complete
completed: 2026-10-29
---

# 10-02 Summary: Obhliadka do kalendára s pripomienkou (quick-fix, bez samostatného PLAN.md)

## Zadanie (Ľubo, 2026-10-29)
Adelka (iPhone) si zapíše čas obhliadky; má dostať včasné upozornenie – ponúknuť uloženie do kalendára s pripomienkou deň vopred. Info aj do okna s novinkami.

## Rozhodnutie
Súbor .ics namiesto odkazu do Google Kalendára: len .ics vie nastaviť vlastné pripomienky; iPhone ho otvorí rovno v „Pridať do kalendára“. Email deň vopred zatiaľ nie (Resend neoverený).

## Výsledok
- `GET /api/visit-calendar/[id]` (len prihlásená, len stav „Obhliadka dohodnutá“ s dátumom) vráti udalosť: čas z Talianska prevedený na UTC, 1 h, pripomienky deň vopred a 2 h pred; bez času celodenná s pripomienkou o 9:00 deň vopred. Miesto, GEO, odkaz na inzerát a do appky.
- VisitForm: po uložení dohodnutej obhliadky s dátumom tlačidlo „Pridať do kalendára“ + vysvetlivka.
- Uložené → Plán obhliadok: ikona kalendára pri budúcich obhliadkach.
- Nová novinka `calendar` (kľúč `adelka.novelty.calendar`) „Obhliadka v kalendári“, nápoveda doplnená.

## Súbory
| Súbor | Zmena |
|-------|-------|
| `src/lib/visit-calendar.ts` | nový |
| `src/lib/visit-calendar.test.ts` | nový, 5 testov |
| `src/app/api/visit-calendar/[id]/route.ts` | nový |
| `src/components/VisitForm.tsx` | upravený |
| `src/app/ulozene/page.tsx` | upravený |
| `src/lib/novelties.tsx` | upravený |
| `src/app/napoveda/page.tsx` | upravený |

## Overenie
- tsc (po `next typegen`), eslint, vitest 117 passed / 1 skipped
- Neoverené na iPhone ani v preview (port 3100 drží iná session)
