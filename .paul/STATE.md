# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-09-25)

**Core value:** Adelka nájde vhodný domček pri talianskom mori z jedného jednoduchého miesta.
**Current focus:** priebežné úpravy pre Adelku na cestách (okolie, štítky, Apify Starter) – všetko live

## Current Position

Milestone: v0.3 Dizajn, UX a domčeky pri mori (v0.3.0) – priebežné úpravy
Phase: 12 (Okolie) — Planning
Plan: 12-01 applied (Tasks 1–5 hotové), checkpoint: Ľubo overí na mobile po nasadení
Status: APPLY complete, ready for UNIFY
Last activity: 2026-10-30 — 12-01-PLAN.md: okolie bez pásu, 100 km, Prehľadať tento okruh (bez ťahania); CONTEXT.md pre 12-02

Progress:
- v0.1: [██████████] 100% (live)
- v0.2: [██████████] 100% (live od 2026-09-24)
- v0.3: [██████████] 100% (live od 2026-09-25)

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ○     [12-01 APPLY hotový, čaká na overenie Ľubom a UNIFY]
```

## Accumulated Context

### Decisions

| Decision | Phase | Impact |
|----------|-------|--------|
| Mock dáta za rozhraním PropertyProvider | 1 | Reálny poskytovateľ sa doplní bez zmeny UI |
| Vercel Cron + Resend (bez n8n) | 2 | Menej infraštruktúry; n8n môže volať ten istý endpoint |
| claude-opus-5, structured outputs, fallbacks "default" | 2 | AI len na serveri, cache prehľadov v DB |
| Odoslanie správ len cez mailto/kopírovanie | 3 | Server nemá žiadnu odosielaciu cestu |
| Heslo + HMAC cookie, overenie aj v každej route/action | 4 | Chráni service_role zápisy aj AI kredit |
| Apify: igolaizola/idealista-scraper (kruh) + memo23/immobiliare-scraper (polygón vrt) | v0.2 | Overené živo na Sanremo, 20/20 v polygóne |
| Ponuky sa sťahujú pre Adelkine oblasti; nová oblasť hneď, inak denný cron | v0.2 | Náklady rastú s počtom oblastí |
| Overovanie aktuálnosti podľa ID (36 h), skrytie po 4 dňoch | v0.2 | Denne max APIFY_RECHECK_MAX ponúk |
| app_state + previous_price cez migráciu, kód funguje aj bez nej | v0.2 | Poradie nasadenia nerozbije produkciu |
| Výber oblastí cez klikateľné regióny → provincie (ISTAT 2026, openpolis CC BY) | v0.2 | Nahrádza obdĺžnikové predvoľby; oblasť sa páruje s miestom podľa názvu |
| Predvolene len pobrežný pás, vnútrozemie ako nastavenie | v0.3 | Rieši vnútrozemské výsledky (Catania, Caltanissetta, Bari) |
| Kreslenie oblasti sa ruší, ostávajú regióny/provincie | v0.3 | Jednoduchšie UX |
| Vizuálny smer „Riviéra ráno“ (Fraunces + DM Sans, piesok/more/terakota), návrh na Design plátne | v0.3 | Schválené Ľubom 2026-09-24 |
| Pobrežný pás 3 km predvolene; vnútrozemie 10/20/40 km alebo celá oblasť | 5 | Apify behy pozdĺž pobrežia, rovnaké náklady |
| Pobrežie z nezdieľaných hrán provincií mínus hranice Natural Earth; filter podľa pásu na serveri | 5 | sea_km sa počíta pri renderi, neukladá sa |
| Sémantické tokeny s light-dark(), téma v cookie adelka_theme | 6 | Farby len cez tokeny; tmavá mapa cez CSS filter |
| Hamburger menu (AppMenu) namiesto odkazov v hlavičke, odhlásenie cez server action | 6 | Hlavička bez backdrop-blur |
| Stavebné prvky v src/components/ui.tsx, ikony ako inline SVG | 7 | Jednotný vzhľad, žiadne emoji v UI |
| SyncSheet + toasty namiesto inline hlášok, animácie v CSS | 7 | Výrazné stavy, reduced motion |
| Logo z Higgsfield (návrh 4) prefarbené na tokeny; reklamy s pusami (localStorage) a ťuknutiami (app_state + email) | 8 | Fotky Lubka vo verejnom repe na pokyn Ľuba |
| Zatváranie stránok = späť v histórii appky (navigation.tsx), staleTimes 10 min, SW bez RSC | 10/2026 | Návrat na mapu okamžite |
| Videné inzeráty v app_state seen_listings, jeden štítok Nové/Nevidela/Videla | 10/2026 | Platí na mobile aj počítači |
| Okolie: poloha len v stave stránky (?near=1 bez súradníc) | 10/2026 | Súkromie |
| Apify Starter: rozpočet = limit účtu − 0,5 USD, 200 ponúk/portál/oblasť, 16 behov naraz | 10/2026 | ~0,29 USD za oblasť, odhad v okne sťahovania |
| Žiadne emoji v UI, len ICONS | 10/2026 | Pokyn Ľuba natrvalo |
| Obhliadka do kalendára cez .ics (/api/visit-calendar/[id]), pripomienky deň vopred a 2 h pred; nie Google odkaz | 10 | Adelka má iPhone |
| Funkcie Vercelu v fra1 (pri Supabase); domov ~9 500 ponúk → posielať malý index, karty po 30 | 11 | Rýchlosť na mobile |
| Uložené, Nastavenia, Nápoveda z appky ako @modal panel nad mapou; karty cez GET /api/listing-cards | 11 | Mapa sa nestavia znova |
| Novinky v zozname NOVELTIES (src/lib/novelties.tsx), max 1 za návštevu, najstaršia nevidená, kľúč na zariadení | 10 | Nová novinka = nová položka |
| Pusinky z reklám pod kľúčom adelka.ad.kisses.v2, na Lubkových zariadeniach sa nepočítajú ani neposielajú | 10/2026 | Počíta sa len Adelke |
| Okolie bez pásu od mora (index posiela aj domy mimo pásu, riedky zoznam `out`); okruh 5–100 km len čipmi; Prehľadať tento okruh = jednorazový Apify kruh (bandKm null), nesleduje sa, pauza 10 min | 12 | Fosdinovo: domy vo vnútrozemí viditeľné v okolí |
| Verzia appky: package.json + commit z Vercelu + dátum buildu, v menu a Nápovede; fáza = +0.1, oprava = +0.0.1 | 12 | 0.4.0 od fázy 12 |
| HelpTip (otáznik s vysvetlením) pri zložitejších funkciách, odkaz na /napoveda#id | 12 | V 12-02 povinne v paneli provincií |

### Deferred Issues

| Issue | Origin | Effort | Revisit |
|-------|--------|--------|---------|
| Rovnaký dom na oboch portáloch sa zobrazí dvakrát | v0.2 | M | Po prvých dňoch reálnych dát |
| Prenájom vs. len kúpa (PRD §7) | Init | S | Ďalší milestone |
| Mesačný rozpočet na API (PRD §7) | Init | S | Po týždni reálneho behu |
| Otestovať naživo: AI prehľad lokality, draft emailu, Resend | 2 | S | Teraz (kľúče sú nastavené) |
| P1: porovnanie inzerátov, push notifikácie, filter vzdialenosti od mora | PRD | M | Ďalší milestone |

### Git State
Last commit: 49599e8, branch main, pushnuté a nasadené na Vercel 2026-10-29
Feature branches merged: none

### Blockers/Concerns

| Blocker | Impact | Resolution Path |
|---------|--------|-----------------|
| Email o ťuknutiach v reklame (Resend) – neoverený naživo | Lubko nemusí dostať email | Overiť po prvom ťuknutí; prípadne LUBKO_EMAIL / doména v Resende |
| Migrácia 20260924_privitanie.sql – neoverená | Privítanie, zlacnenia, Pozrieť teraz | Ľubo potvrdí / otestuje „Pozrieť teraz“ |
| DNS adel.orszagh.online | Doména nesmeruje na Vercel | Vercel → Domains, CNAME na Webglobe |

## Session Continuity

Last session: 2026-10-29 (večer)
Stopped at: 12-01 APPLY hotový (neskommitované), checkpoint human-verify
Next action: Ľubo: „vyhoď to“ a overiť na mobile; potom /paul:unify .paul/phases/12-okolie/12-01-PLAN.md
Resume file: .paul/phases/12-okolie/12-01-PLAN.md
Resume context:
- Od rána pribudlo: duplicity z 2 portálov = 1 karta (lib/duplicates.ts), Plán obhliadok (lib/visits.ts, VisitForm, Uložené), prihlásenie ako západ slnka s plachetnicami a srdiečkami (prihlasenie/RivieraScene.tsx), logo so srdiečkom vyrezaným maskou, /aktivita pre Lubka (lib/activity.ts, ActivityPing; Lubkove zariadenia označené cez /aktivita alebo ?lubko=1)
- Adelka cestuje po Taliansku – okolie, Google Maps/Waze, štítky Nové/Nevidela/Videla
- Apify Starter: limit 19 USD, rozpočet 18,50 USD, 200 ponúk/portál/oblasť, odhad ceny v okne sťahovania
- Jednotné zatváranie (CloseBar + navigation.tsx), SW cache mená tiles/photos NEMENIŤ
- Žiadne emoji v UI; reklamy zapnuté; texty Ľuba preberať doslova (spisovne len na požiadanie)
- .paul/paul.json zmazaný a paul.toml/ledger.toml nové – nie od Claude, bez commitu

---
*STATE.md — Updated after every significant action*
