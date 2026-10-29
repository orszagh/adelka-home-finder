import type { Repository } from "./db/repo";

/** Listings Adelka has opened, kept on the server so the phone and the computer agree. */
export const SEEN_KEY = "seen_listings";

export async function getSeenIds(repo: Repository): Promise<string[]> {
  const ids = await repo.getState<unknown>(SEEN_KEY);
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
}

/** The badge on a listing card: one at a time, "Nové" first. */
export type ListingBadge = "new" | "seen" | "unseen";

export function listingBadge(isNew: boolean, seen: boolean): ListingBadge {
  if (isNew) return "new";
  return seen ? "seen" : "unseen";
}
