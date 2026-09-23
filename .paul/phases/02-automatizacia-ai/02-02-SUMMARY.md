---
phase: 02-automatizacia-ai
plan: 02
subsystem: ai
tags: [anthropic-sdk, claude-opus-5, structured-outputs, zod]
provides:
  - generateStructured(): client.beta.messages.parse + zodOutputFormat, server-side fallbacks "default"
  - POST /api/location-summary (propertyId, refresh) s cache v location_notes
  - LocationSummary komponent na detaile inzerátu
key-files:
  created: [src/lib/ai/claude.ts, src/lib/ai/location.ts, src/app/api/location-summary/route.ts, src/components/LocationSummary.tsx, src/lib/ai/location.test.ts, src/app/api/location-summary/route.test.ts]
  modified: [src/app/inzerat/[id]/page.tsx]
tech-stack:
  added: ["@anthropic-ai/sdk 0.128", "zod 4"]
key-decisions:
  - "Model claude-opus-5 (prepísateľný cez ANTHROPIC_MODEL), effort medium"
  - "Server-side fallback pri odmietnutí zapnutý (beta server-side-fallback-2026-07-01)"
  - "Bez web search – prehľad z vedomostí modelu s viditeľným upozornením na overenie (ISPRA IdroGEO)"
  - "Mesto/región sa berie z DB podľa propertyId (nie voľný text)"
completed: 2026-09-23
---

# Phase 2 Plan 02: AI prehľad lokality Summary

**Na detaile inzerátu jedno ťuknutie vygeneruje cez Claude (štruktúrovaný výstup) slovenský prehľad lokality v 4 sekciách; výsledok sa cachuje pre celé mesto.**

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Prehľad na vyžiadanie | Pass (mock AI) | route test s namockovaným generateStructured; živé volanie neoverené – lokálne chýba ANTHROPIC_API_KEY |
| AC-2: Cache | Pass | druhé volanie bez AI, refresh zavolá AI znova |
| AC-3: Chyby a poctivosť | Pass | bez kľúča: tlačidlo neaktívne + vysvetlenie; AiError → 503 so slovenskou správou |
| AC-4: Bez zneužitia | Pass | 400 bez propertyId, 404 pre neznámy inzerát |

## Next Phase Readiness
**Ready:** generateStructured je pripravený pre drafty správ (03-01).
**Concerns:** Prvé živé volanie treba overiť na Vercel preview po nastavení ANTHROPIC_API_KEY.

---
*Completed: 2026-09-23*
