---
phase: 03-komunikacia
plan: 01
subsystem: ai
tags: [claude-opus-5, structured-outputs, mailto]
requires:
  - phase: 02-02
    provides: generateStructured
provides:
  - POST /api/draft → {subject_it, body_it, translation_sk}, nič neodosiela
  - MessageDraft komponent: zámer + rýchle návrhy, podpis (localStorage), editovateľný draft, SK preklad, mailto + kopírovanie
key-files:
  created: [src/lib/ai/draft.ts, src/lib/message.ts, src/app/api/draft/route.ts, src/app/api/draft/route.test.ts, src/components/MessageDraft.tsx]
  modified: [src/app/inzerat/[id]/page.tsx]
key-decisions:
  - "Odoslanie len cez mailto (Adelkin emailový klient) alebo kopírovanie – server nemá žiadnu odosielaciu cestu"
  - "Draft po taliansky (formálne Lei) + slovenský preklad pre kontrolu"
  - "Prompt zakazuje vymýšľať termíny, sumy a sľuby"
  - "mailto/limity v src/lib/message.ts, aby zod nešiel do klientskeho balíka"
completed: 2026-09-23
---

# Phase 3 Plan 01: Komunikačný modul Summary

**Adelka napíše zámer po slovensky, AI pripraví taliansky email so slovenským prekladom, ona ho upraví a odošle sama zo svojho emailu.**

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Draft zo zámeru | Pass (mock AI) | route test + prehliadač s podvrhnutou odpoveďou; prompt obsahuje údaje inzerátu z DB a podpis |
| AC-2: Nič sa neodošle automaticky | Pass | API vracia len text; UI: mailto a kopírovanie + výslovné upozornenie |
| AC-3: Validácia a chyby | Pass | 400 prázdny/dlhý zámer, 404 neznámy inzerát, 503 AiError |

## Deviations from Plan
- `@` v mailto adrese sa nekóduje (kompatibilita emailových klientov).

## Next Phase Readiness
**Concerns:** Živé volanie Claude API overiť po nastavení ANTHROPIC_API_KEY.

---
*Completed: 2026-09-23*
