---
title: Notification Enums
description: Enumeration types for the Notifications domain including notification types, target types, and announcement content types
---

# Notification Enums

[Back to Enums Index](./)

All enums are located in the `App\Domains\Notifications\Enums` namespace.

---

## NotificationType

Defines notification severity types.

| Case | Value | Description |
|------|-------|-------------|
| `INFO` | `info` | Informational notification |
| `WARNING` | `warning` | Warning notification |
| `SUCCESS` | `success` | Success notification |
| `DANGER` | `danger` | Critical/danger notification |

**Usage:**
```php
use App\Domains\Notifications\Enums\NotificationType;

$type = NotificationType::WARNING;
echo $type->value; // 'warning'
```

**Location:** `App\Domains\Notifications\Enums\NotificationType`

---

## NotificationTargetType

Defines notification target audience.

| Case | Value | Description |
|------|-------|-------------|
| `TEACHERS` | `teachers` | Send to teachers only |
| `SECRETARIES` | `secretaries` | Send to secretaries only |
| `ALL` | `all` | Send to all staff |

**Usage:**
```php
use App\Domains\Notifications\Enums\NotificationTargetType;

$target = NotificationTargetType::ALL;
echo $target->value; // 'all'
```

**Location:** `App\Domains\Notifications\Enums\NotificationTargetType`

---

## AnnouncementContentType

Defines content type for announcements.

| Case | Value | Label (AR) | Description |
|------|-------|------------|-------------|
| `TEXT` | `text` | نص | Plain text content |
| `IMAGE` | `image` | صورة | Image content |
| `VIDEO` | `video` | فيديو | Video content |
| `VOICE` | `voice` | صوت | Voice/audio content |
| `FILE` | `file` | ملف | File attachment |

**Methods:**
- `label(): string` - Returns Arabic label

**Usage:**
```php
use App\Domains\Notifications\Enums\AnnouncementContentType;

$type = AnnouncementContentType::IMAGE;
echo $type->value;  // 'image'
echo $type->label(); // 'صورة'
```

**Location:** `App\Domains\Notifications\Enums\AnnouncementContentType`
