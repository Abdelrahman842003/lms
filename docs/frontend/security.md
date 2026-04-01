---
title: Security
description: CSRF protection, input sanitization, CSP, and secure token management
---

# Security

## CSRF Protection

**Source:** `frontend/src/lib/csrf.ts`

Single-flight CSRF token initialization:

| Function | Description |
|----------|-------------|
| `getCSRFToken()` | Extract XSRF-TOKEN from cookies |
| `initializeCSRF()` | Fetch CSRF cookie from Sanctum (single-flight) |
| `validateCSRF()` | Validate token existence and freshness |

**Hook:** `useCSRFInit()` initializes CSRF on mount, `useCSRFAutoRefresh()` provides periodic refresh.

## Input Sanitization

**Source:** `frontend/src/lib/security.ts`

| Function | Description |
|----------|-------------|
| `sanitizeHtml(html)` | XSS prevention — strips dangerous tags and attributes |
| `sanitizeInput(input)` | Strips HTML tags and javascript: protocols |
| `sanitizePhone(phone)` | Normalizes Egyptian phone format |
| `validateEmail(email)` | Email format validation |

Also includes:
- Content Security Policy string generation
- Rate limiting class for client-side throttling
- Security event logging

## Content Security Policy

**Source:** `frontend/src/lib/security.config.js`

Generates CSP headers for Next.js config:
- Development vs production specific directives
- Script-src, style-src, img-src, connect-src configuration
- Environment variable driven

## Auth Cookie Management

**Source:** `frontend/src/utils/authHelpers.ts`

| Cookie | Purpose | Flags |
|--------|---------|-------|
| `auth_state` | Session indicator | Secure (HTTPS), SameSite=Lax |
| `user_role` | Role for middleware routing | Secure, SameSite=Lax |

Functions: `setAuthCookie()`, `clearAuthCookie()` with proper security flags.

## Form Validation

**Source:** `frontend/src/hooks/useForm.ts`

Built-in validation rules with auto-sanitization:
- `required` — Non-empty check
- `min` / `max` — Length constraints
- `pattern` — Regex matching
- `email` — Email format validation
- `phone` — Phone format validation
- `custom` — Custom validation function

Inputs are auto-sanitized through security utilities before submission.

## Video Security

**Source:** `frontend/src/hooks/useVideoPlayback.ts`

- **Device Fingerprinting** — Unique device identification for playback sessions
- **Session Tokens** — Time-limited playback tokens from server
- **Watermark Overlay** — Rotating student info watermark (`WatermarkOverlay.tsx`)
- **Progress Sync** — Periodic progress updates to server

## Middleware Route Protection

**Source:** `frontend/src/middleware.ts`

- Cookie-based session check (`auth_state`)
- Role-based redirects for protected routes
- Unauthenticated users redirected to `/login?redirect=<path>`
- Authenticated users redirected away from login/register pages
