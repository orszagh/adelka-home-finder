"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

/**
 * The app's own history since it was opened (pages and map views), so closing a
 * page can step back instantly to where Adelka was instead of loading the home
 * page again. Opened from a shared link there is nothing behind it: closing goes home.
 */
const entries: string[] = [];
let popped = false;
let replacing = false;

if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    popped = true;
  });
}

/** The next change of address replaces the current entry (menu page → menu page, map view tweaks). */
export function markReplace() {
  replacing = true;
}

export function NavigationTracker() {
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    const key = search ? `${pathname}?${search}` : pathname;
    if (entries.length === 0) entries.push(key);
    else if (popped) entries.splice(Math.max(1, entries.length - 1));
    else if (replacing) entries[entries.length - 1] = key;
    else if (entries[entries.length - 1] !== key) entries.push(key);
    popped = false;
    replacing = false;
  }, [pathname, search]);

  return null;
}

/** Close a page or panel: back to the previous screen of the app, or home when there is none. */
export function useClosePage() {
  const router = useRouter();
  return useCallback(() => {
    if (entries.length > 1) router.back();
    else router.push("/");
  }, [router]);
}
