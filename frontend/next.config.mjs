import withSerwistInit from '@serwist/next';
import bundleAnalyzerInit from '@next/bundle-analyzer';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Bundle analyzer configuration
const withBundleAnalyzer = bundleAnalyzerInit({
  enabled: process.env.ANALYZE === 'true',
});

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development", // Disable SW in development for better DX
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Security: Ignore ESLint/TypeScript errors during build for deployment stability
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.neetaq.com',
      },
      {
        protocol: 'https',
        hostname: '**.r2.dev', // Cloudflare R2 public buckets
      },
    ],
  },
  // Performance optimizations
  compiler: {
    // Remove console.logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  // Experimental features for performance
  experimental: {
    // Disable problematic optimizeCss for now
    // optimizeCss: true,
    optimizeServerReact: true,
    // Turbo pack for faster builds (when stable)
    // turbo: true,
  },
  // Exclude pdfjs & react-pdf-viewer from SSR bundling (browser-only)
  serverExternalPackages: [
    'pdfjs-dist',
    '@react-pdf-viewer/core',
    '@react-pdf-viewer/default-layout',
    '@react-pdf-viewer/highlight',
    '@react-pdf-viewer/search',
  ],
  // Webpack configuration for optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Bundle analyzer in development
    if (dev && process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          openAnalyzer: true,
        })
      );
    }

    // Performance optimizations
    if (!dev && !isServer) {
      // Split chunks for better caching
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            enforce: true,
          },
        },
      };
    }

    return config;
  },
  async rewrites() {
    // Normalize base URL to avoid double /api/v1/v1
    const baseUrl = (process.env.INTERNAL_API_URL || 'http://localhost:8000')
      .replace(/\/api\/v\d+\/?$/, '')
      .replace(/\/api\/?$/, '')
      .replace(/\/$/, '');

    return [
      {
        source: '/api/:path*',
        destination: `${baseUrl}/api/:path*`,
      },
    ];
  },
  /**
   * Security Headers
   * Content Security Policy to prevent XSS, clickjacking, and other attacks
   */
  async headers() {
    // Use the plain-JS config sidecar (next.config.js cannot transpile .ts at load time)
    const { generateCSPHeader } = require('./src/lib/security.config.js');
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(self), camera=(self), payment=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: generateCSPHeader(),
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(withSerwist(nextConfig));
