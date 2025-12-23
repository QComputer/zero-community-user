import { useCallback, useMemo } from 'react';

/**
 * Performance optimization utilities for the Zero Community frontend
 */

/**
 * Memoize a function to prevent unnecessary recalculations
 * @param {Function} fn - Function to memoize
 * @param {Array} dependencies - Dependency array for memoization
 * @returns {Function} Memoized function
 */
export const useMemoizedFunction = (fn: (...args: any[]) => any, dependencies: any[] = []) => {
  // Use useCallback to memoize the function
  const memoizedFn = useCallback((...args: any[]) => {
    return fn(...args);
  }, dependencies);

  return memoizedFn;
};

/**
 * Memoize a value to prevent unnecessary recalculations
 * @param {Function} fn - Function that returns the value to memoize
 * @param {Array} dependencies - Dependency array for memoization
 * @returns {any} Memoized value
 */
export const useMemoizedValue = <T>(fn: () => T, dependencies: any[] = []) => {
  // Use useMemo to memoize the value
  const memoizedValue = useMemo<T>(() => {
    return fn();
  }, dependencies);

  return memoizedValue;
};

/**
 * Debounce a function to limit how often it can be called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Time to wait in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(func: T, wait: number) => {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle a function to limit how often it can be called
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = <T extends (...args: any[]) => any>(func: T, limit: number) => {
  let lastFunc: NodeJS.Timeout | null = null;
  let lastRan = 0;

  return function executedFunction(...args: Parameters<T>) {
    const now = Date.now();

    if (!lastRan || now - lastRan >= limit) {
      func(...args);
      lastRan = now;
    } else {
      if (lastFunc) {
        clearTimeout(lastFunc);
      }

      lastFunc = setTimeout(() => {
        func(...args);
        lastRan = Date.now();
        lastFunc = null;
      }, limit - (now - lastRan));
    }
  };
};

/**
 * Simple API response cache
 */
const apiCache: Record<string, { data: any; timestamp: number }> = {};

/**
 * Get cached API data if available and not expired
 * @param {string} key - Cache key
 * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
 * @returns {any|null} Cached data or null if not available/expired
 */
export const getCachedApiData = (key: string, ttl: number = 5 * 60 * 1000): any | null => {
  const cached = apiCache[key];
  if (!cached) return null;

  // Check if cache is expired
  if (Date.now() - cached.timestamp > ttl) {
    delete apiCache[key];
    return null;
  }

  return cached.data;
};

/**
 * Cache API response
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 */
export const cacheApiData = (key: string, data: any): void => {
  apiCache[key] = {
    data,
    timestamp: Date.now()
  };
};

/**
 * Clear API cache for a specific key
 * @param {string} key - Cache key to clear
 */
export const clearApiCache = (key: string): void => {
  delete apiCache[key];
};

/**
 * Clear entire API cache
 */
export const clearAllApiCache = (): void => {
  Object.keys(apiCache).forEach(key => delete apiCache[key]);
};

/**
 * Optimized API caller with caching
 * @param {string} cacheKey - Unique key for caching
 * @param {Function} apiCall - API function to call
 * @param {number} ttl - Cache TTL in milliseconds (default: 5 minutes)
 * @returns {Promise<any>} API response
 */
export const cachedApiCall = async (
  cacheKey: string,
  apiCall: () => Promise<any>,
  ttl: number = 5 * 60 * 1000
): Promise<any> => {
  // Check cache first
  const cachedData = getCachedApiData(cacheKey, ttl);
  if (cachedData) {
    return Promise.resolve(cachedData);
  }

  try {
    // Make API call
    const response = await apiCall();

    // Cache the response
    cacheApiData(cacheKey, response);

    return response;
  } catch (error) {
    // Clear cache on error
    clearApiCache(cacheKey);
    throw error;
  }
};