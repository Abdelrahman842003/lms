# Caching Strategy

## Overview

This document describes the caching strategy used throughout the Laravel Backend LMS project. Caching is implemented using Laravel's cache facade with Redis as the default cache driver. The [`CacheService`](../backend/app/Domains/Support/Services/CacheService.php) provides a centralized interface for all caching operations.

## Cache Service

### Location
- **File:** `backend/app/Domains/Support/Services/CacheService.php`
- **Namespace:** `App\Domains\Support\Services`

### TTL Constants

The [`CacheService`](../backend/app/Domains/Support/CacheService.php) defines standard TTL (Time To Live) constants:

| Constant | Value | Duration | Use Case |
|----------|-------|----------|----------|
| `TTL_SHORT` | 300 | 5 minutes | Frequently changing data |
| `TTL_MEDIUM` | 600 | 10 minutes | Moderately changing data |
| `TTL_LONG` | 3600 | 1 hour | Relatively stable data |
| `TTL_DAY` | 86400 | 24 hours | Daily data |

## Cache Key Patterns

### Settings Cache

**Tag:** `settings`

| Key Pattern | TTL | Description | Method |
|-------------|-----|-------------|--------|
| `setting:{key}` | Forever | System settings | `getSetting()`, `getSettingWithTtl()` |

**Usage:**
```php
// Get setting with infinite TTL
$value = CacheService::getSetting('app_name', fn() => 'My LMS');

// Get setting with custom TTL
$value = CacheService::getSettingWithTtl('app_name', 3600, fn() => 'My LMS');

// Forget specific setting
CacheService::forgetSetting('app_name');

// Forget all settings
CacheService::forgetAllSettings();
```

### Gamification Cache

**Tags:** `teacher_{teacherId}`, `settings`

| Key Pattern | TTL | Description | Method |
|-------------|-----|-------------|--------|
| `teacher:{teacherId}:gamification_settings` | 1 hour | Teacher's gamification settings | `getGamificationSettings()` |

**Usage:**
```php
// Get gamification settings
$settings = CacheService::getGamificationSettings($teacherId, fn() => GamificationSetting::first());

// Forget gamification settings
CacheService::forgetGamificationSettings($teacherId);
```

### Leaderboard Cache

**Tags:** `teacher_{teacherId}`, `leaderboard`

| Key Pattern | TTL | Description | Method |
|-------------|-----|-------------|--------|
| `teacher:{teacherId}:leaderboard:weekly` | 5 minutes | Weekly leaderboard | `getWeeklyLeaderboard()` |
| `teacher:{teacherId}:leaderboard:all_time` | 5 minutes | All-time leaderboard | `getAllTimeLeaderboard()` |

**Usage:**
```php
// Get weekly leaderboard
$leaderboard = CacheService::getWeeklyLeaderboard($teacherId, fn() => StudentPoint::weekly()->get());

// Get all-time leaderboard
$leaderboard = CacheService::getAllTimeLeaderboard($teacherId, fn() => StudentPoint::allTime()->get());

// Forget all leaderboards
CacheService::forgetLeaderboards($teacherId);
```

### Teacher Cache

**Tags:** `teacher_{teacherId}`

| Key Pattern | TTL | Description | Method |
|-------------|-----|-------------|--------|
| `teacher:{teacherId}:dashboard:stats` | 5 minutes | Teacher dashboard statistics | `getTeacherDashboardStats()` |
| `teacher:{teacherId}:dashboard:stats:academy:{academyId}` | 5 minutes | Teacher stats for specific academy | `getTeacherDashboardStats()` |
| `teacher:{teacherId}:dashboard:stats:independent` | 5 minutes | Independent teacher stats | `getTeacherDashboardStats()` |
| `teacher:{teacherId}:grades` | 5 minutes | Teacher's grades list | `getTeacherGrades()` |
| `teacher:{teacherId}:groups` | 5 minutes | Teacher's groups list | `getTeacherGroups()` |
| `teacher:{teacherId}:lectures` | 5 minutes | Teacher's lectures list | `getTeacherLectures()` |
| `teacher:{teacherId}:exams` | 5 minutes | Teacher's exams list | `getTeacherExams()` |

**Usage:**
```php
// Get teacher dashboard stats
$stats = CacheService::getTeacherDashboardStats($teacherId, fn() => $this->calculateStats());

// Get teacher stats for academy
$stats = CacheService::getTeacherDashboardStats($teacherId, fn() => $this->calculateStats(), $academyId);

// Get teacher grades
$grades = CacheService::getTeacherGrades($teacherId, fn() => Grade::where('teacher_id', $teacherId)->get());

// Forget teacher grades
CacheService::forgetTeacherGrades($teacherId);

// Forget teacher groups
CacheService::forgetTeacherGroups($teacherId);

// Forget all teacher cache
CacheService::forgetAllTeacherCache($teacherId);
```

### Academy Cache

**Tags:** `academy_{academyId}`, `dashboard`

| Key Pattern | TTL | Description | Method |
|-------------|-----|-------------|--------|
| `academy:{academyId}:grades` | 5 minutes | Academy's grades list | `getAcademyGrades()` |
| `academy:{academyId}:dashboard:stats` | 5 minutes | Academy dashboard statistics | `getAcademyDashboardStats()` |

**Usage:**
```php
// Get academy grades
$grades = CacheService::getAcademyGrades($academyId, fn() => Grade::where('academy_id', $academyId)->get());

// Get academy dashboard stats
$stats = CacheService::getAcademyDashboardStats($academyId, fn() => $this->calculateStats());

// Forget academy grades
CacheService::forgetAcademyGrades($academyId);

// Forget academy dashboard
CacheService::forgetAcademyDashboard($academyId);

// Forget all academy cache
CacheService::forgetAllAcademyCache($academyId);
```

### Student Cache

**Tags:** `student_{studentId}`, `teacher_{teacherId}`

| Key Pattern | TTL | Description | Method |
|-------------|-----|-------------|--------|
| `student:phone:{phone}` | 24 hours | Student ID by phone number | `setStudentPhone()`, `getStudentByPhone()` |
| `student:{studentId}:profile` | 24 hours | Student profile data | `setStudentProfile()`, `getStudentProfile()` |
| `student:{studentId}:teacher:{teacherId}:mistakes_stats` | 10 minutes | Student's mistakes statistics | `getMistakesStats()` |

**Usage:**
```php
// Set student phone mapping
CacheService::setStudentPhone($phone, $studentId);

// Get student by phone
$studentId = CacheService::getStudentByPhone($phone);

// Set student profile
CacheService::setStudentProfile($studentId, $profileData);

// Get student profile
$profile = CacheService::getStudentProfile($studentId);

// Get mistakes stats
$stats = CacheService::getMistakesStats($studentId, $teacherId, fn() => $this->calculateMistakes());

// Forget student profile
CacheService::forgetStudentProfile($studentId, $phone);

// Forget student mistakes
CacheService::forgetStudentMistakes($studentId, $teacherId);
```

### Lecture Cache

**Tags:** `lecture_{lectureId}`, `teacher_{teacherId}`, `lectures`

| Key Pattern | TTL | Description | Method |
|-------------|-----|-------------|--------|
| `lecture:{lectureId}:attendees` | 5 minutes | Lecture attendees list | `getLectureAttendees()` |

**Usage:**
```php
// Get lecture attendees
$attendees = CacheService::getLectureAttendees($lectureId, fn() => Attendance::where('lecture_id', $lectureId)->get());

// Forget lecture cache
CacheService::forgetLectureCache($lectureId, $teacherId);
```

### Exam Cache

**Tags:** `exam_{examId}`, `exam_attempt_{attemptId}`, `teacher_{teacherId}`, `exams`

| Key Pattern | TTL | Description | Method |
|-------------|-----|-------------|--------|
| `exam_attempt:{attemptId}:current_question` | 5 minutes | Current question in exam attempt | `getCurrentQuestion()` |
| `exam:{examId}:results` | 5 minutes | Exam results | `getExamResults()` |

**Usage:**
```php
// Get current question
$question = CacheService::getCurrentQuestion($attemptId, fn() => $this->getCurrentQuestion());

// Forget current question
CacheService::forgetCurrentQuestion($attemptId);

// Get exam results
$results = CacheService::getExamResults($examId, fn() => $this->calculateResults());

// Forget exam cache
CacheService::forgetExamCache($examId, $teacherId);
```

### Admin Cache

**Tags:** `admin`, `dashboard`

| Key Pattern | TTL | Description | Method |
|-------------|-----|-------------|--------|
| `admin:dashboard:stats` | 5 minutes | Admin dashboard statistics | `getAdminDashboardStats()` |

**Usage:**
```php
// Get admin dashboard stats
$stats = CacheService::getAdminDashboardStats(fn() => $this->calculateStats());

// Forget admin dashboard
CacheService::forgetAdminDashboard();
```

### OTP Cache

**Tag:** None (direct Redis operations)

| Key Pattern | TTL | Description |
|-------------|-----|-------------|
| `otp:{phone}` | 5 minutes | OTP code for phone verification |

**Usage:**
```php
// Store OTP
Cache::put("otp:{$phone}", $otp, now()->addMinutes(5));

// Get OTP
$otp = Cache::get("otp:{$phone}");

// Forget OTP
Cache::forget("otp:{$phone}");
```

### Rate Limiting Cache

**Tag:** None (direct Redis operations)

| Key Pattern | TTL | Description |
|-------------|-----|-------------|
| `otp_rate:{phone}` | 1 minute | OTP rate limit counter |
| `otp_total:{phone}` | 1 hour | Total OTP attempts |
| `otp_lockout:{phone}` | 15 minutes | OTP lockout flag |

**Usage:**
```php
// Check rate limit
$attempts = Cache::get("otp_rate:{$phone}", 0);
Cache::put("otp_rate:{$phone}", $attempts + 1, now()->addMinute());

// Check lockout
if (Cache::has("otp_lockout:{$phone}")) {
    // User is locked out
}
```

### Suspension Status Cache

**Tag:** None (direct Redis operations)

| Key Pattern | TTL | Description |
|-------------|-----|-------------|
| `user:{userId}:suspension_status` | 5 minutes | User suspension status |
| `user:{userId}:academy:{academyId}:is_active` | 5 minutes | Academy activation status |
| `teacher:{teacherId}:suspension_status` | 5 minutes | Teacher suspension status |

**Usage:**
```php
// Get suspension status
$status = Cache::remember("user:{$userId}:suspension_status", 300, function () use ($user) {
    return [
        'is_suspended' => $user->is_suspended,
        'suspension_reason' => $user->suspension_reason,
    ];
});
```

## Cache Invalidation

### Tag-Based Invalidation

Laravel's cache tags allow for efficient bulk invalidation:

```php
// Forget all settings
Cache::tags(['settings'])->flush();

// Forget all teacher-specific cache
Cache::tags(['teacher_' . $teacherId])->flush();

// Forget all academy-specific cache
Cache::tags(['academy_' . $academyId])->flush();

// Forget all leaderboards for a teacher
Cache::tags(['teacher_' . $teacherId, 'leaderboard'])->flush();

// Forget all dashboard cache for an academy
Cache::tags(['academy_' . $academyId, 'dashboard'])->flush();
```

### Observer-Based Invalidation

Cache is automatically invalidated through model observers:

```php
// Example: StudentObserver
class StudentObserver
{
    public function updated(Student $student): void
    {
        if ($student->isDirty('phone')) {
            Cache::forget("student:phone:{$student->getOriginal('phone')}");
        }
        Cache::forget("student:{$student->id}:profile");
    }
}
```

### Manual Invalidation

Use the [`CacheService`](../backend/app/Domains/Support/CacheService.php) methods for manual invalidation:

```php
// Forget specific cache
CacheService::forgetSetting('app_name');
CacheService::forgetGamificationSettings($teacherId);
CacheService::forgetLeaderboards($teacherId);
CacheService::forgetTeacherGrades($teacherId);
CacheService::forgetAcademyGrades($academyId);
CacheService::forgetStudentProfile($studentId, $phone);
```

## Cache Warming

### Dashboard Cache

Dashboard statistics are cached on first access and refreshed periodically:

```php
// Cache is warmed on first request
$stats = CacheService::getTeacherDashboardStats($teacherId, function () {
    return $this->calculateExpensiveStats();
});
```

### Leaderboard Cache

Leaderboards are recalculated in the background:

```php
// Job to recalculate leaderboard
class RecalculateLeaderboard implements ShouldQueue
{
    public function handle(): void
    {
        // Recalculate and cache
        $leaderboard = $this->calculateLeaderboard();
        Cache::put("leaderboard.teacher.{$this->teacherId}", $leaderboard, 300);
    }
}
```

## Cache Best Practices

### 1. Use Appropriate TTL

- **Short TTL (5 minutes):** Frequently changing data (dashboard stats, leaderboards)
- **Medium TTL (10 minutes):** Moderately changing data (mistakes stats, exam results)
- **Long TTL (1 hour):** Relatively stable data (gamification settings, lists)
- **Day TTL (24 hours):** Daily data (student profiles, phone mappings)
- **Forever:** Static settings (system settings)

### 2. Use Cache Tags

Cache tags enable efficient bulk invalidation:

```php
// ✅ Good - Use tags
Cache::tags(['teacher_' . $teacherId])->remember($key, $ttl, $callback);

// ❌ Bad - No tags
Cache::remember($key, $ttl, $callback);
```

### 3. Invalidate on Changes

Always invalidate cache when data changes:

```php
// In controller
public function update(Request $request, $id)
{
    $grade = Grade::find($id);
    $grade->update($request->validated());
    
    // Invalidate cache
    CacheService::forgetTeacherGrades($teacherId);
    CacheService::forgetAcademyGrades($academyId);
    
    return $this->successResponse(GradeResource::make($grade));
}
```

### 4. Cache Expensive Queries

Cache database queries that are expensive or frequently accessed:

```php
// ✅ Good - Cache expensive query
$students = Cache::remember("teacher:{$teacherId}:students", 300, function () use ($teacherId) {
    return Student::with('grade', 'group')
        ->where('teacher_id', $teacherId)
        ->where('is_active', true)
        ->get();
});

// ❌ Bad - No caching
$students = Student::with('grade', 'group')
    ->where('teacher_id', $teacherId)
    ->where('is_active', true)
    ->get();
```

### 5. Use Remember for Idempotent Operations

Use `Cache::remember()` for idempotent operations:

```php
$value = Cache::remember("key", $ttl, function () {
    return expensiveOperation();
});
```

### 6. Avoid Caching Sensitive Data

Never cache sensitive information like passwords or tokens:

```php
// ❌ Bad - Caching sensitive data
Cache::put("user:{$userId}:password", $user->password);

// ✅ Good - Cache non-sensitive data only
Cache::put("user:{$userId}:profile", $user->only(['name', 'email']));
```

## Cache Monitoring

### Laravel Telescope

Use Laravel Telescope to monitor cache operations:

```php
// Check cache hits/misses in Telescope
// /telescope/cache
```

### Cache Statistics

Monitor cache effectiveness:

```php
// Get cache statistics
$hits = Cache::get('cache_hits', 0);
$misses = Cache::get('cache_misses', 0);
$hitRate = $hits / ($hits + $misses);
```

## Cache Configuration

### Redis Configuration

Redis is configured in `config/cache.php`:

```php
'redis' => [
    'driver' => 'redis',
    'connection' => 'cache',
    'lock_connection' => 'default',
],
```

### Cache Tags Support

Ensure cache tags are enabled (requires Redis):

```php
'redis' => [
    'driver' => 'redis',
    'connection' => 'cache',
    'tags' => true, // Enable tags
],
```

## Troubleshooting

### Cache Not Working

1. Check Redis connection: `php artisan cache:clear`
2. Verify cache driver: Check `CACHE_DRIVER` in `.env`
3. Check Redis server: `redis-cli ping`

### Stale Cache

1. Clear specific cache: `Cache::forget('key')`
2. Clear tagged cache: `Cache::tags(['tag'])->flush()`
3. Clear all cache: `php artisan cache:clear`

### Cache Key Conflicts

Use descriptive, unique key patterns:

```php
// ✅ Good
"teacher:{$teacherId}:grades"
"academy:{$academyId}:grades"

// ❌ Bad - Potential conflict
"grades:{$id}"
```

## Performance Impact

### Benefits

- **Reduced Database Load:** Fewer queries to the database
- **Faster Response Times:** Cached data is served from memory
- **Better Scalability:** Reduced load allows handling more requests

### Trade-offs

- **Memory Usage:** Cache uses Redis memory
- **Staleness:** Cached data may be slightly outdated
- **Complexity:** Cache invalidation adds complexity

### Recommendations

- Monitor cache hit rates
- Set appropriate TTL values
- Use cache tags for efficient invalidation
- Implement cache warming for critical data
