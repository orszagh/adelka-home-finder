"use client";

import { useSyncExternalStore } from "react";

/**
 * Listings opened in this visit. The list of cards stays cached (no reload after
 * closing a detail), so the cards read this to switch "Nevidela" to "Videla" at once;
 * the server remembers it for the next visit and the other device.
 */
const opened = new Set<string>();
const listeners = new Set<() => void>();

export function rememberOpened(id: string) {
  if (opened.has(id)) return;
  opened.add(id);
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useOpened(id: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => opened.has(id),
    () => false,
  );
}
