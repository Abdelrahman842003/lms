---
title: Performance & PWA
description: Web Vitals monitoring, bundle optimization, and Progressive Web App features
---

# Performance & PWA

## Performance Configuration

**Source:** `frontend/src/config/performance.ts`

### Bundle Optimization

Route-based code splitting with dynamic imports for lazy loading pages.

### Performance Thresholds

| Metric | Good | Needs Improvement |
|--------|------|-------------------|
| FCP | ≤ 1.8s | > 3.0s |
| LCP | ≤ 2.5s | > 4.0s |
| CLS | ≤ 0.1 | > 0.25 |
| FID | ≤ 100ms | > 300ms |
| TTFB | ≤ 800ms | > 1800ms |
| INP | ≤ 200ms | > 500ms |

### Optimization Strategies

Device and network-aware strategies:

| Strategy | When Applied |
|----------|-------------|
| `lowEnd` | Low CPU core count devices |
| `slowNetwork` | Slow network connections |
| `mobile` | Mobile user agents |

### Cache Strategies

| Strategy | For | Max Age |
|----------|-----|---------|
| `static` | JS, CSS, fonts, images | Long-term |
| `app` | App shell | Short-term |
| `api` | API responses | Configurable |
| `html` | HTML pages | No cache |

## Performance Context

**Source:** `frontend/src/contexts/PerformanceContext.tsx`

Global provider wrapping performance hooks:

- Auto-reports metrics to analytics endpoint
- Configurable via `enableAnalytics` and `autoReport` flags

## Performance Hooks

**Source:** `frontend/src/hooks/usePerformance.ts`

| Hook | Description |
|------|-------------|
| `usePerformanceMonitoring` | Collects Web Vitals (FCP, LCP, CLS, FID, TTFB, INP) |
| `useNetworkOptimization` | Connection info, effective type, preload decisions |
| `useRenderOptimization` | Render cycle tracking and optimization hints |
| `useLazyLoad` | Lazy loading with intersection observer |

## Performance Components

| Component | Description |
|-----------|-------------|
| `PerformanceMonitor` | Real-time performance metrics display (dev) |
| `OptimizedComponents` | Pre-optimized component wrappers |

## PWA Features

### Install Prompt

**Source:** `frontend/src/components/InstallPrompt.tsx`

- Handles `beforeinstallprompt` browser event
- Deferred prompt management
- User choice tracking (accepted/dismissed)
- Arabic language interface

### Service Worker Cleanup

**Source:** `frontend/src/components/ServiceWorkerCleanup.tsx`

- Cleans up stale service workers on mount
- Ensures latest version is active

## Monitoring Integration

Performance data flows through:

```
usePerformanceMonitoring → PerformanceContext → Analytics endpoint
```

Metrics are collected on page load and during user interactions, then batched and reported at configurable intervals.
