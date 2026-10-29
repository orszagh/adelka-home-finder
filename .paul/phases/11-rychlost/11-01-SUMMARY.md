---
phase: 11-rychlost
plan: 01
status: complete
completed: 2026-10-30
---

# 11-01 Summary: Server vo Frankfurte, domov s jednou fotkou

## Výsledok
- `vercel.json` `regions: ["fra1"]` – overené na produkcii (`x-vercel-id: fra1::fra1`), TTFB domova ~0,3 s.
- Domov posiela z každej ponuky len prvú fotku (`toListingSummary`), detail má všetky (preview: galéria 1 / 4).
- Commit 7c27b3e.

## Meranie na produkcii (2026-10-30, interný prehliadač, počítač, obnovenie domova)
| Čo | Hodnota |
|----|---------|
| Ponuky v dátach domova | ~9 500 |
| HTML domova | 6,9 MB (br 1,1 MB) |
| Stiahnutie HTML | 4,7 s (TTFB 0,3 s, zvyšok streamovanie dát) |
| Mapa s popiskami | ~6,4 s |
| Uložené → Späť | 0,3 s, ale mapa sa stavia nanovo (nový Leaflet) |

## Odchýlky
- Checkpoint neschválený ako „rýchle“: hlavná brzda je počet ponúk posielaných do prehliadača → plán 11-02 prerobený (malý index + karty po 30), mapa pod menu presunutá do 11-03.
