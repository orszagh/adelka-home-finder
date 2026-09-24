/** Light, dark, or whatever the phone is set to. Remembered in a cookie so the server renders it. */
export type Theme = "light" | "dark" | "system";

export const THEMES: Theme[] = ["light", "dark", "system"];
export const THEME_COOKIE = "adelka_theme";
export const THEME_MAX_AGE = 365 * 24 * 60 * 60;

export function parseTheme(value: unknown): Theme {
  return THEMES.find((t) => t === value) ?? "system";
}
