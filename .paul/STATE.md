# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-09-23)

**Core value:** Adelka nájde vhodný domček pri talianskom mori z jedného jednoduchého miesta.
**Current focus:** v0.1 Initial Release dokončený v kóde – čaká na konfiguráciu Vercelu a reálny zdroj dát

## Current Position

Milestone: v0.1 Initial Release (v0.1.0)
Phase: 4 of 4 (Produkčné nasadenie) – Complete
Plan: 04-01 complete
Status: Complete
Last activity: 2026-09-23 22:40 — Všetky 4 fázy dokončené, push na GitHub

Progress:
- Milestone: [██████████] 100%
- Phase: [██████████] 100%

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [Milestone complete]
```

## Accumulated Context

### Decisions

| Decision | Phase | Impact |
|----------|-------|--------|
| Mock dáta za rozhraním PropertyProvider | 1 | Reálny poskytovateľ sa doplní bez zmeny UI |
| Vercel Cron + Resend (bez n8n) | 2 | Menej infraštruktúry; n8n môže volať ten istý endpoint |
| claude-opus-5, structured outputs, fallbacks "default" | 2 | AI len na serveri, cache prehľadov v DB |
| Odoslanie správ len cez mailto/kopírovanie | 3 | Server nemá žiadnu odosielaciu cestu |
| Heslo + HMAC cookie, produkcia bez hesla zamknutá | 4 | Chráni service_role zápisy aj AI kredit |

### Deferred Issues

| Issue | Origin | Effort | Revisit |
|-------|--------|--------|---------|
| Výber poskytovateľa realitných dát (PRD §7) | Init | M | Ďalší milestone |
| Prenájom vs. len kúpa (PRD §7) | Init | S | Ďalší milestone |
| Mesačný rozpočet na API (PRD §7) | Init | S | Pred reálnym pollingom |
| Overiť SupabaseRepository proti živej DB | 1 | S | Po nasadení na Vercel |
| Overiť živé volanie Claude API a Resend | 2 | S | Po nastavení kľúčov vo Verceli |
| P1: porovnanie inzerátov, push notifikácie, história cien, filter vzdialenosti od mora | PRD | M | Ďalší milestone |

### Blockers/Concerns

| Blocker | Impact | Resolution Path |
|---------|--------|-----------------|
| Chýbajú env premenné vo Verceli | Produkcia vracia 503 (zamknuté) | Nastaviť podľa README → Redeploy |
| DNS adel.orszagh.online | Doména nesmeruje na Vercel | Vercel → Domains, CNAME na Webglobe |

## Session Continuity

Last session: 2026-09-23 22:40
Stopped at: Milestone v0.1 complete in code
Next action: Nastaviť Vercel env premenné a overiť nasadenie; potom /paul:discuss-milestone (reálny dátový zdroj)
Resume context: README.md, .paul/phases/04-nasadenie/04-01-SUMMARY.md

---
*STATE.md — Updated after every significant action*
