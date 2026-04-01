---
title: Services Reference
description: Overview of all domain services in the Neetaq backend
---

# Services Reference

Domain services encapsulate business logic and coordinate between models, repositories, and external services.

## Service Inventory

| Service | Domain | Purpose |
|---------|--------|---------|
| AuthService | Auth | Authentication logic, token management |
| DeviceLimitService | Auth | Multi-device limit enforcement |
| LoginAttemptService | Auth | Login throttling and attempt tracking |
| EnrollmentService | Enrollments | Enrollment lifecycle management |
| ExamService | Exams | Exam validation and processing |
| NotificationService | Notifications | Multi-channel notification dispatch |
| BulkNotificationService | Notifications | Bulk notification processing |
| NotificationSettingsService | Notifications | Notification preference management |
| VoiceNotificationService | Notifications | Voice call notifications |
| CacheService | Application | Centralized caching with tags and TTL |
| ImageService | Media | Image processing and storage |
| AvatarService | Media | Avatar upload and management |
| StudyMaterialService | Application | Study material management |

## Service Patterns

### Dependency Injection
All services are resolved through Laravel's service container:

```php
// Constructor injection
public function __construct(
    private NotificationService $notificationService,
) {}

// App container
$service = app(NotificationService::class);
```

## Next Steps

- [AuthService](./auth) - Authentication services
- [DeviceLimitService](./device-limit) - Device limit enforcement
- [NotificationService](./notification) - Notification services
- [CacheService](./cache) - Caching service
