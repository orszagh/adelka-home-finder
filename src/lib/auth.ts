/**
 * Single shared password (APP_PASSWORD). The session cookie holds an HMAC
 * derived from it, so changing the password signs every device out.
 * Uses Web Crypto so it runs both in proxy.ts and in server actions.
 */

export const SESSION_COOKIE = "adelka_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 365;

export function isAuthConfigured(): boolean {
  return Boolean(process.env.APP_PASSWORD);
}

export async function sessionToken(password: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("adelka-session-v1"));
  return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function constantTimeEqual(a: string, b: string): boolean {
  const length = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < length; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export async function isValidSession(cookieValue: string | undefined): Promise<boolean> {
  const password = process.env.APP_PASSWORD;
  if (!password || !cookieValue) return false;
  return constantTimeEqual(cookieValue, await sessionToken(password));
}

/** Only same-site relative paths, so the login form can't be used as an open redirect. */
export function safeNextPath(value: unknown): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")
    ? value
    : "/";
}
