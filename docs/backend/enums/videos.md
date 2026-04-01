---
title: Video Enums
description: Enumeration types for the Videos domain including video status, processing status, upload session status, owner types, and watch status
---

# Video Enums

[Back to Enums Index](./)

All enums are located in the `App\Domains\Videos\Enums` namespace.

---

## VideoStatus

Defines the lifecycle status of a video.

| Case | Value | Description |
|------|-------|-------------|
| `DRAFT` | `draft` | Video is being prepared |
| `UPLOADING` | `uploading` | Video is being uploaded |
| `UPLOADED` | `uploaded` | Upload complete |
| `PROCESSING` | `processing` | Video is being processed |
| `READY` | `ready` | Video is ready for review |
| `SCHEDULED` | `scheduled` | Video scheduled for publication |
| `PUBLISHED` | `published` | Video is live |
| `FAILED` | `failed` | Processing failed |
| `DELETED` | `deleted` | Video deleted |

**Methods:**
- `isAccessible(): bool` - Returns true only if video is published

**Usage:**
```php
use App\Domains\Videos\Enums\VideoStatus;

$status = VideoStatus::PUBLISHED;
echo $status->value;        // 'published'
echo $status->isAccessible(); // true
```

**Location:** `App\Domains\Videos\Enums\VideoStatus`

---

## VideoProcessingStatus

Defines video processing status.

| Case | Value | Description |
|------|-------|-------------|
| `PENDING` | `pending` | Processing queued |
| `RUNNING` | `running` | Processing in progress |
| `SUCCEEDED` | `succeeded` | Processing completed |
| `FAILED` | `failed` | Processing failed |

**Usage:**
```php
use App\Domains\Videos\Enums\VideoProcessingStatus;

$status = VideoProcessingStatus::SUCCEEDED;
echo $status->value; // 'succeeded'
```

**Location:** `App\Domains\Videos\Enums\VideoProcessingStatus`

---

## VideoUploadSessionStatus

Defines multipart upload session status.

| Case | Value | Description |
|------|-------|-------------|
| `PENDING_UPLOAD` | `pending_upload` | Session created, awaiting parts |
| `UPLOADING` | `uploading` | Parts being uploaded |
| `COMPLETING` | `completing` | Finalizing upload |
| `COMPLETED` | `completed` | Upload complete |
| `ABORTED` | `aborted` | Upload aborted |
| `FAILED` | `failed` | Upload failed |

**Methods:**
- `isTerminal(): bool` - Returns true if session is in a terminal state

**Usage:**
```php
use App\Domains\Videos\Enums\VideoUploadSessionStatus;

$status = VideoUploadSessionStatus::COMPLETED;
echo $status->value;     // 'completed'
echo $status->isTerminal(); // true
```

**Location:** `App\Domains\Videos\Enums\VideoUploadSessionStatus`

---

## VideoOwnerType

Defines who owns a video.

| Case | Value | Description |
|------|-------|-------------|
| `INDEPENDENT_TEACHER` | `independent_teacher` | Independent teacher's video |
| `ACADEMY` | `academy` | Academy's video |

**Usage:**
```php
use App\Domains\Videos\Enums\VideoOwnerType;

$owner = VideoOwnerType::ACADEMY;
echo $owner->value; // 'academy'
```

**Location:** `App\Domains\Videos\Enums\VideoOwnerType`

---

## VideoWatchStatus

Defines student's video watch progress.

| Case | Value | Description |
|------|-------|-------------|
| `NOT_STARTED` | `not_started` | Student hasn't started watching |
| `STARTED` | `started` | Student started watching |
| `IN_PROGRESS` | `in_progress` | Student is watching |
| `WATCHED_PENDING_QUIZ` | `watched_pending_quiz` | Watched completely, quiz pending |
| `COMPLETED` | `completed` | Watched and quiz passed (or no quiz) |

**Usage:**
```php
use App\Domains\Videos\Enums\VideoWatchStatus;

$status = VideoWatchStatus::COMPLETED;
echo $status->value; // 'completed'
```

**Location:** `App\Domains\Videos\Enums\VideoWatchStatus`
