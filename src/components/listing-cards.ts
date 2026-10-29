"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { ListingCardData } from "@/lib/types";

/**
 * Cards fetched in this visit, kept outside the page: back on the map after the detail or a menu
 * page they are there at once instead of being fetched again.
 */
const cards = new Map<string, ListingCardData>();
/** Asked for, but no longer in the database: not asked again. */
const gone = new Set<string>();
const listeners = new Set<() => void>();
let version = 0;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function store(asked: string[], fetched: ListingCardData[]) {
  for (const card of fetched) cards.set(card.id, card);
  for (const id of asked) if (!cards.has(id)) gone.add(id);
  version++;
  for (const listener of listeners) listener();
}

/** At most what the server returns in one call. */
const CHUNK = 60;

async function fetchCards(ids: string[]): Promise<ListingCardData[]> {
  const response = await fetch(`/api/listing-cards?ids=${ids.map(encodeURIComponent).join(",")}`);
  if (!response.ok) throw new Error(`Cards: ${response.status}`);
  return response.json();
}

/** The cards of these listings; missing ones are fetched. `failed` when the last fetch did not get through. */
export function useListingCards(ids: string[]) {
  useSyncExternalStore(subscribe, () => version, () => version);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const key = ids.filter((id) => !cards.has(id) && !gone.has(id)).join(",");

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const missing = key.split(",");
    const chunks = Array.from({ length: Math.ceil(missing.length / CHUNK) }, (_, i) => missing.slice(i * CHUNK, (i + 1) * CHUNK));
    Promise.all(chunks.map(fetchCards))
      .then((results) => {
        // Kept even when the list has moved on: the cards are in the shared cache for later.
        store(missing, results.flat());
        if (!cancelled) setFailed(false);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [key, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { cards, failed: failed && key !== "", retry };
}
