import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TtlCache } from "../ttl-cache";

// ════════════════════════════════════════════════════════════════════════════
// HAPPY PATH — Basic get/set operations
// ════════════════════════════════════════════════════════════════════════════

describe("TtlCache — Happy Path", () => {
  let cache: TtlCache<string>;

  beforeEach(() => {
    vi.useFakeTimers();
    cache = new TtlCache<string>({ ttlMs: 5000, maxSize: 3 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns undefined for a missing key", () => {
    expect(cache.get("missing")).toBeUndefined();
  });

  it("stores and retrieves a value", () => {
    cache.set("key1", "value1");
    expect(cache.get("key1")).toBe("value1");
  });

  it("overwrites an existing key with a new value", () => {
    cache.set("key1", "original");
    cache.set("key1", "updated");
    expect(cache.get("key1")).toBe("updated");
  });

  it("tracks the number of entries via size", () => {
    expect(cache.size).toBe(0);
    cache.set("a", "1");
    cache.set("b", "2");
    expect(cache.size).toBe(2);
  });

  it("stores different value types", () => {
    const numCache = new TtlCache<number>({ ttlMs: 5000 });
    numCache.set("count", 42);
    expect(numCache.get("count")).toBe(42);
  });

  it("stores object values", () => {
    const objCache = new TtlCache<{ name: string }>({ ttlMs: 5000 });
    const obj = { name: "test" };
    objCache.set("obj", obj);
    expect(objCache.get("obj")).toBe(obj);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// TTL EXPIRY — Time-based eviction
// ════════════════════════════════════════════════════════════════════════════

describe("TtlCache — TTL Expiry", () => {
  let cache: TtlCache<string>;

  beforeEach(() => {
    vi.useFakeTimers();
    cache = new TtlCache<string>({ ttlMs: 5000 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a value before TTL expires", () => {
    cache.set("key1", "value1");
    vi.advanceTimersByTime(4999);
    expect(cache.get("key1")).toBe("value1");
  });

  it("returns undefined after TTL expires", () => {
    cache.set("key1", "value1");
    vi.advanceTimersByTime(5001);
    expect(cache.get("key1")).toBeUndefined();
  });

  it("removes expired entry from the map on access", () => {
    cache.set("key1", "value1");
    expect(cache.size).toBe(1);
    vi.advanceTimersByTime(5001);
    cache.get("key1"); // triggers deletion
    expect(cache.size).toBe(0);
  });

  it("setting a key resets its TTL", () => {
    cache.set("key1", "value1");
    vi.advanceTimersByTime(3000);
    cache.set("key1", "value1-refreshed");
    vi.advanceTimersByTime(3000); // 6000ms total, but only 3000ms since re-set
    expect(cache.get("key1")).toBe("value1-refreshed");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// LRU EVICTION — maxSize enforcement
// ════════════════════════════════════════════════════════════════════════════

describe("TtlCache — LRU Eviction", () => {
  let cache: TtlCache<string>;

  beforeEach(() => {
    vi.useFakeTimers();
    cache = new TtlCache<string>({ ttlMs: 60000, maxSize: 3 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("evicts the least recently used entry when maxSize is exceeded", () => {
    cache.set("a", "1");
    vi.advanceTimersByTime(10);
    cache.set("b", "2");
    vi.advanceTimersByTime(10);
    cache.set("c", "3");
    vi.advanceTimersByTime(10);

    // Cache is full (3 entries). Adding a 4th should evict "a" (oldest lastAccessed).
    cache.set("d", "4");

    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe("2");
    expect(cache.get("c")).toBe("3");
    expect(cache.get("d")).toBe("4");
    expect(cache.size).toBe(3);
  });

  it("accessing a key updates its lastAccessed, preventing eviction", () => {
    cache.set("a", "1");
    vi.advanceTimersByTime(10);
    cache.set("b", "2");
    vi.advanceTimersByTime(10);
    cache.set("c", "3");
    vi.advanceTimersByTime(10);

    // Access "a" to update its lastAccessed
    cache.get("a");
    vi.advanceTimersByTime(10);

    // Now "b" is the least recently accessed
    cache.set("d", "4");

    expect(cache.get("a")).toBe("1"); // still alive, was accessed recently
    expect(cache.get("b")).toBeUndefined(); // evicted
    expect(cache.get("c")).toBe("3");
    expect(cache.get("d")).toBe("4");
  });

  it("overwriting an existing key does not trigger eviction", () => {
    cache.set("a", "1");
    cache.set("b", "2");
    cache.set("c", "3");

    // Overwrite "a" — should NOT evict anything since "a" already exists
    cache.set("a", "updated");

    expect(cache.size).toBe(3);
    expect(cache.get("a")).toBe("updated");
    expect(cache.get("b")).toBe("2");
    expect(cache.get("c")).toBe("3");
  });

  it("defaults maxSize to 100 when not specified", () => {
    const bigCache = new TtlCache<number>({ ttlMs: 5000 });
    for (let i = 0; i < 100; i++) {
      bigCache.set(`key-${i}`, i);
    }
    expect(bigCache.size).toBe(100);

    // 101st entry should evict
    bigCache.set("overflow", 999);
    expect(bigCache.size).toBe(100);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// DELETE & CLEAR
// ════════════════════════════════════════════════════════════════════════════

describe("TtlCache — delete and clear", () => {
  let cache: TtlCache<string>;

  beforeEach(() => {
    cache = new TtlCache<string>({ ttlMs: 60000 });
  });

  it("delete removes a specific key and returns true", () => {
    cache.set("key1", "value1");
    const result = cache.delete("key1");
    expect(result).toBe(true);
    expect(cache.get("key1")).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it("delete returns false for a non-existent key", () => {
    const result = cache.delete("nonexistent");
    expect(result).toBe(false);
  });

  it("clear removes all entries", () => {
    cache.set("a", "1");
    cache.set("b", "2");
    cache.set("c", "3");
    expect(cache.size).toBe(3);

    cache.clear();

    expect(cache.size).toBe(0);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("c")).toBeUndefined();
  });
});
