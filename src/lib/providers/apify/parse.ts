/** Tolerant readers for scraper output, whose fields may be missing or mistyped. */

export function str(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length > 0 ? text : null;
}

/** Numbers, numeric strings, and values like "5+" or "104 m²". */
export function num(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const match = value.replace(/\s/g, "").match(/^-?\d+(?:[.,]\d+)?/);
  return match ? Number(match[0].replace(",", ".")) : null;
}

const MAX_PHOTOS = 20;

export function photoList(urls: (string | null)[]): string[] {
  return [...new Set(urls.filter((u): u is string => u !== null && u.startsWith("https://")))].slice(0, MAX_PHOTOS);
}

const MAX_TITLE = 140;

/** Tames ALL-CAPS agency captions and overly long titles. */
export function cleanTitle(title: string | null, fallback: string): string {
  if (!title) return fallback;
  const letters = title.replace(/[^\p{L}]/gu, "");
  const shouting = letters.length > 8 && letters === letters.toUpperCase();
  const text = shouting ? title.charAt(0) + title.slice(1).toLowerCase() : title;
  return text.length > MAX_TITLE ? `${text.slice(0, MAX_TITLE - 1).trimEnd()}…` : text;
}
