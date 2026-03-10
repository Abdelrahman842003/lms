# Changelog

All notable changes to the Laravel Backend LMS project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project structure with Domain-Driven Design architecture
- Authentication system for multiple user types (Admin, Academy, Teacher, Student, Guardian, Secretary)
- Enrollment management system
- Exam creation and attempt system
- Gamification features (points, streaks, leaderboards)
- Lecture management and attendance tracking
- Video management system with access control
- Notification system with multiple channels (Database, FCM)
- Report generation (PDF, Excel)
- Subscription management for teachers and academies
- Media storage with Cloudflare R2 support
- Comprehensive caching strategy with Redis
- Performance indexes for all major tables
- Background job processing with Laravel Horizon
- API response standardization with ApiResponseTrait
- OTP-based authentication flow
- Device token management
- Login attempt tracking and rate limiting
- Student activity logging
- Teacher attendance logging
- Payment logging system
- Video quiz feature
- Video upload session management
- Video access grants and playback tokens
- Video watch progress tracking
- Video comments and likes
- Video reminders
- Voice notification limits
- Firebase integration for push notifications
- Laravel Telescope for monitoring
- Health check endpoints
- Docker support for development and production

### Changed
- Migrated to Domain-Driven Design architecture
- Improved API response consistency
- Enhanced caching strategy with tagged cache
- Optimized database queries with proper indexes

### Security
- Implemented Laravel Sanctum for API authentication
- Added rate limiting for OTP requests
- Added login attempt throttling
- Implemented device limit enforcement
- Added suspension status caching
- Added video playback token security

## [1.0.0] - 2026-03-10

### Added
- Complete LMS backend implementation
- Multi-tenant architecture (Academies)
- Role-based access control
- Comprehensive API documentation
- Performance optimization
- Caching layer
- Background job processing

## Version History

### 2026-03
- **2026-03-09**: Added video quiz feature
- **2026-03-07**: Added video upload session management
- **2026-03-06**: Added trial period days for teachers and academies
- **2026-03-03**: Added activity log event and batch UUID columns
- **2026-03-03**: Added health check tables

### 2026-02
- **2026-02-23**: Added subscription fields to academies table
- **2026-02-22**: Added teacher subscriptions table
- **2026-02-13**: Added subscription fields to teachers table
- **2026-02-13**: Added subscriptions table
- **2026-02-07**: Added performance indexes migration

### 2026-01
- **2026-01-08**: Added teacher attendance logs table
- **2026-01-08**: Added academy secretary table
- **2026-01-08**: Added academy teacher table
- **2026-01-06**: Added lecture sessions table
- **2026-01-05**: Added parent device tokens table
- **2026-01-05**: Added daily voice limits table
- **2026-01-05**: Added voice columns to sent notifications

### 2025-12
- **2025-12-31**: Added login attempts table
- **2025-12-29**: Added device tokens table
- **2025-12-26**: Added secretary teacher table
- **2025-12-18**: Added sync errors table
- **2025-12-18**: Added payment logs table
- **2025-12-17**: Added student failed questions table
- **2025-12-17**: Added gamification settings table
- **2025-12-17**: Added student points table
- **2025-12-17**: Added point transactions table
- **2025-12-16**: Added settings table
- **2025-12-13**: Added student answers table
- **2025-12-12**: Added student activity logs table
- **2025-12-12**: Added enrollments table
- **2025-12-10**: Added base tables (admins, academies, teachers, students, secretaries, guardians, grades, groups, lectures, exams, exam attempts, exam results, questions, attendances, notifications, sent notifications, sessions, cache, jobs, failed jobs, batches, permission tables, personal access tokens, telescope entries)

## Categories

### Authentication & Authorization
- Multi-user authentication (Admin, Academy, Teacher, Student, Guardian, Secretary)
- OTP-based login flow
- Device token management
- Login attempt tracking
- Rate limiting
- Role-based permissions
- Suspension status checking

### Core Features
- Student enrollment
- Grade and group management
- Lecture scheduling
- Attendance tracking
- Exam creation and management
- Exam attempts and results
- Question management

### Gamification
- Points system
- Point transactions
- XP calculation strategies
- Streak tracking
- Leaderboards (weekly and all-time)
- Gamification settings

### Videos
- Video upload and management
- Video access control
- Video playback tokens
- Video watch progress
- Video comments and likes
- Video attachments
- Video quizzes
- Video reminders
- Video upload sessions

### Notifications
- Database notifications
- FCM push notifications
- Voice notifications
- Bulk notifications
- Notification channels
- Notification settings
- Academy notifications

### Reports
- PDF report generation
- Excel report generation
- Academy reports
- Teacher reports
- Admin reports

### Subscriptions
- Teacher subscriptions
- Academy subscriptions
- Payment tracking
- Seat management
- Plan validation

### Media
- Cloudflare R2 storage
- Local storage adapter
- Media upload processing
- Avatar management
- Image processing

### Performance
- Database indexes
- Query optimization
- Caching strategy
- Background jobs
- Job queues

### Security
- Rate limiting
- Login throttling
- Device limits
- Suspension checks
- Token management
- Access control

## Migration Notes

### Database Migrations
All migrations are located in `backend/database/migrations/`. Run migrations in order:

```bash
php artisan migrate
```

### Cache Clearing
After deployment, clear the cache:

```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Horizon Restart
Restart Horizon workers:

```bash
php artisan horizon:terminate
```

## Breaking Changes

### Version 1.0.0
- Initial release - no breaking changes

## Upgrade Guide

### From Previous Version
1. Run database migrations: `php artisan migrate`
2. Clear cache: `php artisan cache:clear`
3. Restart Horizon: `php artisan horizon:terminate`
4. Update environment variables if needed

## Deprecations

None currently deprecated.

## Removed Features

None currently removed.

## Security Updates

### 2026-03-10
- Enhanced video playback token security
- Improved rate limiting for OTP requests
- Added device limit enforcement

### 2025-12-29
- Added login attempt tracking
- Implemented rate limiting for login attempts

## Contributors

- Development Team

## License

This project is proprietary. All rights reserved.

## Links

- [Architecture](ARCHITECTURE.md)
- [API Conventions](API_CONVENTIONS.md)
- [Caching Strategy](CACHING_STRATEGY.md)
- [Performance](PERFORMANCE.md)
