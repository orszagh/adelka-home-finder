# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-09-25)

**Core value:** Adelka nájde vhodný domček pri talianskom mori z jedného jednoduchého miesta.
**Current focus:** v0.3 hotová a nasadená – ďalší míľnik podľa dohody

## Current Position

Milestone: v0.3 Dizajn, UX a domčeky pri mori (v0.3.0) – Complete
Phase: 8 of 8 (Značka a zábava) – Complete
Plan: 08-01, 08-02 complete
Status: Milestone v0.3 complete
Last activity: 2026-09-25 — Phase 8 complete (logo Higgsfield č. 4, názov, reklamy s míľnikmi, sledovanie ťuknutí), v0.3 hotová

Progress:
- v0.1: [██████████] 100% (live)
- v0.2: [██████████] 100% (live od 2026-09-24)
- v0.3: [██████████] 100% (live od 2026-09-25)

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [v0.3 complete - ready for next milestone]
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

### Deferred Issues

| Issue | Origin | Effort | Revisit |
|-------|--------|--------|---------|
| Rovnaký dom na oboch portáloch sa zobrazí dvakrát | v0.2 | M | Po prvých dňoch reálnych dát |
| Prenájom vs. len kúpa (PRD §7) | Init | S | Ďalší milestone |
| Mesačný rozpočet na API (PRD §7) | Init | S | Po týždni reálneho behu |
| Otestovať naživo: AI prehľad lokality, draft emailu, Resend | 2 | S | Teraz (kľúče sú nastavené) |
| P1: porovnanie inzerátov, push notifikácie, filter vzdialenosti od mora | PRD | M | Ďalší milestone |

### Git State
Last commit: 88c449c (fáza 7), branch main, pushnuté a nasadené na Vercel 2026-09-25
Feature branches merged: none

### Blockers/Concerns

| Blocker | Impact | Resolution Path |
|---------|--------|-----------------|
| Email o ťuknutiach v reklame (Resend) – neoverený naživo | Lubko nemusí dostať email | Overiť po prvom ťuknutí; prípadne LUBKO_EMAIL / doména v Resende |
| Migrácia 20260924_privitanie.sql – neoverená | Privítanie, zlacnenia, Pozrieť teraz | Ľubo potvrdí / otestuje „Pozrieť teraz“ |
| DNS adel.orszagh.online | Doména nesmeruje na Vercel | Vercel → Domains, CNAME na Webglobe |

## Session Continuity

Last session: 2026-09-25
Stopped at: v0.3 complete and deployed
Next action: /paul:complete-milestone (v0.3), potom /paul:discuss-milestone pre ďalší míľnik
Resume file: .paul/ROADMAP.md
Resume context:
- Fáza 5 hotová: pás 3 km predvolene, /nastavenia, štítok na mape, kreslenie preč
- Fáza 8 hotová: logo Higgsfield č. 4, názov La casetta di Adelka, reklamy (?reklama=1 na skúšku), míľniky 3/10 pusí, email Lubkovi pri ťuknutí
- Fáza 7 hotová: Fraunces/DM Sans, ui.tsx, karta sťahovania s loďkou, toasty, srdiečko, nábeh kariet
- Fáza 6 hotová: tokeny + tmavý režim (cookie adelka_theme), hamburger menu, odhlásenie. Otvorené: podpora light-dark() na Adelkinom mobile (prehliadač 2024+)
- Fáza 5 live od 2026-09-25: vnútrozemské ponuky skryté; zmena pásu na /nastavenia hneď spustí Apify sťahovanie. Prvý ranný cron s pásom 3 km: 26. 9.
- Lokálne overovanie: preview "dev-mock" (port 3100, ukážkové dáta, bez hesla, bez produkčnej DB)
- Návrh dizajnu: https://claude.ai/artifact/ECjAcFZZTRyaQVVH7ABJs6 (fázy 6–8)
- Skontrolovať ranný cron 25. 9. v Apify (APIFY_TOKEN v .env.local)

---
*STATE.md — Updated after every significant action*
