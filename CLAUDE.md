# CLAUDE.md — Neetaq Engineering Constitution

This file is the single source of truth for how code MUST be written in this repository.
If something conflicts with this file, this file wins.

## 0) Claude System Role

You are a Principal Full‑Stack Engineer and Security Reviewer.

You MUST:
- Be strict and opinionated about correctness, security, scalability, and maintainability.
- Prefer “boring, proven” solutions over clever ones.
- Enforce Clean Code + SOLID + key design patterns.
- Assume production standards (observability, safe defaults, and hardening).
- When reviewing: identify issues, classify severity (High/Med/Low), and propose concrete fixes (patch/snippets/tests).
- Follow this constitution and do not invent new architecture without strong justification.

Communication:
- Be direct, actionable, and structured.
- Ask clarifying questions only if a wrong assumption would cause breaking changes; otherwise state assumptions clearly.

---

## 1) Project Overview

**Neetaq (نطاق)** is an educational management platform for academies, teachers, students, and guardians:
attendance, exams, notifications, gamification, reporting, and real‑time updates.

### Tech Stack (Pinned to latest stable)
- Backend: Laravel 12, PHP 8.2+ (prefer newest stable PHP supported by Laravel)
- Performance: Laravel Octane (Swoole)
- Frontend: Next.js (latest stable major), TypeScript (strict), React (stable)
- Styling: Tailwind CSS
- Infra: Docker Compose (MySQL, Redis, Horizon, Nginx)
- Real‑time: Laravel Reverb + Echo

**Version Policy**
- Use latest stable releases only (no RC/Canary in production).
- When upgrading a major version: update this file + migration notes.

---

## 2) Repository Rules (Non‑Negotiable)

### Security & Secrets
- NEVER commit secrets, API keys, Firebase admin credentials, or private certificates.
- `secrets/` must be gitignored and treated as local/dev only.
- If a secret was ever committed: rotate it and remove it from git history (security incident).

### Generated/Local Artifacts
- `node_modules/`, build outputs, logs, cache files MUST NOT be committed.

### Code Quality Gates
Before merging to main:
- Backend: formatting + tests + static analysis (if configured)
- Frontend: lint + typecheck + build
- No failing GitHub Actions checks

---

## 3) Architecture Principles

### 3.1 Backend: Use‑Case Driven Service Architecture (Octane‑Safe)

We follow a strict flow:

**Request (Validation) → DTO → Action/Service (Business Logic) → Resource (Response)**

Rules:
1) Controllers are **thin**:
   - Accept request, call a single use‑case/action/service, return a resource/response.
   - NO business rules, NO query building logic beyond calling a query object/service.

2) Services/Actions contain business logic:
   - Keep them small: one use‑case per class.
   - Stateless, side‑effect aware, testable.

3) DTOs are mandatory:
   - DTO is the only data crossing boundaries into the use‑case layer.
   - DTOs must be immutable (readonly where possible).

4) Resources format output:
   - Never return Eloquent models directly.
   - Use consistent response envelope via ApiResponseTrait.

### 3.2 Module Organization (Domain First)

Preferred structure for NEW code (do not refactor old code unless needed):

`app/Modules/{Domain}/`
- `Http/Controllers/`
- `Http/Requests/`
- `Actions/` (Use‑cases)
- `DTO/`
- `Models/` (optional; or keep in app/Models if already standardized)
- `Policies/`
- `Resources/`
- `Jobs/`
- `Events/`, `Listeners/`
- `Notifications/`
- `Support/` (helpers within module only)

Domains (examples):
- Academy, Admin, Teacher, Student, Guardian, Secretary, Auth

**Rule**: Domain code should not reach into another domain directly.
Use shared contracts/interfaces if necessary.

---

## 4) Backend Standards (Laravel 12 + Octane)

### 4.1 PHP Rules
- `declare(strict_types=1);` at the top of every PHP file.
- Every method MUST have explicit return types.
- Prefer `final` for classes unless extension is intended.
- Prefer typed properties and readonly DTOs.

### 4.2 Validation
- All input validation MUST be done in FormRequest classes.
- Services/Actions must receive validated DTO only.

### 4.3 Database & Eloquent
- No N+1 queries: always use eager loading (`with()`) when returning relational data.
- No query logic in controllers: use a Query object or a dedicated Action.
- Use DB transactions for multi‑step writes:
  - `DB::transaction(fn() => ...)`
- Add indexes for:
  - foreign keys
  - search columns
  - frequently filtered/sorted columns
- Use `casts` consistently (dates, enums, booleans).

### 4.4 Filtering / Sorting / Includes (Standard Contract)

All list endpoints MUST support the same query contract using **spatie/laravel-query-builder** (or equivalent):

- Filters:
  - `filter[field]=value`
  - For range: `filter[from]=2025-01-01&filter[to]=2025-01-31`
  - Multi-values: `filter[status]=active,inactive` (document per endpoint)
- Sorting:
  - `sort=-created_at,name`
- Includes:
  - `include=profile,academy`
- Pagination:
  - `page[number]=1&page[size]=15`

Rules:
- Only allow explicit filters/sorts/includes (allowlist).
- Never accept arbitrary column names from client.
- Return pagination meta consistently.

### 4.5 API Response Contract (Consistent)

All API responses MUST follow the same envelope.

**Success**:
```json
{
  "status": "success",
  "message": "رسالة عربية",
  "data": {},
  "meta": {}
}
```

**Error**:
```json
{
  "status": "error",
  "message": "رسالة عربية",
  "errors": [
    { "code": "VALIDATION_ERROR", "field": "email", "detail": "..." }
  ]
}
```

**Rules**:
- Use Arabic for user-facing messages.
- For developer debugging: log details server-side (never leak stack traces to clients in production).

### 4.6 Authentication & Authorization (Security Critical)

- Authentication MUST be server-enforced.
- Authorization MUST be enforced via Policies/Gates/Spatie Permissions.
- Never trust role/userId from request payload.
- Protect against IDOR: always scope queries to the authenticated user/academy.
- Rate limit auth endpoints (login, OTP, password reset).

**Token Storage**:
- Prefer HttpOnly cookies for tokens (mitigate XSS).
- Avoid storing auth tokens in localStorage. If unavoidable, document why and add strong XSS protections.

### 4.7 Octane Safety (CRITICAL)

Octane runs the app in memory. Any per-request state leakage is a production incident.

**Forbidden**:
- static mutable properties caching request-dependent data
- singletons holding request/user state
- storing Request in service properties
- global variables for request data

**Allowed**:
- stateless services
- caching immutable configs
- using DI properly

> When unsure: assume it is NOT Octane-safe and refactor.

### 4.8 Error Handling & Logging

- Use domain-specific exceptions:
  - `StudentNotFoundException`, `UnauthorizedActionException`, etc.
- Catch exceptions at the edge (global handler), map to consistent API errors.
- Log with context (request id, user id, academy id), but never log secrets or tokens.
- Use structured logs where possible.

### 4.9 Testing (Pest)

- Prefer TDD: tests first for core business logic.
- Tests must cover:
  - happy path
  - validation
  - authorization
  - edge cases
  - concurrency-sensitive logic (where applicable)
- New features MUST include tests unless explicitly waived (and documented in PR).

---

## 5) Frontend Standards (Next.js App Router + TS strict)

### 5.0 Next.js App Router Enforcement

- **ONLY App Router** (`app/` directory) — `pages/` directory is forbidden
- Server Components by default (React Server Components)
- Client Components must have `'use client'` directive
- Latest stable Next.js version (currently 14.x or 15.x stable)

### 5.1 Server-First Rendering Rules

- **Default**: Server Components for all pages/layouts
- **Client Components** only when needed:
  - User interactivity (onClick, useState, useEffect)
  - Browser APIs (localStorage, window)
  - Third-party client libraries
- Keep client components as leaf nodes (push interactivity down the tree)

### 5.2 Data Fetching (Typed)

- **Server Components**: Fetch directly from API (await fetch in component)
- **Client Components**: Use typed API client service
- **API Client**: Single Axios instance with interceptors
  - Base URL from env
  - Credentials: `withCredentials: true` (Sanctum cookie auth)
  - Error handling centralized
- **Runtime Validation**: Use Zod for critical API boundaries
- **Avoid Waterfalls**: Use `Promise.all` for independent requests
- **Data Mutations**: Server Actions (recommended) OR API routes

### 5.3 Caching & Revalidation

- Use Next caching intentionally:
  - Tag-based revalidation for collections (where appropriate)
- After mutations:
  - revalidate relevant tags/paths (Server Actions or API routes strategy)

### 5.4 Filters UX (Single Source of Truth: URL)

Filtering state MUST live in URL query params:
```
?filter[status]=active&sort=-created_at&page[number]=1&page[size]=15
```

**Rules**:
- Filter components update URL via `router.replace` (no full refresh).
- Pages read `searchParams` and fetch accordingly.
- Sharing the link must reproduce the same filtered view.

### 5.5 i18n + RTL

- No hardcoded UI strings.
- Use translation keys (ex: `t('auth.login')`).
- RTL must be supported in layout and component styling.

### 5.6 Frontend Security

- Treat all backend text as untrusted when rendering.
- Avoid `dangerouslySetInnerHTML` unless sanitized and justified.
- Do not expose secrets; only `NEXT_PUBLIC_*` may be used on client.

### 5.7 Frontend Testing

- Unit tests for critical components and services.
- E2E for auth + core flows (attendance, exams, notifications).

---

## 6) Docker & Operations

### 6.1 Docker Best Practices

- Prefer multi-stage builds for production images.
- Run containers as non-root where possible.
- Add healthchecks for critical services.
- Keep images small and reproducible.

### 6.2 Environment Management

- `.env` must never be committed.
- `.env.development` / `.env.production` are templates only.
- Production secrets: Docker secrets or secure environment injection.

---

## 7) Definition of Done (DoD) — Required for Merge

A PR is done only if:

✅ Backend: format + tests pass  
✅ Frontend: lint + typecheck + build pass  
✅ No secrets introduced (gitleaks/trivy recommended)  
✅ API contract is consistent  
✅ Auth/AuthZ checked  
✅ Error handling + logging is appropriate  
✅ Docs updated if behavior changes  
✅ Performance risks addressed (N+1, heavy renders, slow queries)  

---

## 8) How Claude Should Work on This Repo

### When asked to implement or refactor:

1. Summarize requirements and assumptions.
2. Propose a minimal plan aligned with this constitution.
3. Implement changes with:
   - Backend: DTO + Request + Action/Service + Resource
   - Frontend: Typed client + URL-driven filters
4. Add/adjust tests.
5. Provide a short PR checklist and verify DoD.

### When reviewing:

Provide:
- Issues list with severity (High/Med/Low)
- Exact file paths and line references
- Fix suggestions + code snippets
- Security notes + mitigation
- Performance notes

---

## 9) Common Commands (Quick Reference)

### Docker Commands (Primary)

**Development Environment**:
```bash
# Start all services
make up

# Stop all services
make down

# View logs
make logs

# Restart services
docker-compose restart
```

**Backend (Inside Container)**:
```bash
# Access backend container shell
make shell-backend

# Then inside container:
composer install
composer dev
composer test
composer pint
php artisan migrate
php artisan migrate:fresh --seed
php artisan horizon
php artisan octane:reload
php artisan queue:work
```

**Frontend (Inside Container)**:
```bash
# Access frontend container shell
make shell-frontend

# Then inside container:
npm install
npm run dev
npm run build
npm run start
npm run lint
npm run type-check
npm run test
npm run test:e2e
```

**Database & Migrations**:
```bash
# Run migrations
make migrate

# Fresh database with seeding
make fresh

# Database backup
docker exec -i mysql_container mysqldump -u root -ppassword dbname > backup.sql
```

**Production Deployment**:
```bash
# Build production images
make prod-build

# Start production
make prod-up

# View production logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Quick Shortcuts (Without Docker - Local Dev Only)

> ⚠️ These are for local development WITHOUT Docker. Not recommended for this project.

**Root**:
```bash
npm run dev
npm run build
```

**Backend (Local)**:
```bash
cd backend
composer dev
composer test
composer pint
php artisan serve
php artisan octane:start
```

**Frontend (Local)**:
```bash
cd frontend
npm run dev
npm run build
npm run lint
```

---

## 10) Performance & Scalability Requirements

### 10.1 Database Performance
- **Query Optimization**:
  - No N+1 queries (use `with()` for eager loading)
  - Use `select()` to fetch only needed columns
  - Add compound indexes for frequently used filter combinations
  - Use `exists()` instead of `count() > 0`
  - Prefer `chunk()` or `cursor()` for large datasets

- **Caching Strategy**:
  - Cache static/rarely-changing data (configs, translations)
  - Use Redis for session and cache storage
  - Tag-based cache invalidation for related data
  - Cache expensive queries with appropriate TTL
  - Never cache user-specific data in shared cache

### 10.2 API Performance
- **Response Times** (p95):
  - Simple reads: < 100ms
  - Complex queries: < 500ms
  - Mutations: < 1s
  - Heavy operations: move to background jobs

- **Rate Limiting** (configurable via env):
  - Login attempts: 5 per minute per IP
  - OTP requests: 3 per 5 minutes per user
  - Password reset: 2 per hour per email
  - API endpoints: 60 per minute per user
  - Public endpoints: 30 per minute per IP
  - Use Laravel's built-in rate limiting
  - Override in `config/rate-limit.php` for environment-specific tuning

- **Pagination**:
  - Default page size: 15
  - Max page size: 100
  - Use cursor pagination for large datasets

### 10.3 Frontend Performance
- **Core Web Vitals Targets**:
  - LCP (Largest Contentful Paint): < 2.5s
  - FID (First Input Delay): < 100ms
  - CLS (Cumulative Layout Shift): < 0.1

- **Bundle Optimization**:
  - Code splitting by route
  - Lazy load heavy components
  - Dynamic imports for modals/dialogs
  - Tree shaking enabled
  - Analyze bundle size regularly

- **Image Optimization**:
  - Use Next.js Image component
  - WebP format with fallbacks
  - Responsive images with srcset
  - Lazy loading for below-fold images

### 10.4 Real-Time Performance
- **WebSocket Connections**:
  - Connection pooling
  - Auto-reconnect with exponential backoff
  - Heartbeat for connection health
  - Graceful degradation to polling

- **Broadcasting**:
  - Use private channels for user-specific data
  - Batch notifications when possible
  - Queue heavy broadcast jobs

---

## 11) Security Standards (Defense in Depth)

### 11.1 Input Validation & Sanitization
- **Never Trust Client Input**:
  - Validate ALL inputs server-side
  - Use FormRequest for structured validation
  - Sanitize HTML/SQL/JS where needed
  - Type-cast and normalize data

- **Injection Prevention**:
  - Use Eloquent ORM (prepared statements)
  - Never concatenate SQL strings
  - Escape output in Blade templates
  - Use CSP headers

### 11.2 Authentication Security
- **Password Requirements**:
  - Minimum 8 characters
  - Mix of letters, numbers, symbols
  - Check against common passwords list
  - Use Laravel's `Password::defaults()` with custom rules
  - Hash with bcrypt (Laravel default) — monitor performance and adjust cost if needed

- **Session Management**:
  - HttpOnly, Secure cookies (ALWAYS in production)
  - SameSite=Lax (default) or Strict for critical operations
  - Session timeout: 2 hours of inactivity
  - Force re-auth for sensitive operations
  - Invalidate all sessions on password change

- **Authentication Strategy** (Sanctum):
  - **SPA Mode**: Cookie-based auth with CSRF protection
  - CORS configured for frontend domain only
  - `withCredentials: true` in API client
  - NO Bearer tokens in localStorage (XSS risk)
  - Mobile apps: use Sanctum token auth with proper storage

- **Multi-Factor Authentication**:
  - Support OTP via SMS/Email
  - Rate limit OTP requests
  - OTP expiry: 5 minutes
  - Max attempts: 3

### 11.3 Authorization (CRITICAL)
- **Always Check Permissions**:
  - Use Laravel Policies for all actions
  - Never rely on client-side role checks
  - Scope all queries to user's accessible data
  - Log authorization failures

- **IDOR Prevention**:
  - Always verify resource ownership via Policies
  - Use integer IDs internally for performance
  - Use UUIDs/ULIDs for public API exposure (user-facing URLs)
  - Alternative: Keep integer IDs + strong authorization policies
  - For sensitive routes: consider signed URLs
  - Implement proper access control checks at every endpoint

### 11.4 API Security
- **Rate Limiting** (already covered in Performance)
- **CORS Configuration**:
  - Whitelist specific origins only
  - No wildcard (*) in production
  - Credentials: true only if needed

- **Security Headers**:
  ```
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  ```
  
  > Note: `X-XSS-Protection` is deprecated in modern browsers. Focus on CSP and proper output encoding instead.

### 11.5 Data Protection
- **Encryption**:
  - Encrypt sensitive fields in database
  - Use Laravel's encrypted casting
  - HTTPS only in production
  - Encrypt backups

- **PII Handling**:
  - Minimize PII collection
  - Document PII fields and retention
  - Support data export (GDPR)
  - Support data deletion (right to be forgotten)

- **Logging Security**:
  - Never log passwords, tokens, or secrets
  - Sanitize logs of PII where possible
  - Secure log storage and access
  - Log retention policy: 90 days

### 11.6 Dependency Security
- **Regular Updates**:
  - Update dependencies monthly
  - Apply security patches immediately
  - Use `composer audit` and `npm audit`
  - Pin major versions, allow patch updates

---

## 12) Observability & Monitoring

### 12.1 Logging Standards
- **Log Levels** (use appropriately):
  - **DEBUG**: Detailed dev info (not in production)
  - **INFO**: General informational messages
  - **WARNING**: Unexpected but handled situations
  - **ERROR**: Error conditions that need attention
  - **CRITICAL**: System-level failures

- **Structured Logging**:
  ```php
  Log::info('User logged in', [
      'user_id' => $user->id,
      'ip' => $request->ip(),
      'user_agent' => $request->userAgent(),
      'timestamp' => now(),
  ]);
  ```

- **What to Log**:
  - Auth events (login, logout, failed attempts)
  - Authorization failures
  - Data mutations (created, updated, deleted)
  - External API calls
  - Background job failures
  - Performance anomalies

### 12.2 Error Tracking
- **Exception Handling**:
  - Catch exceptions at appropriate boundaries
  - Log with full context (user, request, stack trace)
  - Return user-friendly errors to client
  - Alert on critical errors

- **Error Monitoring** (recommended: Sentry/Bugsnag):
  - Automatic error reporting
  - Group similar errors
  - Track error trends
  - Alert on new errors

### 12.3 Performance Monitoring
- **Metrics to Track**:
  - Response times (p50, p95, p99)
  - Error rates
  - Queue sizes and wait times
  - Database query times
  - Cache hit rates
  - WebSocket connections

- **APM Tools** (recommended: New Relic/DataDog):
  - Transaction tracing
  - Database query profiling
  - External service monitoring
  - Custom metrics

### 12.4 Health Checks
- **Endpoint**: `/health`
- **Check**:
  - Database connectivity
  - Redis connectivity
  - Queue workers running
  - Storage accessible
  - External services (optional)

- **Response**:
  ```json
  {
    "status": "healthy",
    "checks": {
      "database": "ok",
      "redis": "ok",
      "queue": "ok",
      "storage": "ok"
    },
    "timestamp": "2026-02-12T10:00:00Z"
  }
  ```

---

## 13) Development Workflow

### 13.1 Branch Strategy
- **Main Branches**:
  - `main`: Production-ready code only
  - `develop`: Integration branch for features

- **Feature Branches**:
  - Naming: `feature/{domain}/{brief-description}`
  - Example: `feature/teacher/attendance-bulk-update`
  - Branch from `develop`
  - Merge back to `develop` via PR

- **Hotfix Branches**:
  - Naming: `hotfix/{brief-description}`
  - Branch from `main`
  - Merge to both `main` and `develop`

### 13.2 Commit Messages
Follow Conventional Commits:
```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding missing tests
- `chore`: Updating build tasks, configs, etc.

Examples:
```
feat(teacher): add bulk attendance update endpoint
fix(auth): prevent session fixation vulnerability
docs(readme): update deployment instructions
perf(student): optimize enrollment query with eager loading
```

### 13.3 Pull Request Process
1. **Create PR** with:
   - Clear title following commit convention
   - Description explaining what and why
   - Link to related issues/tickets
   - Screenshots for UI changes
   - Testing notes

2. **PR Checklist** (template):
   ```markdown
   ## Changes
   - [ ] Feature/Fix description
   
   ## Testing
   - [ ] Unit tests added/updated
   - [ ] Manual testing completed
   - [ ] Edge cases covered
   
   ## Quality
   - [ ] Code formatted (Pint/Prettier)
   - [ ] No lint errors
   - [ ] TypeScript checks pass
   - [ ] No console.log or dd() left
   
   ## Security
   - [ ] No secrets committed
   - [ ] Auth/AuthZ properly checked
   - [ ] Input validation added
   - [ ] No SQL injection risks
   
   ## Performance
   - [ ] No N+1 queries
   - [ ] Appropriate indexes added
   - [ ] Heavy operations moved to jobs
   - [ ] Caching considered
   
   ## Documentation
   - [ ] API docs updated (if applicable)
   - [ ] README updated (if applicable)
   - [ ] Migration notes (if applicable)
   ```

3. **Code Review**:
   - At least 1 approval required
   - Address all comments
   - Re-request review after changes

4. **Merge**:
   - Squash and merge (for clean history)
   - Delete branch after merge
   - Deploy to staging first

### 13.4 Testing Strategy
- **Unit Tests** (70%+ coverage):
  - Business logic in Services/Actions
  - DTOs and transformations
  - Helpers and utilities

- **Feature Tests** (key flows):
  - API endpoints (happy path + errors)
  - Auth flows
  - CRUD operations
  - Complex business scenarios

- **Integration Tests** (critical paths):
  - Payment flows
  - Notification delivery
  - Real-time features

- **E2E Tests** (smoke tests):
  - Login/Logout
  - Student enrollment
  - Attendance marking
  - Exam taking

---

## 14) Deployment & Release

### 14.1 Deployment Checklist
- [ ] All tests passing on CI
- [ ] Staging deployment successful
- [ ] Smoke tests on staging passed
- [ ] Database migrations reviewed and tested
- [ ] Environment variables configured
- [ ] Secrets rotated (if needed)
- [ ] Rollback plan documented
- [ ] Monitoring/alerts configured
- [ ] Team notified of deployment

### 14.2 Database Migrations
- **Safe Migrations**:
  - Never drop columns/tables directly in production
  - Use multi-step deployments for breaking changes:
    1. Add new column (nullable)
    2. Migrate data
    3. Make required
    4. Drop old column (later)

- **Testing**:
  - Test on production-like data
  - Test rollback (down migrations)
  - Check for blocking/slow queries
  - Verify indexes are created

- **Zero-Downtime Deploys**:
  - Migrations must be backward compatible
  - Use feature flags for new code paths
  - Rolling deployments with health checks

### 14.3 Rollback Strategy
- **Automated Rollback** triggers:
  - Health check failures
  - Error rate > 5%
  - p95 latency > 2x baseline

- **Manual Rollback**:
  ```bash
  # Docker Compose
  git checkout <previous-tag>
  make prod-build
  make prod-up
  
  # Database rollback (if needed)
  php artisan migrate:rollback --step=1
  ```

- **Post-Rollback**:
  - Identify root cause
  - Fix in new PR
  - Test thoroughly before redeploying

---

## 15) Incident Response

### 15.1 Severity Levels
- **P0 (Critical)**: Complete system outage, data loss risk
  - Response time: Immediate
  - Resolution time: < 1 hour
  - Notification: All stakeholders

- **P1 (High)**: Major feature broken, security incident
  - Response time: < 15 minutes
  - Resolution time: < 4 hours
  - Notification: Dev team + stakeholders

- **P2 (Medium)**: Minor feature degradation
  - Response time: < 1 hour
  - Resolution time: < 24 hours
  - Notification: Dev team

- **P3 (Low)**: Cosmetic issues, minor bugs
  - Response time: < 1 day
  - Resolution time: Next sprint

### 15.2 Incident Response Process
1. **Detect & Alert**: Monitoring catches issue
2. **Assess**: Determine severity and impact
3. **Communicate**: Notify team and stakeholders
4. **Mitigate**: Apply immediate fixes (hotfix, rollback, config change)
5. **Resolve**: Deploy permanent fix
6. **Post-Mortem**: Document what happened and how to prevent

### 15.3 Post-Mortem Template
```markdown
# Incident Post-Mortem: [Title]

**Date**: YYYY-MM-DD
**Duration**: X hours
**Severity**: P0/P1/P2/P3
**Impact**: Description of user impact

## Timeline
- HH:MM - Incident began
- HH:MM - Detected
- HH:MM - Team notified
- HH:MM - Mitigation applied
- HH:MM - Resolved

## Root Cause
[Detailed explanation]

## Resolution
[What was done to fix]

## Action Items
- [ ] Preventive measure 1
- [ ] Preventive measure 2
- [ ] Documentation update
- [ ] Test coverage addition

## Lessons Learned
[What we learned and will do differently]
```

---

## 16) Documentation Standards

### 16.1 Code Documentation
- **PHPDoc** for all public methods:
  ```php
  /**
   * Create a new student enrollment
   *
   * @param StudentData $data The student data
   * @param int $academyId The academy ID
   * @return Student The created student
   * @throws ValidationException If validation fails
   * @throws UnauthorizedException If user lacks permission
   */
  public function create(StudentData $data, int $academyId): Student
  ```

- **JSDoc** for complex functions:
  ```typescript
  /**
   * Fetch student attendance records with filtering
   * 
   * @param studentId - The student's ID
   * @param filters - Optional filters for date range and status
   * @returns Promise resolving to attendance records
   * @throws {ApiError} When the API request fails
   */
  async function fetchAttendance(
    studentId: string,
    filters?: AttendanceFilters
  ): Promise<AttendanceRecord[]>
  ```

### 16.2 API Documentation
- **OpenAPI/Swagger** for all endpoints
- Document:
  - Request/response schemas
  - Query parameters (filters, sorting, pagination)
  - Error responses
  - Auth requirements
  - Rate limits

### 16.3 Architecture Documentation
- **ADRs (Architecture Decision Records)** for major decisions
- **Diagrams** for complex flows:
  - Entity relationships
  - Sequence diagrams for multi-step processes
  - System architecture overview

---

## 17) Accessibility Standards

### 17.1 WCAG 2.1 AA Compliance
- **Keyboard Navigation**:
  - All interactive elements keyboard accessible
  - Logical tab order
  - Visible focus indicators

- **Screen Reader Support**:
  - Semantic HTML
  - ARIA labels where needed
  - Alt text for images
  - Proper heading hierarchy

- **Visual**:
  - Color contrast ratio ≥ 4.5:1
  - Text resizable up to 200%
  - No content only conveyed by color

### 17.2 RTL (Right-to-Left) Support
- Use CSS logical properties:
  ```css
  /* Instead of margin-left */
  margin-inline-start: 1rem;
  
  /* Instead of text-align: left */
  text-align: start;
  ```

- Test all layouts in RTL mode
- Support Arabic number formatting
- Handle mixed LTR/RTL content

---

## 18) Continuous Improvement

### 18.1 Code Reviews (Learn & Share)
- Review for:
  - Correctness
  - Security
  - Performance
  - Maintainability
  - Consistency with this constitution

- Provide:
  - Specific feedback with examples
  - Learning resources
  - Praise for good work

### 18.2 Refactoring
- **When to Refactor**:
  - When adding related features
  - When fixing bugs in messy code
  - During dedicated refactoring sprints
  - NOT during urgent hotfixes

- **How to Refactor**:
  - Small, incremental changes
  - Keep tests passing
  - One PR per refactoring
  - Document before/after

### 18.3 Technical Debt
- **Track** in backlog with:
  - Description
  - Impact (High/Med/Low)
  - Effort estimate
  - Proposed solution

- **Allocate** 20% of sprint capacity to tech debt
- **Prioritize** high-impact, low-effort items

---

## 19) Claude Implementation Workflow

When implementing a new feature, Claude MUST follow this workflow:

### Phase 1: Understanding & Planning
1. **Read Context**:
   - Feature requirements
   - Relevant existing code
   - API contracts (if extending)
   - Related domain models

2. **Clarify**:
   - Ask about ambiguities (if any)
   - State assumptions clearly
   - Identify potential issues

3. **Plan**:
   - Backend: List files to create/modify (DTOs, Requests, Services, Controllers, Models, Migrations, Tests)
   - Frontend: List components, services, hooks, types
   - API endpoints and contracts
   - Database changes (migrations, indexes)

4. **Get Approval** (when needed):
   - **Must ask** for: Breaking changes, schema migrations, new dependencies, auth changes, architectural decisions
   - **Proceed with clear assumptions** for: New features, bug fixes, refactoring within existing patterns
   - Always state assumptions upfront in implementation

### Phase 2: Implementation
1. **Backend** (in order):
   - Migration (if needed)
   - Model updates
   - DTO
   - FormRequest
   - Service/Action
   - Controller
   - Resource
   - Routes
   - Tests

2. **Frontend** (in order):
   - Types
   - Service (API layer)
   - Hook (if needed)
   - Components
   - Page
   - Tests

3. **Quality Checks**:
   - Run formatters (Pint/Prettier)
   - Run linters
   - Run tests
   - Check for N+1 queries
   - Verify auth/authz

### Phase 3: Documentation & Review
1. **Document**:
   - Update API docs (if applicable)
   - Add code comments
   - Update README (if needed)

2. **Self-Review**:
   - Check against DoD (Definition of Done)
   - Verify security considerations
   - Confirm performance is acceptable
   - Ensure consistency with this constitution

3. **Provide PR Summary**:
   - What changed
   - Why it changed
   - How to test
   - Any breaking changes
   - Migration notes (if applicable)

---

## 20) Anti-Patterns (DO NOT DO)

### Backend Anti-Patterns
❌ Business logic in Controllers
❌ Direct model access without authorization check
❌ Hardcoded strings instead of configs/translations
❌ Returning Eloquent models directly from API
❌ Using `dd()` or `var_dump()` (use proper logging)
❌ Static methods for testable logic
❌ God classes (Controllers/Services doing too much)
❌ Global state in Octane environment
❌ Ignoring validation errors
❌ Suppressing exceptions without logging

### Frontend Anti-Patterns
❌ Deep props drilling (> 3 levels) — use composition or Context
❌ Hardcoded strings (use i18n)
❌ `any` type in TypeScript (use `unknown` if truly needed)
❌ Inline styles (use Tailwind classes)
❌ Mutating props
❌ Unhandled promise rejections
❌ Fetching in useEffect when server component can do it
❌ Client components at root level unnecessarily
❌ localStorage for sensitive data (auth tokens, PII)
❌ Ignoring TypeScript errors

> **Note**: Shallow props drilling (1-2 levels) is often simpler than premature Context abstraction.

### General Anti-Patterns
❌ Copy-paste code (DRY principle)
❌ Premature optimization
❌ Over-engineering simple features
❌ Skipping tests (exception: urgent hotfix + documented + follow-up ticket created)
❌ TODO comments without ticket references
❌ Committing commented-out code
❌ Ignoring CI failures

### Team Guidelines (Not Hard Rules)
⚠️ Avoid Friday deployments for major releases (unless critical hotfix)
⚠️ Document "temporary" hacks with expiration dates
⚠️ Prefer boring, proven solutions over clever ones

---

## 21) Glossary & Conventions

### Terms
- **DTO**: Data Transfer Object (immutable data container)
- **Action**: Single-purpose use-case class
- **Service**: Business logic layer (may contain multiple related actions)
- **Resource**: API response formatter
- **FormRequest**: Laravel request validation class
- **Octane-Safe**: Code that works correctly in persistent worker environment
- **IDOR**: Insecure Direct Object Reference vulnerability

### File Naming
- Controllers: `{Entity}Controller.php` (e.g., `StudentController.php`)
- Requests: `{Action}{Entity}Request.php` (e.g., `StoreStudentRequest.php`)
- DTOs: `{Entity}Data.php` (e.g., `StudentData.php`)
- Resources: `{Entity}Resource.php` (e.g., `StudentResource.php`)
- Tests: `{Class}Test.php` (e.g., `StudentServiceTest.php`)

### Naming Conventions
- **Backend**:
  - Classes: `PascalCase`
  - Methods: `camelCase`
  - Properties: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Database tables: `snake_case` (plural)
  - Database columns: `snake_case`

- **Frontend**:
  - Components: `PascalCase`
  - Files: Match component name
  - Functions: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Types/Interfaces: `PascalCase`
  - CSS classes: `kebab-case` (when not using Tailwind)

---

## 22) Resources & References

### Laravel Best Practices
- [Laravel Documentation](https://laravel.com/docs)
- [Laravel Beyond CRUD (Spatie)](https://laravel-beyond-crud.com/)
- [Laravel Best Practices (Alexey Mezenin)](https://github.com/alexeymezenin/laravel-best-practices)

### Next.js Best Practices
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Security Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Laravel Security Best Practices](https://laravel.com/docs/security)
- [Web Security Academy](https://portswigger.net/web-security)

### Performance
- [Laravel Performance](https://laravel.com/docs/octane)
- [Web.dev Performance](https://web.dev/performance/)
- [MySQL Performance](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)

---

## 23) Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-12 | Initial comprehensive constitution |
| 1.1.0 | 2026-02-12 | Critical fixes and improvements:<br>- Fixed Markdown code blocks<br>- Clarified Sanctum cookie-based auth strategy<br>- Updated security headers (removed deprecated X-XSS-Protection)<br>- Made rate limiting configurable<br>- Clarified UUID vs integer ID strategy<br>- Refined "Get Approval" to reduce bottlenecks<br>- Improved props drilling guidance<br>- Moved Friday deployment to guidelines<br>- Added Next.js App Router enforcement<br>- Added Server Actions vs API routes guidance |

---

## Final Notes

This constitution is a living document. It should be:
- **Reviewed**: Quarterly or after major incidents
- **Updated**: When new patterns emerge or requirements change
- **Enforced**: In every code review and by automated tools where possible
- **Referenced**: In all technical discussions and PRs

When in doubt, ask: "Does this align with our constitution?" If not, either fix the code or propose an update to the constitution with strong justification.

**Remember**: We prefer boring, proven, maintainable code over clever, cutting-edge, fragile code. We optimize for long-term maintainability and team productivity.

---

**End of Constitution** 🏛️