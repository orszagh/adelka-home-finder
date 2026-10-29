---
phase: 11-rychlost
plan: 03
status: complete
completed: 2026-10-30
---

# 11-03 Summary: Mapa pod stránkami z menu, mapa pri prihlásení

## Výsledok
- Uložené, Nastavenia hľadania a Nápoveda otvorené z appky sú intercepted routes v `@modal` (`(.)ulozene`, `(.)nastavenia`, `(.)napoveda`) – panel `DetailPanel` pod hlavičkou (`belowHeader`), mapa ostáva.
- Obsah stránok v zdieľaných komponentoch (`SavedContent`, `SettingsContent`, `HelpContent`); priamy odkaz / obnovenie = celá stránka ako doteraz.
- `LoginForm`: počas zadávania hesla sa na pozadí stiahne HomeFinder a MapView (requestIdleCallback).
- Commit d92519d.

## Overenie
| Kde | Čo | Výsledok |
|-----|----|----------|
| Produkcia | menu → Uložené | panel za 0,48 s, ten istý Leaflet |
| Produkcia | Uložené → detail → Späť | 0,33 s / 0,05 s |
| Produkcia | zatvoriť Uložené | 0,04 s, ten istý Leaflet |
| Náhľad | Uložené → menu → Nápoveda → zatvoriť | späť na mapu (nahradenie), tá istá mapa |
| Náhľad | /ulozene priamo | celá stránka, bez mapy |
| Náhľad | /prihlasenie | chunk MapView a leaflet.css stiahnuté na pozadí |

## Odchýlky
- Panel stránok z menu začína pod hlavičkou (menu ostáva dostupné); detail domčeka ostáva na celú obrazovku.

## Neoverené
- Uloženie nastavení v paneli a ich prejavenie na mape po zatvorení.
- Ľubo na mobile.
