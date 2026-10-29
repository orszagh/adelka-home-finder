---
phase: 11-rychlost
plan: 02
status: complete
completed: 2026-10-30
---

# 11-02 Summary: Malý index ponúk, karty po 30

## Výsledok
- Server číta zo Supabase len potrebné stĺpce, z fotiek prvú (`photos->>0`), stránky po 1000 paralelne (`listPropertiesLight`).
- Domov posiela kompaktný index (stĺpce: ids, lat, lng, price, rooms, sea, added, region, fresh) – `src/lib/listing-index.ts`.
- Región ponuky (`src/lib/regions.ts`) a km od mora počíta server, s pamäťou podľa polohy (`src/lib/point-cache.ts`) a hrubým testom podľa obdĺžnika.
- Karty: `GET /api/listing-cards?ids=…` (max 60, private cache 10 min), `useListingCards` so zdieľanou pamäťou v prehliadači; zoznam po 30 + „Ukázať ďalšie“, kostra karty, „Skús znova“.
- PlaceLayer: hrubý test podľa obdĺžnika pred pointInArea.
- Commity e6ac249, 3e05dcf.

## Meranie na produkcii (interný prehliadač, počítač)
| Čo | Pred 11-01 | Po 11-01 | Po 11-02 |
|----|-----------|----------|----------|
| HTML domova | – | 6,9 MB | **958 KB** |
| Stiahnutie HTML (fetch, server teplý) | – | 4,7 s | **1,4–1,7 s** |
| Stiahnutie HTML (prvé po nasadení) | – | – | 3,5 s |
| Obnovenie stránky, HTML hotové | – | 4,7 s | **1,8 s** |

## Odchýlky
- Server action pre karty → route handler: akcia volaná hneď po načítaní stránky ostávala visieť (v uspanom tabe); GET je jednoduchší a dá sa cachovať.
- MemoryRepository.shared(): kontrola podľa metódy namiesto instanceof (API routes sú v deve v inom bundli).
- `dedupe` pri rovnakej cene uprednostní ponuku s fotkou (predtým s viac fotkami) – server má len prvú fotku.
- Navyše oproti plánu: pamäť výpočtov podľa polohy, príznak Nové v indexe (newIds bolo 398 KB).

## Checkpoint
- Ľubo schválil („Approved, ďalej 11-03“).
