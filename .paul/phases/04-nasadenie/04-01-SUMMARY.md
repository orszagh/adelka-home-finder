---
phase: 04-nasadenie
plan: 01
subsystem: auth
tags: [proxy, cookie-session, vercel, docs]
provides:
  - src/proxy.ts: prístup len s heslom (APP_PASSWORD), produkcia bez hesla je zamknutá
  - /prihlasenie: formulár, httpOnly cookie na 1 rok, návrat na pôvodnú stránku
  - README (SK), .env.example, .gitattributes (LF), vercel.json framework nextjs
key-decisions:
  - "Heslo + cookie namiesto Basic Auth (na iPhone pohodlnejšie, správca hesiel)"
  - "Token = HMAC(APP_PASSWORD) – zmena hesla odhlási všetky zariadenia, žiadna tabuľka relácií"
  - "Bezpečný default: produkcia bez APP_PASSWORD vracia 503"
completed: 2026-09-23
---

# Phase 4 Plan 01: Produkčné nasadenie Summary

**Appka je chránená heslom, zdokumentovaná po slovensky a pushnutá na GitHub, odkiaľ ju Vercel nasadí.**

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Bezpečný default | Pass | prod bez APP_PASSWORD → 503 s návodom |
| AC-2: Prihlásenie | Pass | 307 na /prihlasenie?next=…, API 401; zlé heslo 200 + chyba; správne 303 + cookie → /ulozene 200 |
| AC-3: Výnimky | Pass | /api/cron/sync so secretom 200, /mock-photo 200 bez prihlásenia |
| AC-4: Dokumentácia a nasadenie | Pass | README, .env.example; push na origin/main |

## Deviations from Plan
- Prihlásenie v prehliadači nebolo testované vpisovaním hesla; tok overený odoslaním formulára cez curl (bez JS) + unit testy.

## Next Phase Readiness
**Blockers (na strane používateľa):** nastaviť premenné vo Verceli (APP_PASSWORD, ANTHROPIC_API_KEY, CRON_SECRET, RESEND_API_KEY, NOTIFY_EMAIL), DNS na Webglobe.

---
*Completed: 2026-09-23*
