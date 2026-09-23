# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-09-23)

**Core value:** Adelka nájde vhodný domček pri talianskom mori z jedného jednoduchého miesta.
**Current focus:** v0.1 Initial Release, Phase 4 (Produkčné nasadenie)

## Current Position

Milestone: v0.1 Initial Release (v0.1.0)
Phase: 4 of 4 (Produkčné nasadenie)
Plan: 04-01 of 1 in current phase
Status: Ready to plan
Last activity: 2026-09-23 22:36 — Fáza 3 dokončená (AI drafty správ, odoslanie len manuálne)

Progress:
- Milestone: [███████▌░░] 75%
- Phase: [░░░░░░░░░░] 0%

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [Phase 3 complete - ready for next PLAN]
```

## Accumulated Context

### Decisions

| Decision | Phase | Impact |
|----------|-------|--------|
| PAUL s importom PRD (bez SEED) | Init | PRD je zdroj pravdy pre požiadavky |
| Mock dáta za rozhraním PropertyProvider | 1 | Reálny poskytovateľ sa doplní bez zmeny UI |
| In-memory fallback bez Supabase env | 1 | Lokálny vývoj bez kľúčov |
| Vlastné kreslenie polygónu ťukaním | 1 | Bez leaflet-draw, mobil-first |
| Vercel Cron + Resend, claude-opus-5 so structured outputs | 2 | Bez n8n; AI len na serveri |

### Deferred Issues

| Issue | Origin | Effort | Revisit |
|-------|--------|--------|---------|
| Výber poskytovateľa realitných dát (PRD §7) | Init | M | Pred nasadením reálnych dát |
| Prenájom vs. len kúpa (PRD §7) | Init | S | Po MVP |
| Mesačný rozpočet na API (PRD §7) | Init | S | Pred zapnutím reálneho pollingu |
| Overiť SupabaseRepository proti živej DB | 1 | S | Po nasadení na Vercel |
| Overiť živé volanie Claude API a Resend | 2 | S | Po nastavení kľúčov vo Verceli |

### Blockers/Concerns
None yet.

## Session Continuity

Last session: 2026-09-23 22:27
Stopped at: Phase 3 complete
Next action: Plán 04-01 (ochrana prístupu, README, nasadenie)
Resume context: .paul/phases/01-mvp-mapa-ponuky/01-02-SUMMARY.md

---
*STATE.md — Updated after every significant action*
