---
title: Cache Service
description: Centralized caching with tags and TTL for the Neetaq platform
---

# Cache Service

The `CacheService` provides a centralized interface for caching operations with support for tag-based invalidation and configurable TTL.

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `get` | `get(string $key): mixed` | Retrieves a cached value by key |
| `put` | `put(string $key, mixed $value, ?int $ttl = null): bool` | Stores a value in cache with optional TTL |
| `forget` | `forget(string $key): bool` | Removes a specific key from cache |
| `forgetByTag` | `forgetByTag(string $tag): bool` | Removes all keys associated with a tag |
| `flush` | `flush(): bool` | Clears the entire cache |

## Usage

### Basic Caching

```php
use App\Services\CacheService;

$cacheService = app(CacheService::class);

// Store a value
$cacheService->put('user_stats_123', $stats, 3600);

// Retrieve a value
$stats = $cacheService->get('user_stats_123');

// Remove a value
$cacheService->forget('user_stats_123');
```

### Tag-Based Invalidation

Tags allow grouping related cache entries so they can be invalidated together:

```php
// Store with tags (via underlying Redis implementation)
Cache::tags(['academy_1', 'students'])->put('student_list_1', $students, 1800);

// Invalidate all cache entries for an academy
$cacheService->forgetByTag('academy_1');
```

This is particularly useful when a resource changes and all related cached data must be refreshed:

```php
// When a student's enrollment changes
$cacheService->forgetByTag('academy_' . $academyId);
$cacheService->forgetByTag('student_' . $studentId);
```

## TTL Configuration

Default TTL values are configured per context:

```php
// config/cache.php
'ttl' => [
    'default'    => 3600,   // 1 hour
    'user_stats' => 1800,   // 30 minutes
    'lists'      => 900,    // 15 minutes
    'reports'    => 7200,   // 2 hours
],
```

When no TTL is provided to `put()`, the `default` value is used.

## Redis Backend

The cache service uses Redis as its backend driver. Ensure the Redis connection is properly configured:

```php
// config/database.php
'redis' => [
    'client' => env('REDIS_CLIENT', 'phpredis'),
    'default' => [
        'host'     => env('REDIS_HOST', '127.0.0.1'),
        'password' => env('REDIS_PASSWORD', null),
        'port'     => env('REDIS_PORT', 6379),
        'database' => env('REDIS_DB', 0),
    ],
    'cache' => [
        'host'     => env('REDIS_HOST', '127.0.0.1'),
        'password' => env('REDIS_PASSWORD', null),
        'port'     => env('REDIS_PORT', 6379),
        'database' => env('REDIS_CACHE_DB', 1),
    ],
],
```

```php
// config/cache.php
'default' => env('CACHE_STORE', 'redis'),
'stores' => [
    'redis' => [
        'driver'     => 'redis',
        'connection' => 'cache',
        'lock_connection' => 'default',
    ],
],
```

### Cache Key Conventions

Follow these naming conventions for cache keys:

| Pattern | Example | Description |
|---------|---------|-------------|
| `{entity}_{id}` | `student_42` | Single entity cache |
| `{entity}_list_{filters}` | `student_list_academy_1` | Filtered list cache |
| `{entity}_stats_{id}` | `academy_stats_1` | Aggregated statistics |
| `{entity}_count_{id}` | `enrollment_count_5` | Count queries |

## Common Patterns

### Cache-Aside with Fallback

```php
public function getStudentStats(int $academyId): array
{
    $key = "academy_stats_{$academyId}";

    return $cacheService->get($key) ?? $this->computeAndCacheStats($academyId);
}

private function computeAndCacheStats(int $academyId): array
{
    $stats = $this->computeStats($academyId);
    $cacheService->put("academy_stats_{$academyId}", $stats, 7200);

    return $stats;
}
```

### Model Event-Driven Invalidation

```php
// In a model's boot method or observer
protected static function booted(): void
{
    static::updated(function (Student $student) {
        $cacheService = app(CacheService::class);
        $cacheService->forget("student_{$student->id}");
        $cacheService->forgetByTag("academy_{$student->academy_id}");
    });
}
```

## See Also

- [Configuration](../configuration) - Cache configuration reference
- [Architecture](../architecture) - System architecture overview
