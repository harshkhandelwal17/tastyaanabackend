import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Optimized state hook that prevents unnecessary re-renders
 * Only triggers re-render when value actually changes
 */
export const useOptimizedState = (initialValue) => {
  const [state, setState] = useState(initialValue);
  const previousValue = useRef(initialValue);

  const setOptimizedState = useCallback((newValue) => {
    const valueToSet = typeof newValue === 'function' ? newValue(state) : newValue;
    
    // Only update if value actually changed
    if (JSON.stringify(valueToSet) !== JSON.stringify(previousValue.current)) {
      previousValue.current = valueToSet;
      setState(valueToSet);
    }
  }, [state]);

  return [state, setOptimizedState];
};

/**
 * Hook for debounced state updates
 */
export const useDebouncedState = (initialValue, delay = 300) => {
  const [state, setState] = useState(initialValue);
  const timeoutRef = useRef(null);

  const setDebouncedState = useCallback((newValue) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setState(newValue);
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, setDebouncedState];
};

/**
 * Hook for memoized state updates
 */
export const useMemoizedState = (initialValue, dependencies = []) => {
  const [state, setState] = useState(initialValue);
  const memoizedValue = useRef(initialValue);

  const setMemoizedState = useCallback((newValue) => {
    const valueToSet = typeof newValue === 'function' ? newValue(state) : newValue;
    
    // Check if dependencies changed
    const depsChanged = dependencies.some((dep, index) => {
      return JSON.stringify(dep) !== JSON.stringify(memoizedValue.current[index]);
    });

    if (depsChanged) {
      memoizedValue.current = dependencies;
      setState(valueToSet);
    }
  }, [state, dependencies]);

  return [state, setMemoizedState];
};

/**
 * Hook for preventing unnecessary API calls
 */
// Global cache store to persist across component mounts
const __apiCacheStore = new Map();
const __apiCacheTimestamps = new Map();

export const useApiCache = (key, ttl = 5 * 60 * 1000) => { // 5 minutes default
  const storagePrefix = `apiCache:${key}:`;

  const makeCompositeKey = useCallback((cacheKey) => `${key}:${cacheKey}`, [key]);

  const readFromStorage = useCallback((compositeKey) => {
    try {
      const raw = localStorage.getItem(storagePrefix + compositeKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.ts && (Date.now() - parsed.ts) < ttl) {
        return parsed.data;
      }
      return null;
    } catch {
      return null;
    }
  }, [storagePrefix, ttl]);

  const writeToStorage = useCallback((compositeKey, data) => {
    try {
      const payload = JSON.stringify({ data, ts: Date.now() });
      localStorage.setItem(storagePrefix + compositeKey, payload);
    } catch {
      // ignore storage errors
    }
  }, [storagePrefix]);

  const getCachedData = useCallback((cacheKey) => {
    const compositeKey = makeCompositeKey(cacheKey);

    // Check in-memory global cache first
    const memTs = __apiCacheTimestamps.get(compositeKey);
    const memData = __apiCacheStore.get(compositeKey);
    if (memTs && memData && (Date.now() - memTs) < ttl) {
      return memData;
    }

    // Fallback to localStorage
    const stored = readFromStorage(compositeKey);
    if (stored) {
      // hydrate memory for faster subsequent reads
      __apiCacheStore.set(compositeKey, stored);
      __apiCacheTimestamps.set(compositeKey, Date.now());
      return stored;
    }

    return null;
  }, [makeCompositeKey, ttl, readFromStorage]);

  const setCachedData = useCallback((cacheKey, data) => {
    const compositeKey = makeCompositeKey(cacheKey);
    __apiCacheStore.set(compositeKey, data);
    __apiCacheTimestamps.set(compositeKey, Date.now());
    writeToStorage(compositeKey, data);
  }, [makeCompositeKey, writeToStorage]);

  const clearCache = useCallback((cacheKey) => {
    if (cacheKey) {
      const compositeKey = makeCompositeKey(cacheKey);
      __apiCacheStore.delete(compositeKey);
      __apiCacheTimestamps.delete(compositeKey);
      try { localStorage.removeItem(storagePrefix + compositeKey); } catch {}
    } else {
      // Clear all keys for this namespace
      for (const k of __apiCacheStore.keys()) {
        if (k.startsWith(`${key}:`)) {
          __apiCacheStore.delete(k);
          __apiCacheTimestamps.delete(k);
          try { localStorage.removeItem(storagePrefix + k); } catch {}
        }
      }
    }
  }, [makeCompositeKey, storagePrefix, key]);

  return { getCachedData, setCachedData, clearCache };
};

/**
 * Hook for optimized scroll handling
 */
export const useOptimizedScroll = (callback, dependencies = []) => {
  const ticking = useRef(false);
  const lastScrollY = useRef(0);

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        if (Math.abs(currentScrollY - lastScrollY.current) > 5) { // Only trigger if scroll > 5px
          callback(currentScrollY);
          lastScrollY.current = currentScrollY;
        }
        ticking.current = false;
      });
      ticking.current = true;
    }
  }, [callback]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll, ...dependencies]);
};

/**
 * Hook for optimized resize handling
 */
export const useOptimizedResize = (callback, dependencies = []) => {
  const ticking = useRef(false);
  const lastDimensions = useRef({ width: 0, height: 0 });

  const handleResize = useCallback(() => {
    if (!ticking.current) {
      requestAnimationFrame(() => {
        const currentDimensions = {
          width: window.innerWidth,
          height: window.innerHeight
        };
        
        if (currentDimensions.width !== lastDimensions.current.width ||
            currentDimensions.height !== lastDimensions.current.height) {
          callback(currentDimensions);
          lastDimensions.current = currentDimensions;
        }
        ticking.current = false;
      });
      ticking.current = true;
    }
  }, [callback]);

  useEffect(() => {
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize, ...dependencies]);
};