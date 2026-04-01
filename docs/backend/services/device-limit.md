---
title: Device Limit Service
description: Multi-device limit enforcement for the Neetaq platform
---

# Device Limit Service

The `DeviceLimitService` enforces concurrent session limits per user, ensuring that each account can only be active on a configured number of devices.

## Configuration

Maximum devices are defined per user type:

```php
// config/auth.php
'device_limits' => [
    'student'  => 2,
    'teacher'  => 3,
    'academy'  => 5,
    'secretary' => 3,
    'admin'    => 10,
],
```

## Methods

### `checkLimit($user): bool`

Determines whether the user can register an additional device.

```php
use App\Domains\Auth\Services\DeviceLimitService;

$deviceService = app(DeviceLimitService::class);

if ($deviceService->checkLimit($user)) {
    // User can register another device
}
```

**Logic:**
1. Resolve the user type (student, teacher, academy, etc.).
2. Look up the configured limit for that type.
3. Count the user's currently active device tokens.
4. Return `true` if under the limit, `false` otherwise.

### `registerDevice($user, string $token, string $type): DeviceToken`

Registers a new device token for the user.

```php
$deviceToken = $deviceService->registerDevice($user, $fcmToken, 'android');
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `$user` | `Model` | The authenticated user |
| `$token` | `string` | FCM registration token |
| `$type` | `string` | Device type (e.g., `android`, `ios`, `web`) |

**Behavior:**
- Creates a `DeviceToken` record linked to the user via polymorphic relationship.
- Stores the FCM token for push notification delivery.

### `revokeDevice(int $tokenId): void`

Removes a device token, freeing a slot for the user.

```php
$deviceService->revokeDevice($tokenId);
```

**Behavior:**
- Deletes the `DeviceToken` record.
- The user can now register a new device.

## Device Tracking via DeviceToken Model

Device tokens are stored using the `DeviceToken` model with a polymorphic `morphMany` relationship:

```php
// On the User model (via HasDeviceTokens trait)
public function deviceTokens(): MorphMany
{
    return $this->morphMany(DeviceToken::class, 'tokenable');
}
```

**DeviceToken Schema:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | `bigint` | Primary key |
| `tokenable_type` | `string` | Polymorphic model class |
| `tokenable_id` | `bigint` | Polymorphic model ID |
| `token` | `string` | FCM registration token |
| `type` | `string` | Device type (android, ios, web) |
| `name` | `string` | Optional device name |
| `created_at` | `timestamp` | Registration timestamp |

## FCM Token Management

FCM tokens are used for push notification delivery. The service ensures:

- Tokens are unique per device per user.
- Revoking a token immediately stops notifications to that device.
- Tokens are refreshed when the client receives a new one from Firebase.

```php
// Typical lifecycle
$deviceService->registerDevice($user, $newFcmToken, 'ios');
// ... later, when user logs out or removes device
$deviceService->revokeDevice($deviceTokenId);
```

## Error Handling

When the device limit is exceeded, the service returns a structured error:

```json
{
    "success": false,
    "message": "Device limit reached. Please revoke an existing device.",
    "data": {
        "max_devices": 2,
        "current_devices": 2
    }
}
```

## See Also

- [Authentication Services](./auth) - Full auth service documentation
- [HasDeviceTokens Trait](../traits/has-device-tokens) - Device token model trait
