/**
 * Custom State Management Hooks
 * 
 * These hooks provide optimized state management patterns
 * without external dependencies for better performance.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// Generic API state hook
export interface UseApiStateOptions<T> {
  initialData?: T;
  key: string;
  fetcher: () => Promise<T>;
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number; // How long data is considered fresh (ms)
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useApiState<T>(options: UseApiStateOptions<T>) {
  const {
    initialData,
    key,
    fetcher,
    enabled = true,
    refetchInterval,
    staleTime = 5 * 60 * 1000, // 5 minutes default
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  
  const fetchRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if data is stale
  const isStale = useMemo(() => {
    if (!lastFetch) return true;
    return Date.now() - lastFetch > staleTime;
  }, [lastFetch, staleTime]);

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;
    if (!force && !isStale && data) return;

    // Cancel previous request
    if (fetchRef.current) {
      fetchRef.current.abort();
    }

    fetchRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      
      if (!fetchRef.current.signal.aborted) {
        setData(result);
        setLastFetch(Date.now());
        onSuccess?.(result);
      }
    } catch (err) {
      if (!fetchRef.current.signal.aborted) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
      }
    } finally {
      if (!fetchRef.current.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [enabled, isStale, data, fetcher, onSuccess, onError]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [key, enabled]);

  // Set up refetch interval
  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(() => {
        fetchData(true); // Force refetch
      }, refetchInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refetchInterval, enabled, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fetchRef.current) {
        fetchRef.current.abort();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  const mutate = useCallback((newData: T) => {
    setData(newData);
    setLastFetch(Date.now());
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch,
    mutate,
    isStale,
  };
}

// Cache storage using Map for better performance
const cache = new Map<string, { data: any; timestamp: number; staleTime: number }>();

// Enhanced cache hook
export function useCachedApiState<T>(options: UseApiStateOptions<T>) {
  const { key, staleTime = 5 * 60 * 1000 } = options;
  
  // Check cache first
  const cached = cache.get(key);
  const isCachedStale = cached ? Date.now() - cached.timestamp > cached.staleTime : true;
  
  const initialData = !isCachedStale && cached ? cached.data : options.initialData;
  
  const result = useApiState({
    ...options,
    initialData,
  });

  // Update cache when data changes
  useEffect(() => {
    if (result.data && !result.error) {
      cache.set(key, {
        data: result.data,
        timestamp: Date.now(),
        staleTime,
      });
    }
  }, [result.data, result.error, key, staleTime]);

  return result;
}

// Optimistic updates hook
export function useOptimisticMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onMutate?: (variables: TVariables) => TData | void;
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables, rollback?: () => void) => void;
  }
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (variables: TVariables) => {
    setIsLoading(true);
    setError(null);

    let rollback: (() => void) | undefined;
    
    // Optimistic update
    if (options?.onMutate) {
      const result = options.onMutate(variables);
      if (result) {
        // Store rollback function if optimistic data was applied
        rollback = () => {
          // This would typically revert optimistic changes
          // Implementation depends on your state management approach
        };
      }
    }

    try {
      const data = await mutationFn(variables);
      options?.onSuccess?.(data, variables);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      options?.onError?.(error, variables, rollback);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [mutationFn, options]);

  return {
    mutate,
    isLoading,
    error,
  };
}

// Infinite scroll hook
export function useInfiniteScroll<T>(
  fetcher: (page: number, limit: number) => Promise<{ data: T[]; hasMore: boolean }>,
  limit = 20
) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const loadData = useCallback(async (pageNum: number, reset = false) => {
    if (reset) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    
    setError(null);

    try {
      const result = await fetcher(pageNum, limit);
      
      if (reset) {
        setData(result.data);
      } else {
        setData(prev => [...prev, ...result.data]);
      }
      
      setHasMore(result.hasMore);
      setPage(pageNum);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [fetcher, limit]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      loadData(page + 1);
    }
  }, [loadData, page, isLoadingMore, hasMore]);

  const refresh = useCallback(() => {
    loadData(1, true);
  }, [loadData]);

  // Initial load
  useEffect(() => {
    loadData(1, true);
  }, []);

  return {
    data,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}

// Local storage state hook
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
  options?: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
    encrypt?: boolean;
  }
) {
  const serialize = options?.serialize || JSON.stringify;
  const deserialize = options?.deserialize || JSON.parse;
  
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      
      return deserialize(item);
    } catch {
      return defaultValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(state) : value;
      setState(valueToStore);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, serialize(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, serialize, state]);

  const removeValue = useCallback(() => {
    try {
      setState(defaultValue);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);

  return [state, setValue, removeValue] as const;
}

export default {
  useApiState,
  useCachedApiState,
  useOptimisticMutation,
  useInfiniteScroll,
  useLocalStorageState,
};