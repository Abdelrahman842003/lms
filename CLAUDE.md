# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Neetaq (نطاق)** is a comprehensive educational management platform for academies, teachers, students, and parents. It features attendance tracking, exam management, notifications, gamification, and reporting.

- **Backend**: Laravel 12 with PHP 8.2+, using Laravel Octane (Swoole) for performance
- **Frontend**: Next.js 15 with TypeScript, React 18, and Tailwind CSS
- **Infrastructure**: Docker Compose with MySQL, Redis, Horizon, and Nginx

## Common Development Commands

### Root Directory (Workspace)

```bash
# Run both frontend and backend in development
npm run dev

# Build both workspaces
npm run build
```

### Backend (Laravel)

```bash
cd backend

# Development server (runs queue and logs concurrently)
composer dev

# Run tests
composer test
# Or: php artisan test

# Code formatting
composer pint

# Database migrations
php artisan migrate
php artisan migrate:fresh --seed

# Queue workers
php artisan queue:listen --tries=1
php artisan horizon     # Horizon dashboard for queue monitoring

# Cache operations
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Clear caches
php artisan config:clear
php artisan route:clear
php artisan cache:clear

# Tinker (REPL)
php artisan tinker
```

### Frontend (Next.js)

```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Production server (after build)
npm run start

# Linting and type checking
npm run lint
npm run type-check

# Testing
npm run test
npm run test:coverage
npm run test:e2e

# Bundle analysis
npm run build:analyze
npm run analyze
```

### Docker Commands

```bash
# From project root

# Development
make up                    # Start all services
make down                  # Stop all services
make logs                  # Show logs
make shell-backend         # Access backend container
make shell-frontend        # Access frontend container
make migrate               # Run migrations in container
make fresh                 # Reset database

# Production
make prod-build            # Build production containers
make prod-up               # Start production environment
```

## Architecture

### Service-First Backend

The backend follows a strict service-layer architecture:

1. **Controllers** (`app/Http/Controllers/{Module}/`) - Handle HTTP requests only, delegate to services
2. **Services** (`app/Services/{Module}/`) - Contain all business logic
3. **DTOs** (`app/DTOs/{Module}/`) - Data transfer objects for validation/transformation
4. **Models** (`app/Models/`) - Eloquent models with relationships
5. **Resources** (`app/Http/Resources/{Module}/`) - API response transformers

**Key principle**: Controllers must NOT contain business logic. All logic goes into Services.

### Module Organization

Both backend and frontend are organized by user role/module:

- `Academy/` - Academy management features
- `Admin/` - Admin panel features
- `Teacher/` - Teacher dashboard and features
- `Student/` - Student portal features
- `Guardian/` - Parent features
- `Secretary/` - Secretary features
- `Auth/` - Authentication/authorization

### Frontend Structure

- `src/app/{role}/{feature}/page.tsx` - Next.js App Router pages
- `src/components/{category}/` - Reusable React components
- `src/services/{module}/` - API service layer (calls backend)
- `src/hooks/` - Custom React hooks
- `src/types/` - TypeScript type definitions

### API Architecture

- RESTful API with `/api` prefix
- Consistent JSON response format using `ApiResponseTrait`
- Laravel Sanctum for authentication (token-based)
- Spatie Permission for role/authorization
- API versioning support

### Real-time Features

- Laravel Reverb for WebSocket connections
- Laravel Echo + Pusher.js on frontend
- Broadcast events for real-time updates
- Horizon for queue management

## Code Standards (Non-Negotiable)

### Backend

- `declare(strict_types=1)` at top of every PHP file
- All methods must declare return types
- Arabic messages for all user-facing text
- Laravel Pint for formatting
- Write Pest tests BEFORE implementing features (TDD)

### Frontend

- TypeScript strict mode (no `any` types)
- ESLint + Prettier for formatting
- React Hooks rules strictly followed
- Error boundaries for critical components
- Arabic UI with RTL support

## Environment Setup

### Environment Files

- `.env.development` - Development configuration template
- `.env.production` - Production configuration template
- `.env` - Created from template, not committed

### Firebase Configuration

Firebase credentials are stored in:
- Development: `secrets/neetaq-54091-firebase-adminsdk-fbsvc-b830b7b75f.json`
- Production: Must use Docker Secrets or environment variable (see DOCKER.md)

**Never commit Firebase credentials to Git.**

### Key Environment Variables

Backend:
- `APP_KEY` - Laravel application key (auto-generated on install)
- `DB_*` - Database connection settings
- `REDIS_*` - Redis connection for cache/queues
- `REVERB_*` - WebSocket configuration
- `FIREBASE_PROJECT_ID` - Firebase project ID

Frontend:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_FIREBASE_*` - Firebase client config

## Important Implementation Patterns

### Authentication Flow

1. Login via role-specific endpoints (`/api/admin/login`, `/api/academy/login`, etc.)
2. Returns Sanctum token stored in cookies/localStorage
3. Token sent in `Authorization: Bearer {token}` header
4. Role-based HOCs protect frontend routes (`withAdminAuth`, `withAcademyAuth`, etc.)

### Creating a New Feature

**Backend:**
1. Create DTO in `app/DTOs/{Module}/{Feature}Data.php`
2. Create Service in `app/Services/{Module}/{Feature}Service.php`
3. Create Controller in `app/Http/Controllers/{Module}/{Feature}Controller.php`
4. Create Request validators in `app/Http/Requests/{Module}/`
5. Create Resource in `app/Http/Resources/{Module}/{Feature}Resource.php`
6. Add routes in `routes/api.php`
7. Write Pest tests first

**Frontend:**
1. Create types in `src/types/{feature}.types.ts`
2. Create service in `src/services/{module}/{feature}Service.ts`
3. Create page in `src/app/{role}/{feature}/page.tsx`
4. Create components in `src/components/{category}/`
5. Create hooks in `src/hooks/use{Feature}.ts` if needed
6. Write tests

### Common Patterns

**Pagination**: Use Laravel's `paginate()` and return with API response
**File Upload**: Use AWS S3 via `league/flysystem-aws-s3-v3`
**Notifications**: Multi-channel (Database, FCM, Voice) via NotificationService
**QR Attendance**: `html5-qrcode` library for scanning, LectureService for validation

## Key Files to Reference

- `PROJECT_OVERVIEW.md` - Full project documentation
- `.specify/memory/constitution.md` - Development standards and principles
- `structure backend.md` - Backend implementation template
- `structure frontend.md` - Frontend implementation template
- `DOCKER.md` - Docker setup and deployment guide
- `Makefile` - Quick commands for development/production

## Testing

### Backend (Pest)

```bash
cd backend
php artisan test --testsuites=Feature
php artisan test --testsuites=Unit
php artisan test --filter=TestClassName
```

### Frontend (Jest + Playwright)

```bash
cd frontend
npm run test                    # Unit tests
npm run test:e2e               # E2E tests with Playwright
```

## Quality Gates

Before committing, ensure:
- Backend: `composer pint` and `composer test` pass
- Frontend: `npm run lint` and `npm run type-check` pass
- No PHPStan errors (if configured)
- Test coverage meets thresholds (Backend: 80%, Frontend: 70%)

## Common Issues

- **Octane not reflecting changes**: Run `php artisan octane:reload` or restart container
- **Queue jobs not processing**: Ensure Horizon is running (`php artisan horizon`)
- **Frontend API calls failing**: Check `NEXT_PUBLIC_API_URL` in `.env.local`
- **Firebase notifications not working**: Verify credentials path and project ID
- **Migration conflicts**: Use `php artisan migrate:fresh` for local development
