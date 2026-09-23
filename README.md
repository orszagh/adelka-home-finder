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
| `PROPERTY_PROVIDER` | nie | Zdroj inzerátov, zatiaľ len `mock`. |

## Nasadenie (Vercel)

Vercel projekt je prepojený s týmto repozitárom, takže každý push na `main` sa nasadí automaticky.

1. **Vercel → Settings → Environment Variables** (Production aj Preview): pridaj `APP_PASSWORD`, `ANTHROPIC_API_KEY`, `CRON_SECRET` (napr. výstup `openssl rand -hex 32`), `RESEND_API_KEY` a `NOTIFY_EMAIL`. Supabase premenné už sú nastavené.
2. Po pridaní premenných daj **Redeploy** (premenné sa načítajú až pri novom nasadení).
3. **Cron** sa zapne sám podľa [vercel.json](vercel.json): denne o 6:00 UTC zavolá `/api/cron/sync`. Na Hobby pláne je možný najviac 1× denne; častejšie ho môže volať napr. n8n s hlavičkou `Authorization: Bearer <CRON_SECRET>`.
4. **Resend:** založ účet na resend.com a vytvor API kľúč. Kým neoveríš doménu `orszagh.online` (DNS záznamy na Webglobe), odosielateľ `onboarding@resend.dev` dokáže posielať len na email, ktorým si sa v Resende registroval.

### Doména adel.orszagh.online

1. Vercel → projekt → **Settings → Domains → Add** → `adel.orszagh.online`.
2. Vercel ukáže DNS záznam (pre subdoménu typicky `CNAME adel → cname.vercel-dns.com`, presnú hodnotu ber z Vercelu).
3. Na **Webglobe** v správe DNS domény `orszagh.online` pridaj tento záznam. Registrátor sa meniť nemusí.
4. Po propagácii (minúty až hodiny) Vercel doménu overí a vystaví HTTPS certifikát.
5. Voliteľne nastav `APP_URL=https://adel.orszagh.online`, aby odkazy v emailoch viedli na doménu.

## Ako to funguje

- **Next.js 16 (App Router), TypeScript, Tailwind 4**, mapa **Leaflet + OpenStreetMap**.
- **Dáta:** `src/lib/providers` definuje rozhranie `PropertyProvider`. Zatiaľ existuje len `mock` (36 ukážkových inzerátov z Ligúrie, Toskánska a Apúlie s ilustračnými obrázkami). Reálny poskytovateľ (RealtyAPI, PropAPIS, Apify…) sa pridá implementovaním rozhrania a registráciou v `PROVIDERS`, UI sa nemení.
- **Databáza:** `src/lib/db` – Supabase repozitár (service_role, len server, `import "server-only"`) a pamäťový fallback pre vývoj. Schéma je v PRD §5.3 a nemenila sa.
- **Sync a notifikácie:** `src/lib/sync.ts` porovná ponuky s DB (nové inzeráty, zmeny cien), `src/lib/notify.ts` zostaví email len z Adelkiných oblastí. Prvý import do prázdnej DB sa nehlási.
- **AI:** `src/lib/ai` – Claude cez `@anthropic-ai/sdk` so štruktúrovaným výstupom (Zod). Pri odmietnutí požiadavky API samo skúsi záložný model (`fallbacks: "default"`). Prehľad lokality sa ukladá do `location_notes` a pre ďalší inzerát v rovnakom meste sa už negeneruje.
- **Emaily realitkám:** server vracia len návrh. Odoslanie je vždy na Adelke (tlačidlo otvorí jej emailovú aplikáciu, prípadne kopírovanie textu).
- **Prístup:** `src/proxy.ts` pustí ďalej len prihlásené zariadenie (cookie na 1 rok). Výnimky sú `/api/cron/*` (vlastné tajomstvo) a `/mock-photo/*` (obrázky v emailoch). Nezávisle od proxy si prihlásenie overuje aj každá stránka, API route a server action (`src/lib/session.ts`), takže obídenie proxy nič nesprístupní.

## Otvorené body

- Výber poskytovateľa reálnych dát o nehnuteľnostiach (cena, pokrytie, licencia) – PRD §7.
- Mesačný rozpočet na API (určí frekvenciu pollingu).
- Prenájom vs. len kúpa.
