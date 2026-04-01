---
title: Notifications & Real-Time System
description: Laravel Echo (Reverb), Firebase Cloud Messaging, notification hooks, services, and UI components for the real-time notification pipeline.
outline: deep
---

# Notifications & Real-Time System

The platform delivers notifications through two parallel channels: **Laravel Echo over Reverb** (WebSocket) for instant in-app delivery, and **Firebase Cloud Messaging** (FCM) for browser push notifications. A unified React hook merges both channels with deduplication and sound alerts.

## Architecture Overview

```
                          +-----------------------+
                          |  Laravel Broadcasting  |
                          |  (Reverb / WebSocket)  |
                          +-----------+-----------+
                                      |
                                      v
+-----------+    initializeEcho   +----+-----+    private channel    +------------------+
| echo.ts   |<-------------------| useNotif- |---------------------->| App.Models.User.{id}
| (module)  |                    | ications  |                      +------------------+
+-----------+                    +-----+----+
                                       |
                                       | onMessageListener
                                       v
                                +-------+--------+
                                | firebase.ts    |
                                | (FCM foreground)|
                                +----------------+

                                       |
                                       v
                          +------------------------+
                          | NotificationContext    |
                          | (React Context)        |
                          +-----------+------------+
                                      |
                    +-----------------+-----------------+
                    |                 |                 |
               Dropdown          Modal(s)          Sound + Toast
```

## Laravel Echo -- `lib/echo.ts`

**File:** `frontend/src/lib/echo.ts`

Manages a singleton `Echo<"reverb">` instance connected to the Laravel Reverb WebSocket server.

### Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_REVERB_APP_KEY` | `y2vqna5uho5zsdz6kdyz` | Reverb application key |
| `NEXT_PUBLIC_REVERB_HOST` | `window.location.hostname` | WebSocket host |
| `NEXT_PUBLIC_REVERB_PORT` | `8080` | WebSocket port (ws and wss) |
| `NEXT_PUBLIC_REVERB_SCHEME` | -- | Set to `https` to enable TLS |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | API base URL (trailing `/api` stripped) |

### Exports

| Function | Signature | Description |
|----------|-----------|-------------|
| `initializeEcho` | `(token: string) => Echo<"reverb">` | Creates or reuses the Echo instance. If the token has changed since the last call, the previous connection is disconnected first. Sets `window.Pusher` and `window.Echo` globals. |
| `getEcho` | `() => Echo<"reverb"> \| null` | Returns the current instance without initializing. |
| `disconnectEcho` | `() => void` | Disconnects and clears the instance and stored token. |

### Instance Reuse

The module tracks the last-used bearer token in module-level state. Calling `initializeEcho` with the **same** token returns the existing instance immediately. When the token changes, the old connection is disconnected before creating a new one.

### Authentication

Private channels are authenticated via:

```
POST {baseUrl}/api/v1/broadcasting/auth
Authorization: Bearer {token}
Accept: application/json
```

## Firebase Cloud Messaging -- `lib/firebase.ts`

**File:** `frontend/src/lib/firebase.ts`

Provides FCM token management and foreground message listening. Firebase is initialized lazily (not on import) via `initializeFirebase(config)`.

### Exports

| Function | Signature | Description |
|----------|-----------|-------------|
| `initializeFirebase` | `(config: any) => void` | Initializes the Firebase app and messaging instance. Skips if already initialized. Stores the VAPID key from `config.vapidKey` or `NEXT_PUBLIC_FIREBASE_VAPID_KEY`. |
| `requestForToken` / `getFcmToken` | `() => Promise<string \| null>` | Registers `/firebase-messaging-sw.js` service worker and returns the current FCM registration token. |
| `onMessageListener` | `() => Promise` | Returns a promise that resolves with the next foreground message payload. Callers chain recursively for continuous listening. |
| `deleteFcmToken` | `() => Promise<boolean>` | Deletes the current FCM token from the device. Returns `true` on success. |

### Service Worker

The file `/public/firebase-messaging-sw.js` is registered with cache-busting (`?v=1.0`) to ensure updates propagate.

## useNotifications Hook -- `hooks/useNotifications.ts`

**File:** `frontend/src/hooks/useNotifications.ts`

Unified hook that merges Echo (WebSocket) and FCM (push) channels into a single notification stream with deduplication and sound feedback.

### Options

```ts
interface UseNotificationsOptions {
  userId: string;
  userType: 'student' | 'teacher';
  token: string;
  onNotification?: (notification: Notification) => void;
  enableSound?: boolean; // default true
}
```

### Return Value

```ts
{
  notifications: Notification[];
  isConnected: boolean;
  clearNotification: (id: string) => void;
  clearAll: () => void;
  unreadCount: number;
}
```

### Notification Interface

```ts
interface Notification {
  notification_id: string;
  title: string;
  message: string;
  type: string;
  data?: Record<string, unknown>;
  created_at: string;
}
```

### Deduplication

- Notification IDs are stored in a `Map<string, number>` (id -> timestamp) backed by `sessionStorage`.
- **TTL:** 5 minutes (`NOTIFICATION_TTL = 5 * 60 * 1000`). Expired entries are cleaned on access.
- **Cap:** When more than 100 entries accumulate, the oldest are pruned after sorting by timestamp descending.

### Sound

An `HTMLAudioElement` for `/sounds/notification.mp3` is created once. Playback is attempted (and silently caught) on each new notification if `enableSound` is true.

### Echo Channel

Subscribes to private channel `App.Models.User.{userId}` and listens for `.Illuminate\Notifications\Events\BroadcastNotificationCreated`. The backend event data is mapped to the frontend `Notification` interface.

### FCM Listener

Calls `onMessageListener()` recursively in a promise chain. On error, retries after 5 seconds. Maps the FCM payload structure (`payload.notification.title/body` and `payload.data`) to the `Notification` interface.

## NotificationContext -- `contexts/NotificationContext.tsx`

**File:** `frontend/src/contexts/NotificationContext.tsx`

Thin React Context provider that wraps `useNotifications`.

### Provider

```tsx
<NotificationProvider
  userId={string}
  userType={'student' | 'teacher'}
  token={string}
  onNotification?: (notification) => void}
>
  {children}
</NotificationProvider>
```

### Consumer Hook

```ts
const { notifications, isConnected, clearNotification, clearAll, unreadCount } =
  useNotificationContext(); // throws if used outside provider
```

## Notification Service -- `services/notificationService.ts`

**File:** `frontend/src/services/notificationService.ts`

API layer for sending, receiving, and managing notifications.

### Dynamic Endpoint Resolution

The base notification endpoint is determined by `localStorage.getItem('userType')`:

| userType | Endpoint |
|----------|----------|
| `student` | `/api/v1/student/notifications` |
| `parent` | `/api/v1/parent/notifications` |
| `secretary` | `/api/v1/secretary/notifications` |
| default (teacher) | `/api/v1/teacher/notifications` |

### Recipient Types

Used in `SendNotificationData.recipient_type` and `SendVoiceNotificationData.recipient_type`:

| Value | Description |
|-------|-------------|
| `all` | All students |
| `grade` | Students in a specific grade (requires `grade_id`) |
| `group` | Students in a specific group (requires `group_id`) |
| `admin` | Support / developer |
| `all_users` | All users |
| `all_teachers` | All teachers |
| `all_students` | All students |
| `all_secretaries` | All secretaries |

### Interfaces

```ts
interface Notification {
  id: number;
  title: string;
  message: string;
  recipient_type: RecipientType;
  recipient_count: number;
  created_at: string;
  is_voice?: boolean;
  voice_path?: string;
  voice_url?: string;
  voice_duration?: number;
}

interface ReceivedNotification {
  id: string;
  type: string;
  data: {
    title?: string;
    message?: string;
    is_voice?: boolean;
    voice_url?: string;
    voice_duration?: number;
    [key: string]: string | boolean | number | undefined;
  };
  voice_url?: string;
  read_at: string | null;
  created_at: string;
}

interface SendNotificationData {
  title: string;
  message: string;
  recipient_type: RecipientType;
  grade_id?: number;
  group_id?: number;
}

interface SendVoiceNotificationData {
  title: string;
  voice: Blob;       // webm audio blob
  duration: number;  // seconds
  recipient_type: RecipientType;
  grade_id?: number;
  group_id?: number;
}

interface VoiceLimitResponse {
  can_send_voice: boolean;
  max_duration: number;
}
```

### API Functions

| Function | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| `getNotifications` | GET | `{base}` | Returns `{ notifications, received_notifications }`. |
| `sendNotification` | POST | `{base}` | Sends a text notification as JSON. |
| `sendVoiceNotification` | POST | `{base}/voice` | Sends a voice notification as `FormData` (`multipart/form-data`). Uses raw `fetch` to handle file upload. |
| `checkVoiceLimit` | GET | `{base}/voice-limit` | Returns `{ can_send_voice, max_duration }`. Falls back to `{ can_send_voice: true, max_duration: 40 }` on 404. |
| `storeDeviceToken` | POST | `/device-tokens` | Registers an FCM token with the backend. Body: `{ token, device_type: 'web' }`. |

### Voice Duration Limits

The `checkVoiceLimit` endpoint enforces daily voice notification quotas. The default maximum duration is 40 seconds, with a fallback of 90 seconds when the backend endpoint is unavailable. Once a voice notification is sent, `can_send_voice` becomes `false` until the next reset period.

## Notification Components

### NotificationDropdown

**File:** `frontend/src/components/dashboard/NotificationDropdown.tsx`

Header bell-icon dropdown displaying the latest notifications with unread count badge.

**Props:** `{ role: string }`

Key behaviors:
- Fetches notifications from `/v1/{role}/notifications` on mount.
- Subscribes to a Reverb private channel `notifications.{role}.{userId}` and listens for `.new.notification`.
- Falls back to FCM via `window.addEventListener('notification:received', ...)`.
- Performs client-side deduplication using a `Set<string>` of received IDs (cleaned after 5 minutes).
- Dispatches a `CustomEvent('notification:reverb:received')` for sibling components (e.g., `NotificationsSection`).
- Plays `/sounds/notification.mp3` on new notifications (skipped on initial load).
- Shows native `Notification` API when permission is granted; falls back to `react-hot-toast`.
- Supports mark-as-read via `POST /v1/{role}/notifications/{id}/read`.
- Animated open/close with click-outside dismiss.

### NotificationModal

**File:** `frontend/src/components/ui/NotificationModal.tsx`

Reusable form modal for composing and sending text notifications.

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | `boolean` | Controls visibility |
| `onClose` | `() => void` | Close handler |
| `onSubmit` | `(e: FormEvent) => void` | Form submission handler |
| `title` | `string` | Modal heading |
| `formData` | `{ title, message, recipient_type, grade_id?, group_id? }` | Form state |
| `setFormData` | `(data) => void` | State setter |
| `isLoading` | `boolean` | Disables submit while sending |
| `isDeveloperMode` | `boolean` | Hides recipient selection when messaging admin |
| `grades` | `Array<{id, name}>` | Grade options for grade-type recipients |
| `groups` | `Array<{id, name}>` | Group options for group-type recipients |

In developer mode (`isDeveloperMode = true`), the recipient type selector is hidden and the message is sent directly to admin.

### NotificationDetailsModal

**File:** `frontend/src/components/ui/NotificationDetailsModal.tsx`

Read-only modal showing full notification details including voice playback.

**Props:** `{ isOpen, onClose, notification }` where `notification` contains `title`, `message`, `created_at`, `sender_name`, `recipient_type`, and optional voice fields.

Key behaviors:
- Detects voice notifications from `is_voice` flag, `voice_url` presence, or `[رسالة صوتية]` in the message text.
- Constructs voice URLs from `voice_path` when `voice_url` is absent (handles R2/S3 URLs, local storage paths).
- Embeds `VoicePlayer` for voice messages.
- Expandable message body for long text (>100 characters).

### NotificationPermissionModal

**File:** `frontend/src/components/dashboard/NotificationPermissionModal.tsx`

Prompts the user to enable browser notifications.

Key behaviors:
- Only shown when `Notification.permission === 'default'` (not yet decided).
- After dismissal, sets a 24-hour cooldown in `localStorage` (`notification_prompt_cooldown`).
- On grant, calls `enableNotifications()` from `EnhancedAuthContext`, plays a confirmation sound, and shows a test notification.
- Re-checks permission on window focus events.

### NotificationsSection

**File:** `frontend/src/components/dashboard/NotificationsSection.tsx`

Dashboard card widget used primarily in the parent dashboard to display received notifications and allow contacting support.

Key behaviors:
- Fetches from `/parent/notifications`.
- Listens for `notification:reverb:received` custom events from `NotificationDropdown`.
- Supports mark-as-read via `POST /parent/notifications/{id}/read`.
- Includes a "Contact Support" button that opens a modal to send a message to admin.
- Displays voice notification indicators and opens `NotificationDetailsModal` on click.

### NotificationSettings

**File:** `frontend/src/components/NotificationSettings.tsx`

Browser notification permission settings panel.

Displays the current `Notification.permission` state (`default`, `granted`, or `denied`) with a button to request permission when in the `default` state. Uses `enableNotifications()` from the auth context.

### VoiceRecorder

**File:** `frontend/src/components/notifications/VoiceRecorder.tsx`

Full-featured audio recording component with real-time waveform visualization.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `maxDuration` | `number` | `90` | Maximum recording duration in seconds |
| `onRecordingComplete` | `(blob: Blob, duration: number) => void` | required | Called with recorded audio |
| `onCancel` | `() => void` | -- | Optional cancel callback |
| `disabled` | `boolean` | `false` | Disables the start button |

States: `idle` -> `recording` -> `preview`

Key behaviors:
- Requests microphone access with echo cancellation, noise suppression, and auto gain control.
- Uses `MediaRecorder` API with codec preference: `audio/webm;codecs=opus` > `audio/ogg;codecs=opus` > `audio/webm` > `audio/ogg` > `audio/mp4`.
- Analyzes audio via `AudioContext` + `AnalyserNode` for 5-bar waveform visualization with smooth interpolation.
- Auto-stops at `maxDuration`.
- Preview state allows playback of the recording before confirming or re-recording.
- Visual progress bar turns red when within 10 seconds of the limit.

### VoicePlayer

**File:** `frontend/src/components/notifications/VoicePlayer.tsx`

Audio playback component with waveform visualization and seek support.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `voiceUrl` | `string` | required | Audio source URL or path |
| `duration` | `number` | -- | Pre-known duration hint |
| `compact` | `boolean` | `false` | Compact mode for inline display |

Key behaviors:
- Normalizes URLs through a media proxy: R2/S3 URLs are proxied via `{apiUrl}/media/{path}`, local storage paths are prefixed accordingly.
- 40-bar waveform visualization with progress highlighting.
- Click-to-seek on the waveform area.
- Automatic retry (up to 3 attempts with 200ms delay) on load failure.
- Displays `LoadingSpinner` while buffering.

## Routes

### Teacher Routes

| Path | File | Description |
|------|------|-------------|
| `/teacher/notifications` | `frontend/src/app/teacher/notifications/page.tsx` | Main notifications page with three filter tabs: students, sent-to-developer, from-developer. Supports both text and voice notifications. Includes `StatCard` totals, `DataTable` with sortable/searchable columns, and `NotificationDetailsModal` on row click. |
| `/teacher/notifications/students` | `frontend/src/app/teacher/notifications/students/page.tsx` | Dedicated page for student-targeted notifications. Recipient types: all, grade, group. Includes grade/group selection dropdowns. |
| `/teacher/notifications/developer` | `frontend/src/app/teacher/notifications/developer/page.tsx` | Dedicated page for developer/support messages. Always sends with `recipient_type: 'admin'`. Simpler form (no recipient selector). |

### Student Route

| Path | File | Description |
|------|------|-------------|
| `/student/notifications` | `frontend/src/app/student/notifications/page.tsx` | Student notification inbox. Two filter tabs: received (from teacher/admin) and sent-to-developer (support tickets). Students can only send to `recipient_type: 'admin'`. Responsive layout with mobile card view and desktop `DataTable`. |

### Academy Route

| Path | File | Description |
|------|------|-------------|
| `/academy/notifications` | `frontend/src/app/academy/notifications/page.tsx` | Academy notification management. Target types: teachers, secretaries, all. Supports specific recipient selection with search. Displays recipient snapshot modal showing who received each notification. Uses `academyService` for API calls. |

## Notification Data Flow

```
1. Teacher sends notification via NotificationModal / VoiceRecorder
       |
       v
2. notificationService.sendNotification() / sendVoiceNotification()
       |
       v
3. Backend stores notification and broadcasts via Reverb
       |
       +---> Reverb WebSocket push to App.Models.User.{id}
       |         |
       |         v
       |     useNotifications hook (Echo listener)
       |
       +---> FCM push to registered device tokens
                 |
                 v
             useNotifications hook (FCM listener)
                 |
                 v
4. NotificationDropdown / NotificationsSection receives and displays
       |
       v
5. User sees toast + hears sound + sees native notification
```

## Permission Flow

```
NotificationPermissionModal shown
       |
       v
User clicks "Enable Notifications"
       |
       v
Browser permission prompt
       |
       +---> Granted --> enableNotifications() --> register FCM token --> done
       |
       +---> Dismissed --> 24h cooldown in localStorage --> modal hidden
```
