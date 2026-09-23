import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, isAuthConfigured, isValidSession } from "./auth";

/**
 * Checked inside every page, route handler and server action, independently
 * of proxy.ts, so a request that slips past the proxy still gets nothing.
 */
export async function hasSession(): Promise<boolean> {
  if (!isAuthConfigured()) return process.env.NODE_ENV !== "production";
  return isValidSession((await cookies()).get(SESSION_COOKIE)?.value);
}

export async function assertSession(): Promise<void> {
  if (!(await hasSession())) throw new Error("Najprv sa prihlás.");
}

export function unauthorized(): Response {
  return Response.json({ error: "Najprv sa prihlás." }, { status: 401 });
}
