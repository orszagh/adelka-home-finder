---
phase: 10-novinky
plan: 01
status: complete
completed: 2026-10-29
---

# 10-01 Summary: Okno s novinkou ako zoznam, Plán obhliadok

## Výsledok
Okno s novinkou berie novinky zo zoznamu `NOVELTIES` v `src/lib/novelties.tsx`. Za návštevu ukáže najviac jednu, vždy najstaršiu nevidenú na zariadení. Pribudla novinka **Plán obhliadok** (ikona kalendára, stavy obhliadky, Plán obhliadok navrchu Uložených) s tlačidlami „Pozrieť Uložené“ (otvorí /ulozene), „Neskôr“ a ✕.

## Acceptance Criteria
| AC | Výsledok |
|----|----------|
| AC-1 Najstaršia nevidená, max 1 za návštevu, reklama počká | PASS (testy + kód, data-novelty-shown zachované) |
| AC-2 So starým kľúčom rovno Plán obhliadok | PASS (kľúč `adelka.novelty.near` nezmenený, test) |
| AC-3 Obsah a tlačidlá | PASS – Ľubo pozrel na localhost:3100 a schválil |
| AC-4 Bez úložiska / ?reklama nič | PASS (kód) |

## Súbory
| Súbor | Zmena |
|-------|-------|
| `src/lib/novelties.tsx` | nový (plán uvádzal .ts – kvôli tučnému textu je .tsx, plán to pripúšťal) |
| `src/lib/novelties.test.ts` | nový, 4 testy |
| `src/components/FeatureAnnouncement.tsx` | upravený |

## Overenie
- `tsc --noEmit`, eslint OK, vitest 112 passed / 1 skipped
- Preview v session nešiel (port 3100 drží dev server inej session); Ľubo overil sám v prehliadači

## Odchýlky
- Text novinky bol ukázaný Ľubovi až pri checkpointe, nie pred zapísaním – schválený bez zmien.

## Ďalej
- Ďalšia novinka = nová položka na konci `NOVELTIES` s vlastným storageKey.
