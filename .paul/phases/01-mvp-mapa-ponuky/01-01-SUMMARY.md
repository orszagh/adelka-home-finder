---
phase: 01-mvp-mapa-ponuky
plan: 01
subsystem: database
tags: [nextjs16, supabase, vitest, geojson]
requires: []
provides:
  - PropertyProvider rozhranie + deterministický mock provider (36 inzerátov, 18 miest)
  - Repository rozhranie so Supabase (service_role) a in-memory implementáciou
  - syncFromProvider s detekciou nových inzerátov a zmien cien
  - geo utility (bod v polygóne/MultiPolygóne, konverzie pre Leaflet)
affects: [02-automatizacia, 03-komunikacia]
tech-stack:
  added: ["@supabase/supabase-js", server-only, leaflet, react-leaflet, vitest]
  patterns: ["DB len cez getRepo() na serveri", "server-only guard na moduloch so service_role"]
key-files:
  created: [src/lib/types.ts, src/lib/geo.ts, src/lib/providers/index.ts, src/lib/providers/mock.ts, src/lib/db/repo.ts, src/lib/db/supabase.ts, src/lib/db/supabase-repo.ts, src/lib/db/memory-repo.ts, src/lib/sync.ts, src/lib/data.ts]
key-decisions:
  - "In-memory fallback, keď chýbajú Supabase env premenné (lokálny vývoj)"
  - "Pri prázdnej DB sa pri prvom načítaní spustí sync z providera"
  - "@types/node ^24 (konflikt peer závislostí s vitest 5)"
duration: 15min
completed: 2026-09-23
---

# Phase 1 Plan 01: Scaffold + dátová vrstva Summary

**Next.js 16 scaffold s vymeniteľným dátovým providerom (mock), repozitárom nad Supabase/pamäťou a sync logikou s detekciou nových inzerátov a zmien cien.**

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Build a testy | Pass | build, lint, 8/8 testov |
| AC-2: Bod v polygóne | Pass | vrátane dier a MultiPolygon |
| AC-3: Sync | Pass | first_seen_at zachované, stará cena vrátená |
| AC-4: Fallback bez DB | Pass | MemoryRepository cez globalThis |
| AC-5: Service key len na serveri | Pass | `import "server-only"` v supabase.ts, repo.ts, data.ts |

## Deviations from Plan

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 2 | Bez vplyvu na rozsah |

1. `@types/node` zvýšené na ^24 kvôli peer závislosti vitest 5.
2. `vitest.config.mts` namiesto `.ts` (ESM varovanie Vite) + alias `server-only` na prázdny stub v testoch.

## Next Phase Readiness

**Ready:** UI (01-02) môže čítať cez `getProperties()` a `getRepo()`.
**Concerns:** Supabase repo nie je otestované proti živej DB (lokálne nie sú kľúče); overí sa na Vercel preview.
**Blockers:** None

---
*Phase: 01-mvp-mapa-ponuky, Plan: 01*
*Completed: 2026-09-23*
