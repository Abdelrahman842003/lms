<?php

declare(strict_types=1);

namespace App\Domains\Application\Services;

use Illuminate\Support\Facades\Cache;

class CacheService
{
    // TTL Constants (in seconds)
    public const TTL_SHORT  = 300;   // 5 minutes
    public const TTL_MEDIUM = 600;   // 10 minutes
    public const TTL_LONG   = 3600;  // 1 hour
    public const TTL_DAY    = 86400; // 24 hours

    // =================== Settings Cache ====================

    public static function getSetting(string $key, callable $callback): mixed
    {
        return Cache::tags(['settings'])->rememberForever("setting:{$key}", $callback);
    }

    public static function getSettingWithTtl(string $key, int $ttl, callable $callback): mixed
    {
        return Cache::tags(['settings'])->remember("setting:{$key}", $ttl, $callback);
    }

    public static function forgetSetting(string $key): void
    {
        Cache::tags(['settings'])->forget("setting:{$key}");
        Cache::tags(['settings'])->forget('public_settings');
    }

    public static function forgetAllSettings(): void
    {
        Cache::tags(['settings'])->flush();
    }

    // =================== Gamification Cache ====================

    public static function getGamificationSettings(string|int $teacherId, callable $callback): mixed
    {
        return Cache::tags(['teacher_' . $teacherId, 'settings'])->remember(
            "teacher:{$teacherId}:gamification_settings",
            self::TTL_LONG,
            $callback
        );
    }

    public static function forgetGamificationSettings(string|int $teacherId): void
    {
        Cache::tags(['teacher_' . $teacherId, 'settings'])->forget("teacher:{$teacherId}:gamification_settings");
    }

    // =================== Leaderboard Cache ====================

    public static function getWeeklyLeaderboard(string|int $teacherId, callable $callback): mixed
    {
        return Cache::tags(['teacher_' . $teacherId, 'leaderboard'])->remember(
            "teacher:{$teacherId}:leaderboard:weekly",
            self::TTL_SHORT,
            $callback
        );
    }

    public static function getAllTimeLeaderboard(string|int $teacherId, callable $callback): mixed
    {
        return Cache::tags(['teacher_' . $teacherId, 'leaderboard'])->remember(
            "teacher:{$teacherId}:leaderboard:all_time",
            self::TTL_SHORT,
            $callback
        );
    }

    public static function forgetLeaderboards(string|int $teacherId): void
    {
        Cache::tags(['teacher_' . $teacherId, 'leaderboard'])->flush();
    }

    // =================== Teacher Cache (General) ====================

    public static function getTeacherDashboardStats(string|int $teacherId, callable $callback, ?string $academyId = null): array
    {
        $key = "teacher:{$teacherId}:dashboard:stats";
        if ($academyId) {
            $key .= ":academy:{$academyId}";
        } elseif ($academyId === 'independent') {
            $key .= ":independent";
        }

        return Cache::tags(['teacher_' . $teacherId])->remember(
            $key,
            self::TTL_SHORT,
            $callback
        );
    }

    public static function getTeacherGrades(string|int $teacherId, callable $callback): mixed
    {
        return Cache::tags(['teacher_' . $teacherId])->remember(
            "teacher:{$teacherId}:grades",
            self::TTL_MEDIUM,
            $callback
        );
    }

    public static function getTeacherGroups(string|int $teacherId, callable $callback): mixed
    {
        return Cache::tags(['teacher_' . $teacherId])->remember(
            "teacher:{$teacherId}:groups",
            self::TTL_MEDIUM,
            $callback
        );
    }

    public static function getAcademyGrades(string|int $academyId, callable $callback): mixed
    {
        return Cache::tags(['academy_' . $academyId])->remember(
            "academy:{$academyId}:grades",
            self::TTL_MEDIUM,
            $callback
        );
    }

    public static function forgetAcademyGrades(string|int $academyId): void
    {
        Cache::tags(['academy_' . $academyId])->forget("academy:{$academyId}:grades");
    }

    public static function forgetTeacherCache(string|int $teacherId): void
    {
        Cache::tags(['teacher_' . $teacherId])->flush();
    }

    public static function forgetTeacherDashboard(string|int $teacherId): void
    {
        // Flush all teacher dashboard variants (with/without academy)
        Cache::tags(['teacher_' . $teacherId])->flush();
    }

    public static function forgetTeacherGrades(string|int $teacherId): void
    {
        Cache::tags(['teacher_' . $teacherId])->forget("teacher:{$teacherId}:grades");
    }

    public static function forgetTeacherGroups(string|int $teacherId): void
    {
        Cache::tags(['teacher_' . $teacherId])->forget("teacher:{$teacherId}:groups");
    }

    // =================== Student Cache ====================

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

    // =================== Mistakes Cache ====================

    public static function getMistakesStats(string|int $studentId, string|int $teacherId, callable $callback): mixed
    {
        return Cache::tags(['student_' . $studentId, 'teacher_' . $teacherId])->remember(
            "student:{$studentId}:teacher:{$teacherId}:mistakes_stats",
            self::TTL_SHORT,
            $callback
        );
    }

    public static function forgetMistakesStats(string|int $studentId, string|int $teacherId): void
    {
        Cache::tags(['student_' . $studentId, 'teacher_' . $teacherId])->flush();
    }

    // =================== Bulk Invalidation ====================

    public static function forgetAllTeacherCache(string|int $teacherId): void
    {
        self::forgetTeacherCache($teacherId);
    }

    // =================== Lectures Cache ====================

    public static function getTeacherLectures(string|int $teacherId, callable $callback): mixed
    {
        return Cache::tags(['teacher_' . $teacherId, 'lectures'])->remember(
            "teacher:{$teacherId}:lectures",
            self::TTL_SHORT,
            $callback
        );
    }

    public static function getLectureAttendees(string|int $lectureId, callable $callback): mixed
    {
        return Cache::tags(['lecture_' . $lectureId])->remember(
            "lecture:{$lectureId}:attendees",
            self::TTL_SHORT,
            $callback
        );
    }

    public static function forgetLecture(string|int $lectureId, string|int $teacherId): void
    {
        Cache::tags(['lecture_' . $lectureId])->flush();
        Cache::tags(['teacher_' . $teacherId, 'lectures'])->forget("teacher:{$teacherId}:lectures");
    }

    // =================== Exams Cache ====================

    public static function getTeacherExams(string|int $teacherId, callable $callback): mixed
    {
        return Cache::tags(['teacher_' . $teacherId, 'exams'])->remember(
            "teacher:{$teacherId}:exams",
            self::TTL_SHORT,
            $callback
        );
    }

    public static function getExamAttemptCurrentQuestion(string|int $attemptId, callable $callback): mixed
    {
        return Cache::tags(['exam_attempt_' . $attemptId])->remember(
            "exam_attempt:{$attemptId}:current_question",
            self::TTL_SHORT,
            $callback
        );
    }

    public static function forgetExamAttemptCurrentQuestion(string|int $attemptId): void
    {
        Cache::tags(['exam_attempt_' . $attemptId])->forget("exam_attempt:{$attemptId}:current_question");
    }

    public static function getExamResults(string|int $examId, callable $callback): mixed
    {
        return Cache::tags(['exam_' . $examId])->remember(
            "exam:{$examId}:results",
            self::TTL_SHORT,
            $callback
        );
    }

    public static function forgetExam(string|int $examId, string|int $teacherId): void
    {
        Cache::tags(['exam_' . $examId])->flush();
        Cache::tags(['teacher_' . $teacherId, 'exams'])->forget("teacher:{$teacherId}:exams");
    }

    // =================== Academy Cache ====================

    public static function getAcademyDashboardStats(string|int $academyId, callable $callback): array
    {
        return Cache::tags(['academy_' . $academyId, 'dashboard'])->remember(
            "academy:{$academyId}:dashboard:stats",
            self::TTL_SHORT,
            $callback
        );
    }

    public static function forgetAcademyDashboard(string|int $academyId): void
    {
        Cache::tags(['academy_' . $academyId, 'dashboard'])->flush();
    }

    public static function forgetAllAcademyCache(string|int $academyId): void
    {
        Cache::tags(['academy_' . $academyId])->flush();
    }

    // =================== Admin Cache ====================

    public static function getAdminDashboardStats(callable $callback): array
    {
        return Cache::tags(['admin', 'dashboard'])->remember(
            "admin:dashboard:stats",
            self::TTL_SHORT,
            $callback
        );
    }

    public static function forgetAdminDashboard(): void
    {
        Cache::tags(['admin', 'dashboard'])->flush();
    }
}
