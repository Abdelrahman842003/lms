---
title: HasDeviceTokens Trait
description: FCM device token management trait for the Neetaq platform
---

# HasDeviceTokens Trait

The `HasDeviceTokens` trait provides FCM (Firebase Cloud Messaging) device token management for notifiable models. It is typically applied to user-type models that receive push notifications.

## Methods

### `deviceTokens(): MorphMany`

Defines a polymorphic one-to-many relationship to the `DeviceToken` model.

```php
// On the User model
$user->deviceTokens; // Collection of DeviceToken instances

// Query builder
$user->deviceTokens()->where('type', 'android')->get();
```

**Relationship:** `morphMany(DeviceToken::class, 'tokenable')`

### `routeNotificationForFcm(): array`

Returns an array of FCM tokens for the notifiable entity. This method is automatically called by Laravel's notification system when delivering via the FCM channel.

```php
// Called internally by Laravel
$tokens = $user->routeNotificationForFcm();
// Returns: ['fcm_token_abc123', 'fcm_token_def456']
```

**Return:** `array` of token strings ready for Firebase push delivery.

### `registerDeviceToken(string $token, string $type, ?string $name = null): DeviceToken`

Registers a new device token for the user. If a token already exists for the same value, it is updated rather than duplicated.

```php
$user->registerDeviceToken(
    token: 'fcm_abc123xyz',
    type: 'android',
    name: 'Samsung Galaxy S24'
);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `$token` | `string` | FCM registration token from the client |
| `$type` | `string` | Device type: `android`, `ios`, or `web` |
| `$name` | `?string` | Optional human-readable device name |

**Behavior:**
- Uses `updateOrCreate` to prevent duplicate tokens.
- Associates the token with the user via the polymorphic relationship.

### `revokeDeviceToken(int $tokenId): bool`

Removes a device token from the user.

```php
$user->revokeDeviceToken($deviceTokenId);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `$tokenId` | `int` | Primary key of the DeviceToken to remove |

**Return:** `bool` indicating whether the token was found and deleted.

## Usage in Notifications

The trait integrates seamlessly with Laravel's notification system:

```php
use Illuminate\Notifications\Notification;

class ExamReminderNotification extends Notification
{
    public function via($notifiable): array
    {
        // routeNotificationForFcm() is called automatically
        return ['fcm', 'database'];
    }

    public function toFcm($notifiable): FcmMessage
    {
        return (new FcmMessage)
            ->notification(new Notification('Exam Reminder', 'Your exam starts in 1 hour'));
    }
}
```

## Integration with DeviceLimitService

The trait works in conjunction with the `DeviceLimitService` to enforce device limits:

```php
// In a controller
$deviceService = app(DeviceLimitService::class);

if ($deviceService->checkLimit($user)) {
    $user->registerDeviceToken($request->fcm_token, $request->device_type);
} else {
    return $this->errorResponse('Device limit reached', 403);
}
```

## Model Integration

Apply the trait to any model that should receive push notifications:

```php
use App\Traits\HasDeviceTokens;

class Student extends Model
{
    use HasDeviceTokens;
}

class Teacher extends Model
{
    use HasDeviceTokens;
}
```

## See Also

- [Device Limit Service](../services/device-limit) - Device limit enforcement
- [Authentication Services](../services/auth) - Full auth service documentation
- [Notification Services](../services/notification) - Notification dispatch
