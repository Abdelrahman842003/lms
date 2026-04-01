---
title: State Management
description: React contexts, custom hooks, and data flow patterns
---

# State Management

The frontend uses React Context for global state and custom hooks for reusable data logic. There is no external state management library — all state is managed through contexts and hooks.

## Context Providers

8 context providers manage global state:

| Context | Purpose | Key Exports |
|---------|---------|-------------|
| `CoreAuthContext` | Base auth (login, logout, session) | `useCoreAuth` |
| `EnhancedAuthContext` | Composed auth + selection + FCM | `useAuth` |
| `SelectionContext` | Role-specific selections | `useSelection` |
| `StudentTeacherContext` | Student-teacher dashboard | `useStudentTeacher` |
| `AcademyContext` | Multi-tenant academy selection | `useAcademy`, `useAcademyId`, `withAcademy` |
| `NotificationContext` | Real-time notifications | `useNotificationContext` |
| `PerformanceContext` | Web Vitals monitoring | `usePerformance` |
| `SettingsContext` | Global settings + Firebase + themes | `useSettings` |

### Provider Hierarchy

Providers wrap the app in this order (outer to inner):

```
SettingsProvider       — Public settings, Firebase init, seasonal themes
PerformanceProvider   — Web Vitals monitoring, network optimization
NotificationProvider  — Real-time notifications (Echo + FCM)
AcademyProvider       — Academy selection for multi-tenant
AuthProvider          — CoreAuth + Selection + Enhanced
```

## AcademyContext

**Source:** `frontend/src/contexts/AcademyContext.tsx`

Multi-tenant context with multiple access patterns:

- `useAcademy()` — Full academy context (current academy, list, setter, loading)
- `useAcademyId()` — Just the current academy ID (lighter re-renders)
- `withAcademy(Component)` — HOC for class components
- `useAcademyFeature()` — Feature access control based on subscription

## SettingsContext

**Source:** `frontend/src/contexts/SettingsContext.tsx`

- Fetches public settings on mount via `settingsService`
- Initializes Firebase with settings-driven config
- Applies seasonal theme CSS variables
- Falls back to environment variables for Firebase config

## PerformanceContext

**Source:** `frontend/src/contexts/PerformanceContext.tsx`

- Aggregates Web Vitals metrics (FCP, LCP, CLS, FID, TTFB, INP)
- Auto-reports to analytics endpoint
- Network optimization flags for low-end devices

## Custom Hooks

### Data Fetching Hooks

**Source:** `frontend/src/hooks/useApiState.ts`

| Hook | Purpose |
|------|---------|
| `useApiState<T>` | Generic data fetcher with stale-while-revalidate, loading/error states, and abort controller |
| `useCachedApiState<T>` | Map-based cross-component cache for shared data |
| `useOptimisticMutation<T>` | Optimistic UI updates with automatic rollback on failure |
| `useInfiniteScroll<T>` | Paginated data loading with scroll detection |
| `useLocalStorageState<T>` | Persistent state synced to localStorage |

### UI Utility Hooks

**Source:** `frontend/src/hooks/useUI.ts`

| Hook | Purpose |
|------|---------|
| `useModal` | Modal open/close state management |
| `useLoadingState` | Loading state with auto-reset |
| `useToast` | Toast notification helper |
| `useIntersectionObserver` | Lazy loading and visibility detection |
| `useClickOutside` | Click-outside detection for dropdowns |
| `useKeyboardShortcuts` | Keyboard shortcut binding |
| `useClipboard` | Copy to clipboard |
| `useMediaQuery` | Responsive breakpoint detection |
| `useResponsive` | Combined responsive state (mobile/tablet/desktop) |
| `useWindowSize` | Window dimensions tracking |
| `useSSRLocalStorage` | SSR-safe localStorage access |

### Performance Hooks

**Source:** `frontend/src/hooks/usePerformance.ts`

| Hook | Purpose |
|------|---------|
| `usePerformanceMonitoring` | Web Vitals collection (FCP, LCP, CLS, FID, TTFB, INP) |
| `useNetworkOptimization` | Connection info and preload decisions |
| `useRenderOptimization` | Render cycle tracking |
| `useLazyLoad` | Lazy loading with intersection observer |

### Form Hooks

**Source:** `frontend/src/hooks/useForm.ts`

- `useForm<T>` — Form state with validation rules (required, min, max, pattern, custom, email, phone)
- `useDebouncedValue` — Debounced value for search inputs
- `useAutoSave` — Auto-save with debounced API calls

### Translation Hook

**Source:** `frontend/src/hooks/useTranslation.ts`

- `useTranslation()` — Returns `t()` function with dot-notation key access
- `translate()` — Standalone function for non-component use
- `TranslationKey` — TypeScript type derived from message JSON

## Data Flow Patterns

### Component Data Fetching

```tsx
// Using useApiState for data fetching
function StudentsList() {
  const { data, loading, error, refetch } = useApiState<Student[]>({
    fetchFn: () => studentService.getAll(),
  });
}

// Using useCachedApiState for shared data
function GradeSelector() {
  const { data } = useCachedApiState<Grade[]>({
    key: 'grades',
    fetchFn: () => gradeService.getAll(),
  });
}
```

### Optimistic Updates

```tsx
const mutation = useOptimisticMutation({
  queryKey: ['students'],
  mutationFn: (data) => studentService.create(data),
  optimisticUpdate: (old, newItem) => [...old, newItem],
});
```
