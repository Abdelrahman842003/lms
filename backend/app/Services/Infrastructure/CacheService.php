<?php

namespace App\Services\Infrastructure;

use Illuminate\Support\Facades\Cache;

class CacheService
{
    // TTL Constants (in seconds)
    public const TTL_SHORT = 300;      // 5 minutes
    public const TTL_MEDIUM = 600;     // 10 minutes
    public const TTL_LONG = 3600;      // 1 hour
    public const TTL_DAY = 86400;      // 24 hours

    // ==================== Teacher Cache ====================
    
    public static function getTeacherDashboardStats(string|int $teacherId, callable $callback): array
    {
        return Cache::remember(
            "teacher:{$teacherId}:dashboard:stats",
            self::TTL_SHORT,
            $callback
        );
    }

    public static function forgetTeacherDashboard(string|int $teacherId): void
    {
        Cache::forget("teacher:{$teacherId}:dashboard:stats");
    }

    public static function getTeacherGrades(string|int $teacherId, callable $callback): mixed
    {
        return Cache::remember(
            "teacher:{$teacherId}:grades",
            self::TTL_MEDIUM,
            $callback
        );
    }

    public static function forgetTeacherGrades(string|int $teacherId): void
    {
        Cache::forget("teacher:{$teacherId}:grades");
    }

    public static function getTeacherGroups(string|int $teacherId, callable $callback): mixed
    {
        return Cache::remember(
            "teacher:{$teacherId}:groups",
            self::TTL_MEDIUM,
            $callback
        );
    }

    public static function forgetTeacherGroups(string|int $teacherId): void
    {
        Cache::forget("teacher:{$teacherId}:groups");
    }

    // ==================== Student Cache ====================

    public static function setStudentPhoneIndex(string $phone, string|int $studentId): void
    {
        Cache::put("student:phone:{$phone}", $studentId, self::TTL_DAY);
    }

    public static function getStudentIdByPhone(string $phone): string|int|null
    {
        return Cache::get("student:phone:{$phone}");
    }

    public static function setStudentProfile(string|int $studentId, array $profile): void
    {
        Cache::put("student:{$studentId}:profile", $profile, self::TTL_DAY);
    }

    public static function getStudentProfile(string|int $studentId): ?array
    {
        return Cache::get("student:{$studentId}:profile");
    }

    public static function cacheStudent(string|int $studentId, ?string $phone, array $profile): void
    {
        self::setStudentProfile($studentId, $profile);
        if ($phone) {
            self::setStudentPhoneIndex($phone, $studentId);
        }
    }

    public static function forgetStudent(string|int $studentId, ?string $phone = null): void
    {
        Cache::forget("student:{$studentId}:profile");
        if ($phone) {
            Cache::forget("student:phone:{$phone}");
        }
    }

    // ==================== Bulk Invalidation ====================

    public static function forgetAllTeacherCache(string|int $teacherId): void
    {
        self::forgetTeacherDashboard($teacherId);
        self::forgetTeacherGrades($teacherId);
        self::forgetTeacherGroups($teacherId);
    }
}
