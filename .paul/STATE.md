# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-09-23)

**Core value:** Adelka nájde vhodný domček pri talianskom mori z jedného jednoduchého miesta.
**Current focus:** Reálne dáta cez Apify + ranné privítanie hotové v kóde; čaká na zapnutie vo Verceli a migráciu

## Current Position

Milestone: v0.2 Reálne dáta a privítanie (mimo pôvodnej roadmapy, na požiadanie)
Status: Implemented, not yet switched on in production
Last activity: 2026-09-25 — Apify provider (Idealista + Immobiliare), overovanie aktuálnosti, ranné privítanie, Pozrieť teraz, testovací email

Progress:
- v0.1: [██████████] 100%
- v0.2: [████████░░] 80% (chýba zapnutie v produkcii a nápad s regiónmi)

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ◉     [Čaká na overenie v produkcii]
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

### Deferred Issues

| Issue | Origin | Effort | Revisit |
|-------|--------|--------|---------|
| Klikateľné talianske regióny/provincie namiesto obdĺžnikových predvolieb | v0.2 | M | Po rozhodnutí používateľa |
| Rovnaký dom na oboch portáloch sa zobrazí dvakrát | v0.2 | M | Po prvých dňoch reálnych dát |
| Prenájom vs. len kúpa (PRD §7) | Init | S | Ďalší milestone |
| Mesačný rozpočet na API (PRD §7) | Init | S | Po týždni reálneho behu |
| Otestovať naživo: AI prehľad lokality, draft emailu, Resend | 2 | S | Teraz (kľúče sú nastavené) |
| P1: porovnanie inzerátov, push notifikácie, filter vzdialenosti od mora | PRD | M | Ďalší milestone |

### Blockers/Concerns

| Blocker | Impact | Resolution Path |
|---------|--------|-----------------|
| Vercel: PROPERTY_PROVIDER=apify, APIFY_TOKEN | Produkcia stále na mock dátach | Pridať premenné → Redeploy |
| Migrácia 20260924_privitanie.sql | Privítanie, zlacnenia, Pozrieť teraz vypnuté | Supabase → SQL Editor |
| DNS adel.orszagh.online | Doména nesmeruje na Vercel | Vercel → Domains, CNAME na Webglobe |

## Session Continuity

Last session: 2026-09-25
Stopped at: v0.2 implementované a pushnuté
Next action: Zapnúť Apify vo Verceli, spustiť migráciu, rozhodnúť o regiónoch
Resume context: README.md, supabase/migrations/20260924_privitanie.sql

---
*STATE.md — Updated after every significant action*
