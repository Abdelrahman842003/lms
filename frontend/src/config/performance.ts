/**
 * Bundle Optimization Configuration
 * 
 * Configuration for optimizing bundle size, code splitting,
 * and performance improvements.
 */

// Bundle analysis configuration
export const BUNDLE_CONFIG = {
  // Critical CSS threshold (KB)
  criticalCssThreshold: 20,
  
  // Image optimization settings
  images: {
    // Lazy load images below the fold
    lazyLoadThreshold: '50px',
    // WebP fallback for older browsers
    formats: ['webp', 'jpg', 'png'],
    // Quality settings based on device type
    quality: {
      mobile: 75,
      tablet: 85,
      desktop: 90,
    },
  },
  
  // Code splitting settings
  codeSplitting: {
    // Minimum chunk size (KB)
    minChunkSize: 20,
    // Maximum chunk size (KB)  
    maxChunkSize: 250,
    // Shared modules threshold
    sharedModulesThreshold: 2,
  },
  
  // Performance budgets
  budgets: {
    // Total bundle size (MB)
    totalBundle: 2.5,
    // Initial bundle size (MB)
    initialBundle: 1.0,
    // Individual chunk size (KB)
    chunkSize: 250,
    // First Contentful Paint (ms)
    fcp: 1500,
    // Largest Contentful Paint (ms)
    lcp: 2500,
    // Cumulative Layout Shift
    cls: 0.1,
    // First Input Delay (ms)
    fid: 100,
  },
  
  // Critical resources
  critical: [
    // Core CSS
    '/styles/globals.css',
    '/styles/components.css',
    // Essential fonts
    'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap',
    // Logo and favicon
    '/logo.png',
    '/favicon.ico',
  ],
  
  // Preload resources
  preload: {
    // Images to preload
    images: [
      '/logo.png',
      '/default-avatar.png',
    ],
    // Scripts to preload
    scripts: [],
    // Fonts to preload
    fonts: [
      'https://fonts.gstatic.com/s/tajawal/v9/Iura6YBj_oCad4k1l_6gKsC_FAg.woff2',
    ],
  },
};

// Route-based code splitting configuration
export const ROUTE_CHUNKS = {
  // Landing and auth pages (critical)
  auth: [
    '/',
    '/login',
    '/register',
  ],
  
  // Dashboard pages by user type
  teacher: [
    '/teacher/dashboard',
    '/teacher/students',
    '/teacher/exams',
    '/teacher/grades',
    '/teacher/lectures',
    '/teacher/groups',
    '/teacher/secretaries',
    '/teacher/reports',
    '/teacher/attendance',
    '/teacher/notifications',
    '/teacher/profile',
  ],
  
  student: [
    '/student/dashboard',
    '/student/teachers',
    '/student/exams',
    '/student/lectures',
    '/student/leaderboard',
    '/student/mistakes',
    '/student/notifications',
    '/student/profile',
    '/student/attend',
  ],
  
  academy: [
    '/academy/dashboard',
    '/academy/teachers',
    '/academy/students',
    '/academy/billing',
    '/academy/reports',
    '/academy/profile',
  ],
  
  parent: [
    '/parent/dashboard',
    '/parent/children',
    '/parent/profile',
  ],
  
  // Shared components
  shared: [
    'components/dashboard',
    'components/shared',
    'components/ui',
  ],
};

// Dynamic import utilities
export const dynamicImports = {
  // Lazy load dashboard components
  loadDashboard: (userType: string) => {
    switch (userType) {
      case 'teacher':
        return import('@/app/teacher/dashboard/page');
      case 'student':
        return import('@/app/student/dashboard/page');
      case 'academy':
        return import('@/app/academy/dashboard/page');
      case 'parent':
        return import('@/app/parent/dashboard/page');
      default:
        return Promise.reject(new Error('Unknown user type'));
    }
  },
  
  // Lazy load UI components
  loadNotifications: () => import('@/components/ui/NotificationModal'),
  
  // Lazy load exam components  
  loadExams: () => import('@/app/teacher/exams/page'),
  
  // Lazy load report components
  loadReports: () => import('@/app/teacher/reports/page'),
  
  // Lazy load UI components
  loadUI: () => import('@/components/ui/index'),
};

// Performance monitoring thresholds
export const PERFORMANCE_THRESHOLDS = {
  // Core Web Vitals thresholds
  good: {
    fcp: 1800,    // First Contentful Paint (ms)
    lcp: 2500,    // Largest Contentful Paint (ms)
    fid: 100,     // First Input Delay (ms)
    cls: 0.1,     // Cumulative Layout Shift
  },
  
  needsImprovement: {
    fcp: 3000,
    lcp: 4000,
    fid: 300,
    cls: 0.25,
  },
  
  // Memory usage thresholds (MB)
  memory: {
    warning: 50,
    critical: 100,
  },
  
  // Bundle size thresholds (MB)
  bundleSize: {
    warning: 2.0,
    critical: 3.0,
  },
};

// Optimization strategies based on device/network
export const OPTIMIZATION_STRATEGIES = {
  // Low-end devices
  lowEnd: {
    enableVirtualization: true,
    reduceAnimations: true,
    limitConcurrentRequests: 2,
    imageQuality: 60,
    enableServiceWorker: false,
  },
  
  // Slow network connections
  slowNetwork: {
    enablePrefetching: false,
    reduceImageSizes: true,
    prioritizeCriticalResources: true,
    enableCompression: true,
    limitPreloading: true,
  },
  
  // Mobile devices
  mobile: {
    enableTouchOptimizations: true,
    reduceHoverEffects: true,
    optimizeForBattery: true,
    enableOfflineMode: true,
  },
  
  // Development mode
  development: {
    enablePerformanceLogging: true,
    enableMemoryMonitoring: true,
    enableBundleAnalysis: true,
    skipOptimizations: false,
  },
};

// Resource priorities
export const RESOURCE_PRIORITIES = {
  // Critical resources (load immediately)
  critical: [
    'main.css',
    'runtime.js',
    'main.js',
    'auth.js',
  ],
  
  // High priority (load early)
  high: [
    'dashboard.js',
    'components.js',
    'fonts.css',
  ],
  
  // Normal priority (load when needed)
  normal: [
    'charts.js',
    'reports.js',
    'notifications.js',
  ],
  
  // Low priority (load last)
  low: [
    'analytics.js',
    'social.js',
    'feedback.js',
  ],
};

// Cache strategies
export const CACHE_STRATEGIES = {
  // Static assets (long cache)
  static: {
    maxAge: 365 * 24 * 60 * 60, // 1 year
    resources: ['images', 'fonts', 'icons'],
  },
  
  // Application code (medium cache)
  app: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    resources: ['js', 'css'],
  },
  
  // API responses (short cache)
  api: {
    maxAge: 5 * 60, // 5 minutes
    resources: ['json', 'data'],
  },
  
  // HTML pages (no cache)
  html: {
    maxAge: 0,
    resources: ['html'],
  },
};

export default {
  BUNDLE_CONFIG,
  ROUTE_CHUNKS,
  dynamicImports,
  PERFORMANCE_THRESHOLDS,
  OPTIMIZATION_STRATEGIES,
  RESOURCE_PRIORITIES,
  CACHE_STRATEGIES,
};