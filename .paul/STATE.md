# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-09-23)

**Core value:** Adelka nájde vhodný domček pri talianskom mori z jedného jednoduchého miesta.
**Current focus:** v0.3 Dizajn, UX a domčeky pri mori – nová session (zadanie v .paul/phases/v0.3-dizajn-ux/ZADANIE.md)

## Current Position

Milestone: v0.3 Dizajn, UX a domčeky pri mori (v0.3.0) – Planned
Phase: 5 of 8 (Pobrežný pás a nastavenia vyhľadávania) – not started
Status: Paused – ďalšia session je venovaná dizajnu a UX/UI
Last activity: 2026-09-24 — Produkcia prepnutá na Apify (overené 12 behov), zapísané zadanie v0.3

Progress:
- v0.1: [██████████] 100% (live)
- v0.2: [██████████] 100% (live od 2026-09-24)
- v0.3: [░░░░░░░░░░] 0%

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ○        ○        ○     [v0.3 – ready for /paul:plan]
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

### Deferred Issues

| Issue | Origin | Effort | Revisit |
|-------|--------|--------|---------|
| Filter „vzdialenosť od mora“ (provincie obsahujú aj vnútrozemské obce) | v0.2 | M | Po prvých reálnych dátach |
| Rovnaký dom na oboch portáloch sa zobrazí dvakrát | v0.2 | M | Po prvých dňoch reálnych dát |
| Prenájom vs. len kúpa (PRD §7) | Init | S | Ďalší milestone |
| Mesačný rozpočet na API (PRD §7) | Init | S | Po týždni reálneho behu |
| Otestovať naživo: AI prehľad lokality, draft emailu, Resend | 2 | S | Teraz (kľúče sú nastavené) |
| P1: porovnanie inzerátov, push notifikácie, filter vzdialenosti od mora | PRD | M | Ďalší milestone |

### Blockers/Concerns

| Blocker | Impact | Resolution Path |
|---------|--------|-----------------|
| Lubkova fotka pre „reklamy“ | Fáza 8 (zábava) | Ľubo dodá fotku |
| Migrácia 20260924_privitanie.sql – neoverená | Privítanie, zlacnenia, Pozrieť teraz | Ľubo potvrdí / otestuje „Pozrieť teraz“ |
| DNS adel.orszagh.online | Doména nesmeruje na Vercel | Vercel → Domains, CNAME na Webglobe |

## Session Continuity

Last session: 2026-09-24
Stopped at: Zadanie v0.3 zapísané, session uzavretá na žiadosť Ľuba
Next action: Nová session – načítať dizajnový skill a navrhnúť Ľubovi dizajn/UX (hamburger menu, nastavenia pobrežia, animácie, tmavý režim, logo, zábava); potom /paul:plan
Resume file: .paul/HANDOFF-2026-09-24.md
Resume context:
- Produkcia live s Apify (Bari, Crotone, Caltanissetta, Catania); výsledky príliš z vnútrozemia
- Zadanie v .paul/phases/v0.3-dizajn-ux/ZADANIE.md (Ľubo očakáva vlastný návrh)
- Skontrolovať prvý ranný cron 25. 9. v Apify (APIFY_TOKEN v .env.local)

---
*STATE.md — Updated after every significant action*
