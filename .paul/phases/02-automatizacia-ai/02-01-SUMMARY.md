---
phase: 02-automatizacia-ai
plan: 01
subsystem: api
tags: [vercel-cron, resend, email]
provides:
  - GET /api/cron/sync (Bearer CRON_SECRET), denne 06:00 UTC cez vercel.json
  - buildDigest: nové inzeráty + zmeny cien v sledovaných oblastiach, HTML aj text
  - sendEmail cez Resend REST API
key-files:
  created: [src/app/api/cron/sync/route.ts, src/lib/notify.ts, src/lib/email.ts, src/lib/secrets.ts, vercel.json, src/lib/notify.test.ts]
  modified: [src/lib/sync.ts, src/lib/types.ts]
key-decisions:
  - "Vercel Cron namiesto n8n (bez ďalšej infraštruktúry); n8n môže volať ten istý endpoint častejšie"
  - "Resend cez fetch, bez SDK"
  - "Prvý import do prázdnej DB sa nehlási (initialImport)"
completed: 2026-09-23
---

# Phase 2 Plan 01: Sync + notifikácie Summary

**Denný chránený cron endpoint, ktorý stiahne ponuky, rozpozná nové a zmenené ceny v Adelkiných oblastiach a pošle jej prehľadný email cez Resend.**

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Chránený cron | Pass | prod build: 401 bez/so zlým secretom, 200 so správnym |
| AC-2: Digest len z oblastí | Pass | 5 unit testov (filtrovanie, bez oblastí, prázdny, escapovanie, prvý import) |
| AC-3: Odoslanie | Pass (čiastočne) | bez kľúčov: "email preskočený"; reálne odoslanie cez Resend overiť po nastavení RESEND_API_KEY |

## Deviations from Plan

1. (Auto-fix) Prvý sync na prázdnej DB by poslal všetkých 36 inzerátov ako nové → pridané `initialImport` do SyncResult.
2. Pomocník `safeEqual` (porovnanie v konštantnom čase) pre CRON_SECRET.

## Next Phase Readiness
**Concerns:** Mock provider nikdy neprinesie nové inzeráty, takže emaily reálne začnú chodiť až s reálnym poskytovateľom dát.

---
*Completed: 2026-09-23*
