"use client";

import { useEffect } from "react";
import { markAppOpened } from "@/app/actions";

/** Set by opening any page with ?lubko=1 (and cleared with ?lubko=0): this device is Lubko's. */
const LUBKO_KEY = "adelka.lubko";
const LAST_PING_KEY = "adelka.opened.at";
/** Coming back to the app after this long counts as opening it again. */
const NEW_OPEN_MS = 30 * 60_000;

export function isLubkoDevice(): boolean {
  try {
    return localStorage.getItem(LUBKO_KEY) === "1";
  } catch {
    return false;
  }
}

/** Tells the server when Adelka opens the app (for Lubko's /aktivita page). Nothing on Lubko's devices. */
export function ActivityPing() {
  useEffect(() => {
    const flag = new URLSearchParams(window.location.search).get("lubko");
    try {
      if (flag === "1") localStorage.setItem(LUBKO_KEY, "1");
      if (flag === "0") localStorage.removeItem(LUBKO_KEY);
    } catch {}
    if (isLubkoDevice()) return;

    const ping = () => {
      try {
        const last = Number(localStorage.getItem(LAST_PING_KEY)) || 0;
        if (Date.now() - last < NEW_OPEN_MS) return;
        localStorage.setItem(LAST_PING_KEY, String(Date.now()));
      } catch {
        return;
      }
      markAppOpened().catch(() => {});
    };
    ping();
    const onVisible = () => document.visibilityState === "visible" && ping();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);
  return null;
}
