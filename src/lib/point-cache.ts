/** Remembered results stay below this many entries (the oldest go first). */
const MAX_ENTRIES = 50_000;

/**
 * Remembers a slow result that depends only on where a house stands (distance to the sea, its
 * region), for as long as the server instance lives: the home page needs it for every listing on
 * every visit, and the houses do not move.
 */
export function rememberByPoint<T>(compute: (key: string) => T): (key: string) => T {
  const cache = new Map<string, T>();
  return (key) => {
    const cached = cache.get(key);
    if (cached !== undefined || cache.has(key)) return cached as T;
    const value = compute(key);
    if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value!);
    cache.set(key, value);
    return value;
  };
}
