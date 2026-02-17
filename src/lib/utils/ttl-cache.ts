/**
 * Lightweight in-memory TTL cache with LRU eviction.
 * Used for caching expensive DB queries (L1 context, org settings)
 * within a serverless function's lifetime.
 *
 * On Vercel, each serverless instance keeps its own cache.
 * Entries expire after `ttlMs` and are evicted LRU when `maxSize` is reached.
 * No external dependencies required.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
}

export class TtlCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly ttlMs: number;
  private readonly maxSize: number;

  constructor(opts: { ttlMs: number; maxSize?: number }) {
    this.ttlMs = opts.ttlMs;
    this.maxSize = opts.maxSize ?? 100;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    entry.lastAccessed = Date.now();
    return entry.value;
  }

  set(key: string, value: T): void {
    // Evict LRU entry if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      let oldestKey: string | null = null;
      let oldestAccess = Infinity;
      for (const [k, v] of this.cache) {
        if (v.lastAccessed < oldestAccess) {
          oldestAccess = v.lastAccessed;
          oldestKey = k;
        }
      }
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
      lastAccessed: Date.now(),
    });
  }

  /** Remove a specific key (useful for cache invalidation) */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /** Clear all entries */
  clear(): void {
    this.cache.clear();
  }

  /** Number of entries (including potentially expired) */
  get size(): number {
    return this.cache.size;
  }
}
