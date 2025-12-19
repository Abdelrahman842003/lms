// LMS Offline-First Service Worker v3
const CACHE_NAME = 'lms-cache-v3';
const STATIC_CACHE = 'lms-static-v3';
const API_CACHE = 'lms-api-v3';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.png',
  '/offline.html',
];

// API routes for Stale-While-Revalidate (frequently changing data)
const SWR_ROUTES = [
  '/api/student/dashboard',
  '/api/teacher/dashboard/stats',
  '/api/teacher/payments/pending',
  '/api/teacher/payments/statistics',
  '/api/student/payments/pending',
];

// API routes to cache (Network First with Cache Fallback)
const CACHEABLE_API_ROUTES = [
  '/api/student/me',
  '/api/teacher/me',
  '/api/teacher/students',
  '/api/teacher/grades',
  '/api/teacher/groups',
  '/api/student/exams',
  '/api/student/lectures',
];

// ===================
// Install Event
// ===================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ===================
// Activate Event
// ===================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => 
              name.startsWith('lms-') && 
              name !== CACHE_NAME && 
              name !== STATIC_CACHE && 
              name !== API_CACHE
            )
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// ===================
// Fetch Event
// ===================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (let them pass through)
  if (request.method !== 'GET') {
    return;
  }

  // Skip non-http/https requests (like chrome-extension://)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Static assets: Cache First
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // API routes with SWR: Stale-While-Revalidate
  if (isSWRRoute(url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Cacheable API routes: Network First with Cache Fallback
  if (isCacheableAPIRoute(url)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Other API routes: Network only
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkOnly(request));
    return;
  }

  // Next.js pages/chunks: Network First with Cache (so updates are applied)
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Default: Network with offline fallback
  event.respondWith(networkFirst(request));
});

// ===================
// Background Sync
// ===================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-payments') {
    event.waitUntil(notifyClientsToSync());
  }
});

// ===================
// Helper Functions
// ===================

function isStaticAsset(url) {
  return STATIC_ASSETS.includes(url.pathname) ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|css|js)$/);
}

function isSWRRoute(url) {
  return SWR_ROUTES.some((route) => url.pathname.startsWith(route));
}

function isCacheableAPIRoute(url) {
  return CACHEABLE_API_ROUTES.some((route) => url.pathname.startsWith(route));
}

// ===================
// Caching Strategies
// ===================

// Cache First: Use cache, fallback to network
async function cacheFirst(request, cacheName = CACHE_NAME) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return caches.match('/offline.html');
  }
}

// Network First: Try network, fallback to cache
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    // For HTML pages, show offline page
    if (request.headers.get('Accept')?.includes('text/html')) {
      return caches.match('/offline.html');
    }
    // For API, return offline response
    return new Response(
      JSON.stringify({ error: 'offline', message: 'أنت غير متصل بالإنترنت' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Stale-While-Revalidate: Return cache immediately, update in background
async function staleWhileRevalidate(request) {
  const cache = await caches.open(API_CACHE);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  // Return cached immediately if available
  if (cached) {
    // Trigger revalidation in background
    networkFetch;
    return cached;
  }

  // No cache, wait for network
  const response = await networkFetch;
  if (response) {
    return response;
  }

  // Network failed and no cache
  return new Response(
    JSON.stringify({ error: 'offline', message: 'أنت غير متصل بالإنترنت' }),
    {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// Network Only: No caching
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response(
      JSON.stringify({ error: 'offline', message: 'أنت غير متصل بالإنترنت' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// ===================
// Client Communication
// ===================

async function notifyClientsToSync() {
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_PAYMENTS' });
  });
}

// Listen for messages from client
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
