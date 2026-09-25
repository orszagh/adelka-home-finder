import { formatPrice, roomsLabel } from "./format";
import { pointInArea } from "./geo";
import type { Property, SearchArea, SyncResult } from "./types";

export type Digest = { subject: string; html: string; text: string; count: number };

type Item = { property: Property; previousPrice?: number | null; areaNames: string[] };

export function getAppUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

/** Names of the areas a listing falls into; with no areas defined, every listing counts. */
function matchAreas(property: Property, areas: SearchArea[]): string[] | null {
  if (areas.length === 0) return [];
  const names = areas
    .filter((a) => pointInArea(property.longitude, property.latitude, a.polygon))
    .map((a) => a.name);
  return names.length > 0 ? names : null;
}

/** Email about new listings and price changes inside Adelka's areas, or null if nothing to report. */
export function buildDigest(result: SyncResult, areas: SearchArea[], appUrl: string): Digest | null {
  if (result.initialImport) return null;
  const collect = (property: Property, previousPrice?: number | null): Item[] => {
    const areaNames = matchAreas(property, areas);
    return areaNames === null ? [] : [{ property, previousPrice, areaNames }];
  };
  const fresh = result.inserted.flatMap((p) => collect(p));
  const changed = result.priceChanged.flatMap((c) => collect(c.property, c.previousPrice));
  const count = fresh.length + changed.length;
  if (count === 0) return null;

  const parts = [
    fresh.length > 0 ? `${fresh.length} ${plural(fresh.length, "nový inzerát", "nové inzeráty", "nových inzerátov")}` : null,
    changed.length > 0 ? `${changed.length} ${plural(changed.length, "zmena ceny", "zmeny cien", "zmien cien")}` : null,
  ].filter(Boolean);
  const subject = `La casetta di Adelka: ${parts.join(", ")}`;

  const section = (title: string, items: Item[]) =>
    items.length === 0
      ? ""
      : `<h2 style="font-size:18px;margin:24px 0 8px">${escapeHtml(title)}</h2>${items.map((i) => itemHtml(i, appUrl)).join("")}`;

  const html = `<!doctype html><html lang="sk"><body style="margin:0;padding:16px;background:#f8fafc;font-family:system-ui,Arial,sans-serif;color:#0f172a">
<div style="max-width:560px;margin:0 auto">
<h1 style="font-size:20px;margin:0 0 4px">Novinky v tvojich oblastiach</h1>
<p style="margin:0;color:#475569">${escapeHtml(parts.join(", "))}</p>
${section("Nové inzeráty", fresh)}
${section("Zmeny cien", changed)}
<p style="margin-top:24px"><a href="${escapeHtml(appUrl)}" style="color:#0e7490">Otvoriť appku</a></p>
</div></body></html>`;

  const text = [
    subject,
    "",
    ...(fresh.length ? ["NOVÉ INZERÁTY", ...fresh.map((i) => itemText(i, appUrl)), ""] : []),
    ...(changed.length ? ["ZMENY CIEN", ...changed.map((i) => itemText(i, appUrl)), ""] : []),
    appUrl,
  ].join("\n");

  return { subject, html, text, count };
}

function priceLine(item: Item): string {
  const now = formatPrice(item.property.price);
  if (item.previousPrice === undefined) return now;
  return `${formatPrice(item.previousPrice)} → ${now}`;
}

function details(p: Property): string {
  return [p.area_sqm ? `${p.area_sqm} m²` : null, p.rooms ? roomsLabel(p.rooms) : null, `${p.city}, ${p.region}`]
    .filter(Boolean)
    .join(" · ");
}

function absolute(url: string, appUrl: string): string {
  return url.startsWith("/") ? `${appUrl}${url}` : url;
}

function itemHtml(item: Item, appUrl: string): string {
  const p = item.property;
  const link = `${appUrl}/inzerat/${p.id}`;
  const photo = p.photos[0]
    ? `<img src="${escapeHtml(absolute(p.photos[0], appUrl))}" alt="" width="160" style="display:block;width:160px;height:107px;object-fit:cover;border-radius:8px">`
    : "";
  const drop =
    item.previousPrice != null && p.price != null && p.price < item.previousPrice
      ? ` <span style="color:#047857">▼ lacnejšie</span>`
      : "";
  const areas = item.areaNames.length ? `<div style="color:#64748b;font-size:13px">Oblasť: ${escapeHtml(item.areaNames.join(", "))}</div>` : "";
  return `<a href="${escapeHtml(link)}" style="display:block;text-decoration:none;color:inherit;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:8px;margin-bottom:8px">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="vertical-align:top;padding-right:12px">${photo}</td>
<td style="vertical-align:top">
<div style="font-weight:600;font-size:16px">${escapeHtml(priceLine(item))}${drop}</div>
<div>${escapeHtml(p.title)}</div>
<div style="color:#64748b;font-size:14px">${escapeHtml(details(p))}</div>
${areas}
</td></tr></table></a>`;
}

function itemText(item: Item, appUrl: string): string {
  return `- ${priceLine(item)} | ${item.property.title} | ${details(item.property)}\n  ${appUrl}/inzerat/${item.property.id}`;
}

function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  return n >= 2 && n <= 4 ? few : many;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
