# Domček pri mori (adelka-home-finder)

Webová appka pre Adelku na hľadanie domčeka pri mori v Taliansku: mapa s vlastnými oblasťami, ponuky s fotkami, uložené inzeráty s poznámkami, denné emailové upozornenia na nové ponuky a zmeny cien, AI prehľad lokality a AI návrh emailu realitke, ktorý Adelka vždy odosiela sama.

Špecifikácia: [.paul/Adelka_Home_Finder_PRD.md](.paul/Adelka_Home_Finder_PRD.md) · Stav projektu: [.paul/STATE.md](.paul/STATE.md)

## Lokálne spustenie

```bash
npm install
npm run dev
```

Otvor http://localhost:3000. Bez akýchkoľvek premenných prostredia appka beží s ukážkovými inzerátmi a ukladá do pamäte (po reštarte sa dáta stratia). Na prácu so skutočnou databázou skopíruj `.env.example` do `.env.local` a doplň hodnoty.

| Príkaz | Čo robí |
|---|---|
| `npm run dev` | vývojový server |
| `npm test` | unit testy (Vitest) |
| `npm run lint` | ESLint |
| `npm run build` | produkčný build |
| `npm run test:live` | živý test Apify pre Sanremo (míňa cca 0,03 USD, potrebuje `APIFY_TOKEN` v `.env.local`) |

## Premenné prostredia

| Premenná | Povinná | Na čo slúži |
|---|---|---|
| `APP_PASSWORD` | áno (produkcia) | Heslo na prihlásenie. Bez neho je produkčná appka zamknutá. Zmena hesla odhlási všetky zariadenia. |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | áno | Databáza. Všetky dotazy idú len zo servera cez service_role kľúč. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | nie | Appka ho nepoužíva (RLS bez policies), môže ostať nastavený. |
| `ANTHROPIC_API_KEY` | pre AI | Prehľad lokality a návrhy emailov. Bez neho sú AI tlačidlá neaktívne. |
| `ANTHROPIC_MODEL` | nie | Predvolený `claude-opus-5`. |
| `CRON_SECRET` | pre notifikácie | Chráni `/api/cron/sync`. Vercel ho posiela automaticky. |
| `RESEND_API_KEY`, `NOTIFY_EMAIL` | pre notifikácie | Odoslanie upozornení. Bez nich sync beží, len sa neposiela email. |
| `EMAIL_FROM` | nie | Odosielateľ. Vlastná adresa vyžaduje overenú doménu v Resende. |
| `APP_URL` | nie | Adresa pre odkazy v emailoch (predvolene produkčná Vercel URL). |
| `PROPERTY_PROVIDER` | nie | `mock` (ukážkové dáta, predvolené) alebo `apify` (reálne inzeráty z Idealista.it a Immobiliare.it). |
| `APIFY_TOKEN` | pre `apify` | Apify API token. |
| `APIFY_MAX_ITEMS`, `APIFY_MAX_CHARGE_USD` | nie | Limit inzerátov na portál a oblasť (50) a max. cena jedného behu (0,25 USD). |
| `APIFY_RECHECK_MAX` | nie | Koľko starších ponúk denne overiť priamo podľa ID (100). |

## Nasadenie (Vercel)

Vercel projekt je prepojený s týmto repozitárom, takže každý push na `main` sa nasadí automaticky.

1. **Vercel → Settings → Environment Variables** (Production aj Preview): pridaj `APP_PASSWORD`, `ANTHROPIC_API_KEY`, `CRON_SECRET` (napr. výstup `openssl rand -hex 32`), `RESEND_API_KEY` a `NOTIFY_EMAIL`. Supabase premenné už sú nastavené.
2. Po pridaní premenných daj **Redeploy** (premenné sa načítajú až pri novom nasadení).
3. **Databázová migrácia:** v Supabase → SQL Editor spusti raz [supabase/migrations/20260924_privitanie.sql](supabase/migrations/20260924_privitanie.sql). Pridá pôvodnú cenu pri zlacnení a tabuľku `app_state` (ranné privítanie, limit ručného sťahovania). Bez nej appka beží, len tieto funkcie sú vypnuté.
4. **Cron** sa zapne sám podľa [vercel.json](vercel.json): denne o 3:00 UTC (5:00 letného, 4:00 zimného času; Hobby plán ho spustí kedykoľvek v rámci tej hodiny) zavolá `/api/cron/sync`. Na Hobby pláne je možný najviac 1× denne; častejšie ho môže volať napr. n8n s hlavičkou `Authorization: Bearer <CRON_SECRET>`.
5. **Resend:** založ účet na resend.com a vytvor API kľúč. Kým neoveríš doménu `orszagh.online` (DNS záznamy na Webglobe), odosielateľ `onboarding@resend.dev` dokáže posielať len na email, ktorým si sa v Resende registroval.

### Doména adel.orszagh.online

1. Vercel → projekt → **Settings → Domains → Add** → `adel.orszagh.online`.
2. Vercel ukáže DNS záznam (pre subdoménu typicky `CNAME adel → cname.vercel-dns.com`, presnú hodnotu ber z Vercelu).
3. Na **Webglobe** v správe DNS domény `orszagh.online` pridaj tento záznam. Registrátor sa meniť nemusí.
4. Po propagácii (minúty až hodiny) Vercel doménu overí a vystaví HTTPS certifikát.
5. Voliteľne nastav `APP_URL=https://adel.orszagh.online`, aby odkazy v emailoch viedli na doménu.

## Ako to funguje

- **Next.js 16 (App Router), TypeScript, Tailwind 4**, mapa **Leaflet + OpenStreetMap**.
- **Dáta:** `src/lib/providers` definuje rozhranie `PropertyProvider`. `mock` generuje 36 ukážkových inzerátov. `apify` volá cez Apify REST API dva scrapery pre každú Adelkinu oblasť: [igolaizola/idealista-scraper](https://apify.com/igolaizola/idealista-scraper) (kruh okolo oblasti) a [memo23/immobiliare-scraper](https://apify.com/memo23/immobiliare-scraper) (presne polygón oblasti cez `vrt`), zoradené od najnovších. Nová oblasť stiahne ponuky hneď, ostatné dopĺňa denný cron. Pri prepnutí zdroja sa ukážkové inzeráty zmažú a prvý import sa nehlási emailom.
- **Databáza:** `src/lib/db` – Supabase repozitár (service_role, len server, `import "server-only"`) a pamäťový fallback pre vývoj. Pôvodná schéma je v PRD §5.3, doplnky sú v `supabase/migrations`.
- **Sync a notifikácie:** `src/lib/sync.ts` porovná ponuky s DB (nové inzeráty, zmeny cien), `src/lib/notify.ts` zostaví email len z Adelkiných oblastí. Prvý import do prázdnej DB sa nehlási.
- **Ranné privítanie:** po otvorení appky „Dobré ráno, Adelka ☕ Lubko ti v noci našiel X nových inzerátov (a Y zlacnených)…“ podľa dennej doby (časové pásmo Bratislava). Počítajú sa len ponuky v jej oblastiach, ktoré pribudli alebo zlacneli od chvíle, keď naposledy ťukla „Ukázať mi ich“ alebo privítanie zavrela. Tlačidlo ukáže len tieto ponuky.
- **Aktuálnosť ponúk:** denný cron overí podľa ID ponuky, ktoré vyhľadávanie 36 h nevrátilo. Čo 4 dni nikto nepotvrdí, považuje sa za predané: zo zoznamu zmizne, v uložených ostane s označením „Už nie je v ponuke“. Pri overovaní sa zachytia aj zlacnenia starších ponúk.
- **Pozrieť teraz:** ručné stiahnutie čerstvých ponúk, najviac raz za hodinu (kontroluje sa na serveri, kvôli cene Apify).
- **AI:** `src/lib/ai` – Claude cez `@anthropic-ai/sdk` so štruktúrovaným výstupom (Zod). Pri odmietnutí požiadavky API samo skúsi záložný model (`fallbacks: "default"`). Prehľad lokality sa ukladá do `location_notes` a pre ďalší inzerát v rovnakom meste sa už negeneruje.
- **Emaily realitkám:** server vracia len návrh. Odoslanie je vždy na Adelke (tlačidlo otvorí jej emailovú aplikáciu, prípadne kopírovanie textu).
- **Prístup:** `src/proxy.ts` pustí ďalej len prihlásené zariadenie (cookie na 1 rok). Výnimky sú `/api/cron/*` (vlastné tajomstvo) a `/mock-photo/*` (obrázky v emailoch). Nezávisle od proxy si prihlásenie overuje aj každá stránka, API route a server action (`src/lib/session.ts`), takže obídenie proxy nič nesprístupní.

## Otvorené body

- Rovnaký dom na oboch portáloch sa zobrazí dvakrát (bez deduplikácie).
- Mesačný rozpočet na API (určí frekvenciu pollingu).
- Prenájom vs. len kúpa.
