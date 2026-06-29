/**
 * Simple in-memory cache with TTL (Time-To-Live) support.
 * Designed for short-lived configuration data that changes infrequently.
 * Cache lives only for the current app session (cleared on reload/restart).
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const store = new Map<string, CacheEntry<unknown>>()

/**
 * Retrieve a cached value.
 * Returns `undefined` if the key does not exist or has expired.
 */
export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return undefined
  }
  return entry.data as T
}

/**
 * Store a value in the cache with a TTL in milliseconds.
 */
export function cacheSet<T>(key: string, data: T, ttlMs: number): void {
  store.set(key, { data, expiresAt: Date.now() + ttlMs })
}

/**
 * Invalidate (delete) a specific cache key.
 */
export function cacheInvalidate(key: string): void {
  store.delete(key)
}

/**
 * Invalidate all cache keys that start with the given prefix.
 */
export function cacheInvalidatePrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key)
    }
  }
}

/**
 * Fetch from cache or run the fetcher if cache is missing/expired.
 *
 * @example
 * return cacheOrFetch('titles', 5 * 60_000, () => pb.collection('titles').getFullList())
 */
export async function cacheOrFetch<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = cacheGet<T>(key)
  if (cached !== undefined) return cached
  const data = await fetcher()
  cacheSet(key, data, ttlMs)
  return data
}
