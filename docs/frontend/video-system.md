---
title: Video System
description: Video upload, secure playback, quizzes, comments, and the full video lifecycle
---

# Video System

The video system covers uploading large video files to R2, secure token-based playback with watermarking, inline quizzes, and hierarchical comments. It spans three role-based route groups: teacher, academy, and student.

## Upload Flow

**Source:** `contexts/VideoUploadContext.tsx`

Upload is driven by a state machine with nine phases:

```
draft → initiating → uploading → retrying → paused → interrupted → completing → completed → failed
```

1. **draft** -- No upload in progress.
2. **initiating** -- Calling the API to initiate a multipart upload and receive presigned URLs for each chunk.
3. **uploading** -- Uploading chunks concurrently via `XMLHttpRequest`. Each chunk reports progress individually, which is aggregated into a single progress percentage.
4. **retrying** -- If a chunk fails, it is retried with exponential backoff before the entire upload is marked as failed.
5. **paused** -- User paused the upload; in-flight requests are interrupted.
6. **interrupted** -- Upload stopped due to refresh, disconnect, or navigation.
7. **completing** -- All chunks uploaded; calling the API to finalize the multipart upload on R2.
8. **completed** -- Upload finished successfully.
9. **failed** -- Upload failed after retries or a server-side validation error.

Key behaviors:

- **Direct-to-R2 multipart upload** -- Chunks are sent straight to R2 using presigned URLs; the backend never proxies file data.
- **Concurrent chunk uploading** -- Multiple chunks upload in parallel via XHR for throughput.
- **Exponential backoff retries** -- Failed chunks back off and retry automatically.
- **Abort support** -- In-progress XHR requests are cancelled when the user aborts or the component unmounts.
- **Real-time progress tracking** -- The hook exposes a `progress` value (0--100) derived from individual chunk `ProgressEvent` data.
- **Part success reporting** -- Each successful chunk reports `part_number` and `etag` to the API for server-side tracking.
- **Resume support** -- A pending session is stored in local storage and can be resumed after refresh by selecting the same file.

### Resume flow

- A pending session is persisted under a local storage key (`neetaq_pending_video_v2`).
- On refresh, the floating upload manager prompts the user to select the same file.
- The client calls `/videos/resume-upload/{sessionId}` and receives only missing parts.
- The server syncs uploaded parts from R2 when needed to avoid restarting from zero.

### VideoUploadForm

`VideoUploadForm` renders a multi-phase upload form that reflects the state machine. It shows a progress bar during upload, a retry button on failure, and a success confirmation on completion.

## Secure Playback

**Source:** `hooks/useVideoPlayback.ts`

Playback is protected by short-lived tokens and device binding:

1. **Playback token issuance** -- The frontend requests a playback token from the backend, scoped to the video and user.
2. **Device fingerprinting** -- A browser fingerprint is sent with the token request so the backend can bind the session to a device.
3. **Session tracking** -- The backend tracks active playback sessions to prevent credential sharing.
4. **Token refresh** -- Tokens expire and are refreshed transparently during playback.
5. **R2 signed URL exchange** -- The token is exchanged for a signed R2 URL that the video player loads.
6. **Fallback to stream endpoint** -- If signed URL exchange fails, the player falls back to a streaming proxy endpoint.

## Video Player

### SecureVideoPlayer

`SecureVideoPlayer` is the primary playback component. It:

- Loads the video via the signed URL from `useVideoPlayback`.
- Renders the `WatermarkOverlay` on top of the video.
- Tracks watch progress and periodically syncs it to the API.
- Prevents native browser download shortcuts.

### WatermarkOverlay

`WatermarkOverlay` renders a slowly-rotating translucent watermark showing the student's name and phone number. The position updates at a configurable interval to discourage screen recording.

### VideoCard

`VideoCard` is used in video listing pages. It displays a thumbnail, title, duration, and watch progress.

## Quiz System

### VideoQuizManager (Teacher / Academy)

Used by teachers and academies to manage quizzes attached to a video:

- Create quizzes with multiple-choice questions.
- Edit existing questions and choices.
- Delete quizzes.
- View student results.

### VideoQuizStudent (Student)

Used by students to take video quizzes:

- Questions are presented one at a time.
- After submission, the student sees their score and which answers were correct.
- Retries are supported if the quiz configuration allows it.

## Comments

**Source:** `VideoCommentsSection`

- Hierarchical comment tree with nested replies.
- Comments are loaded for a specific video and displayed in chronological order.
- Arabic date formatting is applied to timestamps.
- Users can post new top-level comments or reply to existing ones.

## Video Service API

**Source:** `services/videoService.ts`

The service module wraps all video-related API calls. Endpoints are namespaced by role:

| Role    | Prefix              |
| ------- | ------------------- |
| Teacher | `/teacher/videos/*` |
| Academy | `/academy/videos/*` |
| Student | `/student/videos/*` |

### Operations

| Operation          | Method   | Description                                                      |
| ------------------ | -------- | ---------------------------------------------------------------- |
| initiateUpload     | POST     | Start a multipart upload; returns presigned chunk URLs           |
| reportPartSuccess  | POST     | Record a part success (part number + ETag)                       |
| pauseUpload        | POST     | Pause an in-progress upload                                      |
| resumeUpload       | POST     | Resume an existing session and return missing parts              |
| completeUpload     | POST     | Finalize a multipart upload after all chunks are sent            |
| abortUpload        | DELETE   | Cancel an in-progress multipart upload                           |
| listVideos         | GET      | List videos with pagination and filters                          |
| getWatchProgress   | GET      | Retrieve the current student's watch progress for a video        |
| updateProgress     | POST     | Save the student's watch position                                |
| issuePlaybackToken | POST     | Request a short-lived playback token with device fingerprint     |
| quiz CRUD          | GET/POST | Create, read, update, delete quizzes and fetch results           |
| comments           | GET/POST | List comments and post new comments or replies                   |
| attachments        | GET/POST | List and upload file attachments associated with a video         |

## Video Types

**Source:** `types/video.types.ts`

| Type / Enum                | Purpose                                                          |
| -------------------------- | ---------------------------------------------------------------- |
| `VideoStatus`              | Enum representing the lifecycle state of a video (uploading, processing, ready, failed, etc.) |
| `VideoItem`                | Shape for a video record as returned by the API                  |
| `VideoQuiz`                | Quiz attached to a video, including questions and choices        |
| `VideoWatchProgress`       | Student's watch position and completion percentage               |
| `PlaybackTokenPayload`     | Data sent when requesting a playback token (video ID, fingerprint) |
| `InitiateUploadPayload`    | Data sent to start an upload (file name, size, content type)     |
| `InitiateUploadResponse`   | Session ID, chunk size, and presigned/missing parts              |
| `CompleteUploadResponse`   | Confirmation and final video metadata after upload completion    |
| `VideoComment`             | A single comment or reply, including author info and timestamps  |

## Routes

### Teacher

| Path                      | Page                      |
| ------------------------- | ------------------------- |
| `/teacher/videos`         | Video listing             |
| `/teacher/videos/create`  | Upload a new video        |
| `/teacher/videos/[id]`    | Video detail and manage   |

### Student

| Path                      | Page                      |
| ------------------------- | ------------------------- |
| `/student/videos`         | Video listing             |
| `/student/videos/[id]`    | Watch video and take quiz |

### Academy

| Path                      | Page                      |
| ------------------------- | ------------------------- |
| `/academy/videos`         | Video listing             |
| `/academy/videos/create`  | Upload a new video        |
| `/academy/videos/[id]`    | Video detail and manage   |
