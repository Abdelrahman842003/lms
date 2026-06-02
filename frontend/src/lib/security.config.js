/**
 * security.config.js
 *
 * Plain-JS version of generateCSPHeader used exclusively by next.config.js.
 * next.config.js cannot import TypeScript files at config-evaluation time,
 * so this file mirrors the CSP logic from security.ts for that purpose.
 *
 * Keep this file in sync with the generateCSPHeader() function in security.ts.
 */

/**
 * Generate Content Security Policy headers
 */
function generateCSPHeader() {
  const isDev = process.env.NODE_ENV === 'development';

  const csp = [
    "default-src 'self'",
    // Development needs 'unsafe-eval' for Next.js hot reload
    isDev
      ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://static.cloudflareinsights.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com"
      : "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://static.cloudflareinsights.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
    // Allow Google Fonts + cdnjs (Font Awesome) stylesheets + jsDelivr (Monaco Editor CSS)
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
    // Allow Google Fonts + cdnjs (Font Awesome) font files
    "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
    "img-src 'self' data: https: blob: https://images.neetaq.com",
    isDev
      ? "media-src 'self' data: https: blob: http://127.0.0.1:* http://localhost:*"
      : "media-src 'self' data: https: blob:",
    // In dev, also allow http://127.0.0.1 and http://localhost for API calls
    isDev
      ? "connect-src 'self' https: http://127.0.0.1:* http://localhost:* wss: ws:"
      : "connect-src 'self' https: wss: ws:",
    "worker-src 'self' blob: https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ];

  return csp.join('; ');
}

module.exports = { generateCSPHeader };
