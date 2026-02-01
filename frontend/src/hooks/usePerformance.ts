/**
 * Performance Optimization Hooks
 * 
 * Custom hooks for performance enhancements including
 * bundle optimization, code splitting, and rendering improvements.
 */

import { useCallback, useEffect, useState, useMemo, useRef } from 'react';

// Bundle size monitoring hook
export function useBundleSize() {
  const [bundleSize, setBundleSize] = useState<{
    totalSize: number;
    gzipSize: number;
    chunks: string[];
  } | null>(null);

  useEffect(() => {
    // This would integrate with webpack-bundle-analyzer or similar
    // For now, it's a placeholder that could be enhanced with actual bundle analysis
    if (process.env.NODE_ENV === 'development') {
      const mockData = {
        totalSize: 2.1, // MB
        gzipSize: 0.8, // MB
        chunks: ['main', 'vendor', 'runtime'],
      };
      setBundleSize(mockData);
    }
  }, []);

  return bundleSize;
}

// Enhanced Performance monitoring with Web Vitals
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<{
    fcp?: number; // First Contentful Paint
    lcp?: number; // Largest Contentful Paint
    cls?: number; // Cumulative Layout Shift
    fid?: number; // First Input Delay
    ttfb?: number; // Time to First Byte
    inp?: number; // Interaction to Next Paint
    score: number; // Performance score (0-100)
  }>({ score: 0 });

  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Initialize Web Vitals with dynamic import
    const initWebVitals = async () => {
      try {
        const webVitals = await import('web-vitals');
        setIsSupported(true);

        // Track all Core Web Vitals with proper typing
        if (webVitals.onCLS) {
          webVitals.onCLS((metric: any) => {
            setMetrics(prev => ({ ...prev, cls: metric.value }));
          });
        }

        if (webVitals.onFCP) {
          webVitals.onFCP((metric: any) => {
            setMetrics(prev => ({ ...prev, fcp: metric.value }));
          });
        }

        if (webVitals.onFID) {
          webVitals.onFID((metric: any) => {
            setMetrics(prev => ({ ...prev, fid: metric.value }));
          });
        }

        if (webVitals.onLCP) {
          webVitals.onLCP((metric: any) => {
            setMetrics(prev => ({ ...prev, lcp: metric.value }));
          });
        }

        if (webVitals.onTTFB) {
          webVitals.onTTFB((metric: any) => {
            setMetrics(prev => ({ ...prev, ttfb: metric.value }));
          });
        }

        // Check if INP is available (newer metric)
        if (webVitals.onINP) {
          webVitals.onINP((metric: any) => {
            setMetrics(prev => ({ ...prev, inp: metric.value }));
          });
        }

      } catch (error) {
        console.warn('Web Vitals library not available, using fallback:', error);
        setIsSupported(false);
        
        // Fallback to basic Performance Observer
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          
          entries.forEach((entry) => {
            if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
              setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
            }
            
            if (entry.entryType === 'largest-contentful-paint') {
              setMetrics(prev => ({ ...prev, lcp: entry.startTime }));
            }
            
            if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
              setMetrics(prev => ({ 
                ...prev, 
                cls: (prev?.cls || 0) + (entry as any).value 
              }));
            }
            
            if (entry.entryType === 'first-input') {
              setMetrics(prev => ({ 
                ...prev, 
                fid: (entry as any).processingStart - entry.startTime 
              }));
            }
          });
        });

        try {
          observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift', 'first-input'] });
          return () => observer.disconnect();
        } catch (observerError) {
          console.warn('Performance Observer not supported:', observerError);
        }
      }
    };

    initWebVitals();
  }, []);

  // Calculate performance score
  useEffect(() => {
    const calculateScore = () => {
      let score = 100;

      // LCP scoring (Good: <2.5s, Needs Improvement: 2.5-4s, Poor: >4s)
      if (metrics.lcp !== undefined) {
        if (metrics.lcp > 4000) score -= 30;
        else if (metrics.lcp > 2500) score -= 15;
      }

      // FID scoring (Good: <100ms, Needs Improvement: 100-300ms, Poor: >300ms)
      if (metrics.fid !== undefined) {
        if (metrics.fid > 300) score -= 25;
        else if (metrics.fid > 100) score -= 10;
      }

      // CLS scoring (Good: <0.1, Needs Improvement: 0.1-0.25, Poor: >0.25)
      if (metrics.cls !== undefined) {
        if (metrics.cls > 0.25) score -= 25;
        else if (metrics.cls > 0.1) score -= 10;
      }

      // FCP scoring (Good: <1.8s, Needs Improvement: 1.8-3s, Poor: >3s)
      if (metrics.fcp !== undefined) {
        if (metrics.fcp > 3000) score -= 20;
        else if (metrics.fcp > 1800) score -= 10;
      }

      setMetrics(prev => ({ ...prev, score: Math.max(0, Math.round(score)) }));
    };

    calculateScore();
  }, [metrics.lcp, metrics.fid, metrics.cls, metrics.fcp]);

  const logPerformance = useCallback(() => {
    if (metrics) {
      console.group('🚀 Performance Metrics');
      console.table(metrics);
      console.log(`📊 Performance Score: ${metrics.score}/100`);
      console.groupEnd();
    }
  }, [metrics]);

  // Send to analytics (Google Analytics example)
  const sendToAnalytics = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      Object.entries(metrics).forEach(([key, value]) => {
        if (value !== undefined && key !== 'score') {
          (window as any).gtag('event', key, {
            event_category: 'Web Vitals',
            value: Math.round(value),
            non_interaction: true,
          });
        }
      });
    }
  }, [metrics]);

  // Get performance grade
  const getPerformanceGrade = useCallback(() => {
    if (metrics.score >= 90) return 'A';
    if (metrics.score >= 80) return 'B';
    if (metrics.score >= 70) return 'C';
    if (metrics.score >= 60) return 'D';
    return 'F';
  }, [metrics.score]);

  return { 
    metrics, 
    isSupported,
    logPerformance, 
    sendToAnalytics,
    getPerformanceGrade
  };
}

// Memory usage monitoring
export function useMemoryMonitoring() {
  const [memoryUsage, setMemoryUsage] = useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null>(null);

  useEffect(() => {
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryUsage({
          usedJSHeapSize: memory.usedJSHeapSize / 1024 / 1024, // MB
          totalJSHeapSize: memory.totalJSHeapSize / 1024 / 1024, // MB
          jsHeapSizeLimit: memory.jsHeapSizeLimit / 1024 / 1024, // MB
        });
      }
    };

    updateMemoryUsage();
    const interval = setInterval(updateMemoryUsage, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return memoryUsage;
}

// Render optimization hook
export function useRenderOptimization() {
  const renderCount = useRef(0);
  const [lastRenderTime, setLastRenderTime] = useState<number>(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    setLastRenderTime(Date.now());
  });

  const getRenderStats = useCallback(() => ({
    renderCount: renderCount.current,
    lastRenderTime,
  }), [lastRenderTime]);

  return getRenderStats;
}

// Lazy loading hook for images and components
export function useLazyLoad<T extends HTMLElement = HTMLDivElement>() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [hasLoaded]);

  return { ref, isVisible, hasLoaded };
}

// Code splitting optimization
export function useCodeSplitting() {
  const [loadedModules, setLoadedModules] = useState<Set<string>>(new Set());

  const loadModule = useCallback(async (modulePath: string) => {
    if (loadedModules.has(modulePath)) {
      return Promise.resolve();
    }

    try {
      await import(modulePath);
      setLoadedModules(prev => new Set([...prev, modulePath]));
    } catch (error) {
      console.error(`Failed to load module: ${modulePath}`, error);
      throw error;
    }
  }, [loadedModules]);

  const preloadModule = useCallback((modulePath: string) => {
    if (!loadedModules.has(modulePath)) {
      const link = document.createElement('link');
      link.rel = 'modulepreload';
      link.href = modulePath;
      document.head.appendChild(link);
    }
  }, [loadedModules]);

  return { loadedModules: Array.from(loadedModules), loadModule, preloadModule };
}

// Resource preloading hook
export function useResourcePreload() {
  const preloadedResources = useRef(new Set<string>());

  const preloadResource = useCallback((url: string, type: 'image' | 'script' | 'style' | 'font') => {
    if (preloadedResources.current.has(url)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    
    switch (type) {
      case 'image':
        link.as = 'image';
        break;
      case 'script':
        link.as = 'script';
        break;
      case 'style':
        link.as = 'style';
        break;
      case 'font':
        link.as = 'font';
        link.crossOrigin = 'anonymous';
        break;
    }

    document.head.appendChild(link);
    preloadedResources.current.add(url);
  }, []);

  const preloadImages = useCallback((urls: string[]) => {
    urls.forEach(url => preloadResource(url, 'image'));
  }, [preloadResource]);

  return { preloadResource, preloadImages };
}

// Network optimization hook
export function useNetworkOptimization() {
  const [connectionInfo, setConnectionInfo] = useState<{
    effectiveType: string;
    downlink: number;
    rtt: number;
  } | null>(null);

  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateConnectionInfo = () => {
        setConnectionInfo({
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
        });
      };

      updateConnectionInfo();
      connection.addEventListener('change', updateConnectionInfo);

      return () => connection.removeEventListener('change', updateConnectionInfo);
    }
  }, []);

  const shouldPreload = useMemo(() => {
    if (!connectionInfo) return true;
    
    // Don't preload on slow connections
    return connectionInfo.effectiveType !== 'slow-2g' && 
           connectionInfo.effectiveType !== '2g' &&
           connectionInfo.downlink > 0.5;
  }, [connectionInfo]);

  const shouldReduceQuality = useMemo(() => {
    if (!connectionInfo) return false;
    
    return connectionInfo.effectiveType === 'slow-2g' || 
           connectionInfo.effectiveType === '2g' ||
           connectionInfo.downlink < 1;
  }, [connectionInfo]);

  return {
    connectionInfo,
    shouldPreload,
    shouldReduceQuality,
  };
}

// Critical resource prioritization
export function useCriticalResourceLoading() {
  const [criticalResourcesLoaded, setCriticalResourcesLoaded] = useState(false);
  const [nonCriticalResourcesLoaded, setNonCriticalResourcesLoaded] = useState(false);

  const loadCriticalResources = useCallback(async (resources: string[]) => {
    try {
      await Promise.all(
        resources.map(resource => 
          new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = reject;
            img.src = resource;
          })
        )
      );
      setCriticalResourcesLoaded(true);
    } catch (error) {
      console.error('Failed to load critical resources:', error);
    }
  }, []);

  const loadNonCriticalResources = useCallback(async (resources: string[]) => {
    if (!criticalResourcesLoaded) return;

    // Load with delay to not block critical resources
    setTimeout(async () => {
      try {
        await Promise.all(
          resources.map(resource => 
            new Promise((resolve, reject) => {
              const img = new Image();
              img.onload = resolve;
              img.onerror = reject;
              img.src = resource;
            })
          )
        );
        setNonCriticalResourcesLoaded(true);
      } catch (error) {
        console.error('Failed to load non-critical resources:', error);
      }
    }, 100);
  }, [criticalResourcesLoaded]);

  return {
    criticalResourcesLoaded,
    nonCriticalResourcesLoaded,
    loadCriticalResources,
    loadNonCriticalResources,
  };
}

export default {
  useBundleSize,
  usePerformanceMonitoring,
  useMemoryMonitoring,
  useRenderOptimization,
  useLazyLoad,
  useCodeSplitting,
  useResourcePreload,
  useNetworkOptimization,
  useCriticalResourceLoading,
};