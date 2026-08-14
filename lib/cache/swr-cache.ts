"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

// Global In-Memory Singleton Cache Store
const globalCache = new Map<string, CacheItem<any>>();
const listeners = new Map<string, Set<() => void>>();

export const DEFAULT_CACHE_TTL = 1000 * 60 * 3; // 3 Minutes Freshness TTL

/**
 * Retrieve cached item if valid
 */
export function getCache<T>(key: string): { data: T; isStale: boolean } | null {
  const item = globalCache.get(key);
  if (!item) return null;

  const age = Date.now() - item.timestamp;
  const isStale = age > item.ttlMs;

  return {
    data: item.data as T,
    isStale,
  };
}

/**
 * Set item in global in-memory cache
 */
export function setCache<T>(key: string, data: T, ttlMs: number = DEFAULT_CACHE_TTL): void {
  globalCache.set(key, {
    data,
    timestamp: Date.now(),
    ttlMs,
  });

  notifyListeners(key);
}

/**
 * Invalidate one or more cache keys immediately
 */
export function invalidateCache(keys: string | string[]): void {
  const keyList = Array.isArray(keys) ? keys : [keys];

  keyList.forEach((key) => {
    globalCache.delete(key);
    notifyListeners(key);
  });
}

/**
 * Clear the entire memory cache
 */
export function clearAllCache(): void {
  globalCache.clear();
  listeners.forEach((subscribers) => {
    subscribers.forEach((cb) => cb());
  });
}

function notifyListeners(key: string) {
  const keyListeners = listeners.get(key);
  if (keyListeners) {
    keyListeners.forEach((cb) => cb());
  }
}

function subscribe(key: string, callback: () => void): () => void {
  if (!listeners.has(key)) {
    listeners.set(key, new Set());
  }
  listeners.get(key)!.add(callback);

  return () => {
    const keyListeners = listeners.get(key);
    if (keyListeners) {
      keyListeners.delete(callback);
      if (keyListeners.size === 0) {
        listeners.delete(key);
      }
    }
  };
}

export interface UseSwrOptions {
  ttlMs?: number;
  revalidateOnMount?: boolean;
}

export interface UseSwrResult<T> {
  data: T | null;
  isLoading: boolean;
  isRevalidating: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  mutate: (newData: T | ((prev: T | null) => T), shouldRevalidate?: boolean) => void;
}

/**
 * Custom SWR Hook for Instant 0ms Tab Switching & Background Data Revalidation
 */
export function useSwrData<T>(
  key: string,
  fetcher: () => Promise<{ success: boolean; data?: T; error?: string }>,
  options: UseSwrOptions = {}
): UseSwrResult<T> {
  const { ttlMs = DEFAULT_CACHE_TTL, revalidateOnMount = true } = options;

  // Initialize immediately from memory cache if available for 0ms initial render
  const cached = getCache<T>(key);
  const [data, setData] = useState<T | null>(cached ? cached.data : null);
  const [isLoading, setIsLoading] = useState<boolean>(!cached);
  const [isRevalidating, setIsRevalidating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  // Execute revalidation
  const executeFetch = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) {
        setIsRevalidating(true);
      } else if (!getCache<T>(key)) {
        setIsLoading(true);
      } else {
        setIsRevalidating(true);
      }

      try {
        const res = await fetcherRef.current();
        if (res.success && res.data !== undefined) {
          setCache(key, res.data, ttlMs);
          setData(res.data);
          setError(null);
        } else if (res.error) {
          setError(res.error);
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch data.");
      } finally {
        setIsLoading(false);
        setIsRevalidating(false);
      }
    },
    [key, ttlMs]
  );

  // Manual refresh bypasses cache
  const refresh = useCallback(async () => {
    await executeFetch(true);
  }, [executeFetch]);

  // Optimistic / Local mutation
  const mutate = useCallback(
    (newData: T | ((prev: T | null) => T), shouldRevalidate = false) => {
      setData((prev) => {
        const resolved = typeof newData === "function" ? (newData as any)(prev) : newData;
        setCache(key, resolved, ttlMs);
        return resolved;
      });

      if (shouldRevalidate) {
        executeFetch(true);
      }
    },
    [key, ttlMs, executeFetch]
  );

  // Listen to cross-component cache changes
  useEffect(() => {
    const unsubscribe = subscribe(key, () => {
      const currentCache = getCache<T>(key);
      if (currentCache) {
        setData(currentCache.data);
      }
    });

    return unsubscribe;
  }, [key]);

  // On mount: if no cache, fetch; if stale or revalidate enabled, revalidate silently
  useEffect(() => {
    const currentCache = getCache<T>(key);
    if (!currentCache) {
      executeFetch(false);
    } else if (revalidateOnMount || currentCache.isStale) {
      // Silent background fetch without blocking UI
      executeFetch(false);
    }
  }, [key, revalidateOnMount, executeFetch]);

  return {
    data,
    isLoading,
    isRevalidating,
    error,
    refresh,
    mutate,
  };
}
