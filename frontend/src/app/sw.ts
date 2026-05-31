/// <reference lib="webworker" />

import { installSerwist } from "@serwist/sw";
import type { PrecacheEntry, RouteHandlerCallbackOptions } from "@serwist/sw";

declare const self: any;

// Create a custom Serwist Service Worker
const precacheEntries = [
  ...(self.__SW_MANIFEST || []),
  { url: "/offline", revision: "1.0.0" }
];

installSerwist({
  precacheEntries,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Precached navigation / App Shell fallback
    {
      matcher: ({ request }: RouteHandlerCallbackOptions) => request.mode === "navigate",
      handler: "NetworkFirst",
      options: {
        cacheName: "serwist-pages",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        networkTimeoutSeconds: 3, // Fast fallback if network is sluggish
        plugins: [
          {
            // Custom fallback mechanism for offline routing
            handlerDidError: async () => {
              return (await caches.match("/offline")) || Response.error();
            },
          },
        ],
      },
    },
    // Next.js JS, CSS, and internal chunks
    {
      matcher: ({ url }: RouteHandlerCallbackOptions) => url.pathname.startsWith("/_next/static/"),
      handler: "CacheFirst",
      options: {
        cacheName: "serwist-next-static",
        expiration: {
          maxEntries: 150,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    // Static assets in public folder
    {
      matcher: ({ url }: RouteHandlerCallbackOptions) => 
        url.pathname.startsWith("/logo.png") || 
        url.pathname.startsWith("/pwa-192.png") || 
        url.pathname.startsWith("/pwa-512.png") || 
        url.pathname.startsWith("/pwa.png") || 
        url.pathname.startsWith("/favicon.ico") ||
        url.pathname.startsWith("/assets/"),
      handler: "CacheFirst",
      options: {
        cacheName: "serwist-public-assets",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    // Images (local or Cloudflare R2 images.neetaq.com)
    {
      matcher: ({ request, url }: RouteHandlerCallbackOptions) => 
        request.destination === "image" ||
        url.hostname.includes("r2.dev") ||
        url.hostname.includes("images.neetaq.com"),
      handler: "CacheFirst",
      options: {
        cacheName: "serwist-images",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 15 * 24 * 60 * 60, // 15 days
        },
      },
    },
    // Google fonts or other Web Fonts
    {
      matcher: ({ request }: RouteHandlerCallbackOptions) => request.destination === "font" || request.url.includes("fonts.gstatic.com"),
      handler: "CacheFirst",
      options: {
        cacheName: "serwist-fonts",
        expiration: {
          maxEntries: 15,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
    // Next.js App Router RSC Payloads
    {
      matcher: ({ request, url }: RouteHandlerCallbackOptions) => {
        return url.searchParams.has("_rsc") || request.headers.get("RSC") === "1";
      },
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "serwist-rsc-payloads",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // API GET calls (Dashboard lists, categories, lectures, notes)
    {
      matcher: ({ url, request }: RouteHandlerCallbackOptions) => 
        url.pathname.includes("/api/v1/") && 
        request.method === "GET" &&
        !url.pathname.includes("/auth/token") &&
        !url.pathname.includes("/public-settings") && // bypass settings cache for real-time toggle
        !url.pathname.includes("/csrf-cookie"),
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "serwist-api-get",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
});
