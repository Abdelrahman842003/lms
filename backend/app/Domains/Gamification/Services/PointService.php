<?php

declare(strict_types=1);

namespace App\Domains\Gamification\Services;

use App\Domains\Lectures\Models\Attendance;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Media\Services\ImageService;
use App\Domains\Exams\Models\ExamResult;
use App\Domains\Gamification\Models\GamificationSetting;
use App\Domains\Gamification\Models\PointTransaction;
use App\Domains\Auth\Models\Student;
use App\Domains\Gamification\Models\StudentPoint;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Support\Services\CacheService;
use App\Domains\Support\Services\HelperService;
use App\Domains\Support\Traits\HasAcademyFilter;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class PointService
{
    use HasAcademyFilter;

    /**
     * Award points for attendance
     */
    public function awardAttendancePoints(Student $student, Lecture $lecture): ?PointTransaction
    {
        $teacherId = $lecture->teacher_id;
        $settings  = CacheService::getGamificationSettings(
            $teacherId,
            fn() => GamificationSetting::getOrCreate($teacherId)
        );

        if (!$settings->is_enabled) {
            return null;
        }

        // Check if already awarded for this lecture
        $exists = PointTransaction::where('student_id', $student->id)
            ->where('teacher_id', $teacherId)
            ->where('reference_type', Lecture::class)
            ->where('reference_id', $lecture->id)
            ->exists();

        if ($exists) {
            return null;
        }

        $studentPoints = StudentPoint::getOrCreate($student->id, $teacherId);

        // Award attendance points
        $transaction = $studentPoints->addPoints(
            $settings->attendance_points,
            PointTransaction::TYPE_ATTENDANCE,
            Lecture::class,
            $lecture->id,
            "حضور حصة: {$lecture->title}"
        );

        // Update and check streak
        $newStreak = $studentPoints->incrementStreak();
        $this->checkStreakBonuses($studentPoints, $settings, $newStreak);

        // Check perfect month bonus
        $this->checkPerfectMonthBonus($studentPoints, $settings, $teacherId);

        return $transaction;
    }

    /**
     * Award points for exam completion
     */
    public function awardExamPoints(Student $student, ExamResult $result): ?PointTransaction
    {
        $exam      = $result->exam;
        $teacherId = $exam->teacher_id;
        $settings  = CacheService::getGamificationSettings(
            $teacherId,
            fn() => GamificationSetting::getOrCreate($teacherId)
        );

        if (!$settings->is_enabled) {
            return null;
        }

        $studentPoints = StudentPoint::getOrCreate($student->id, $teacherId);

        // Calculate points based on percentage
        $points = $settings->calculateExamPoints((float) $result->percentage);

        $transaction = $studentPoints->addPoints(
            $points,
            PointTransaction::TYPE_EXAM_SCORE,
            ExamResult::class,
            $result->id,
            "امتحان: {$exam->title} - {$result->percentage}%"
        );

        // Check for retake bonus (passed same exam multiple times)
        $this->checkExamRetakeBonus($studentPoints, $settings, $exam, $result);

        // Check for first place bonus
        $this->checkFirstPlaceBonus($studentPoints, $settings, $exam, $result);

        return $transaction;
    }

    /**
     * Award manual bonus points from teacher
     */
    public function awardManualBonus(Student $student, Teacher $teacher, int $points, string $description): PointTransaction
    {
        $studentPoints = StudentPoint::getOrCreate($student->id, $teacher->id);

        return $studentPoints->addPoints(
            $points,
            PointTransaction::TYPE_MANUAL_BONUS,
            null,
            null,
            $description
        );
    }

    /**
     * منح نقاط مباشرة بنوع محدد (مستخدمة داخلياً لنقاط الفيديو)
     */
    public function awardRaw(
        Student $student,
        string $teacherId,
        int $points,
        string $type,
        ?string $referenceType = null,
        ?string $referenceId = null,
        ?string $description = null
    ): PointTransaction {
        $studentPoints = StudentPoint::getOrCreate($student->id, $teacherId);

        return $studentPoints->addPoints(
            $points,
            $type,
            $referenceType,
            $referenceId,
            $description
        );
    }

    /**
     * Get weekly leaderboard for a teacher
     */
    public function getWeeklyLeaderboard(string $teacherId, ?int $limit = null): Collection
    {
        return CacheService::getWeeklyLeaderboard($teacherId, function () use ($teacherId, $limit) {
            $settings = CacheService::getGamificationSettings(
                $teacherId,
                fn() => GamificationSetting::getOrCreate($teacherId)
            );
            $limit = $limit ?? $settings->leaderboard_size;

            return PointTransaction::where('teacher_id', $teacherId)
                ->where('created_at', '>=', now()->startOfWeek())
                ->select('student_id', DB::raw('SUM(points) as weekly_points'))
                ->groupBy('student_id')
                ->orderByDesc('weekly_points')
                ->with('student:id,name,avatar_key')
                ->limit($limit)
                ->get()
                ->map(function ($item, $index) {
                    return [
                        'rank'          => $index + 1,
                        'student_id'    => $item->student_id,
                        'student'       => [
                            'id'         => $item->student->id,
                            'name'       => $item->student->name,
                            'avatar_key' => $item->student->avatar_key
                                ? app(ImageService::class)->getUrl($item->student->avatar_key)
                                : null,
                        ],
                        'weekly_points' => (int) $item->weekly_points,
                    ];
                });
        });
    }

    /**
     * Get weekly leaderboard for a teacher (paginated)
     */
    public function getWeeklyLeaderboardPaginated(
        string $teacherId,
        int $perPage = 15,
        ?string $academyId = null,
        ?string $gradeId = null,
        ?string $groupId = null
    ): \Illuminate\Contracts\Pagination\LengthAwarePaginator {
        $query = PointTransaction::where('teacher_id', $teacherId)
            ->where('created_at', '>=', now()->startOfWeek())
            ->select('student_id', DB::raw('SUM(points) as weekly_points'))
            ->groupBy('student_id')
            ->orderByDesc('weekly_points')
            ->with('student:id,name,avatar_key');

        // Filter by academy via student's enrollment (direct academy_id)
        if ($academyId === 'independent') {
            $query->whereHas('student.enrollments', function ($q) use ($teacherId) {
                $q->where('teacher_id', $teacherId)->whereNull('academy_id');
            });
        } elseif ($academyId) {
            $query->whereHas('student.enrollments', function ($q) use ($teacherId, $academyId) {
                $q->where('teacher_id', $teacherId)->where('academy_id', $academyId);
            });
        }

        // Filter by grade
        if ($gradeId) {
            $query->whereHas('student.enrollments', function ($q) use ($teacherId, $gradeId) {
                $q->where('teacher_id', $teacherId)->where('grade_id', $gradeId);
            });
        }

        // Filter by group
        if ($groupId) {
            $query->whereHas('student.enrollments', function ($q) use ($teacherId, $groupId) {
                $q->where('teacher_id', $teacherId)->where('group_id', $groupId);
            });
        }

        $paginator = $query->paginate($perPage);

        $paginator->getCollection()->transform(function ($item, $index) use ($paginator) {
            $rank = HelperService::calculatePaginationRank($index, $paginator);

            return [
                'rank'          => $rank,
                'student_id'    => $item->student_id,
                'student'       => [
                    'id'         => $item->student->id,
                    'name'       => $item->student->name,
                    'avatar_key' => $item->student->avatar_key
                        ? app(ImageService::class)->getUrl($item->student->avatar_key)
                        : null,
                ],
                'weekly_points' => (int) $item->weekly_points,
            ];
        });

        return $paginator;
    }

    /**
     * Get leaderboard for last 3 months
     */
    public function getLast3MonthsLeaderboard(string $teacherId, ?int $limit = null): Collection
    {
        $settings = CacheService::getGamificationSettings(
            $teacherId,
            fn() => GamificationSetting::getOrCreate($teacherId)
        );
        $limit = $limit ?? $settings->leaderboard_size;

        return PointTransaction::where('teacher_id', $teacherId)
            ->where('created_at', '>=', now()->subMonths(3))
            ->select('student_id', DB::raw('SUM(points) as total_points'))
            ->groupBy('student_id')
            ->orderByDesc('total_points')
            ->with('student:id,name,avatar_key')
            ->limit($limit)
            ->get()
            ->map(function ($item, $index) {
                return [
                    'rank'         => $index + 1,
                    'student_id'   => $item->student_id,
                    'student'      => [
                        'id'         => $item->student->id,
                        'name'       => $item->student->name,
                        'avatar_key' => $item->student->avatar_key
                            ? app(ImageService::class)->getUrl($item->student->avatar_key)
                            : null,
                    ],
                    'total_points' => (int) $item->total_points,
                ];
            });
    }

    /**
     * Get all-time leaderboard for a teacher
     */
    public function getAllTimeLeaderboard(string $teacherId, ?int $limit = null): Collection
    {
        return CacheService::getAllTimeLeaderboard($teacherId, function () use ($teacherId, $limit) {
            $settings = CacheService::getGamificationSettings(
                $teacherId,
                fn() => GamificationSetting::getOrCreate($teacherId)
            );
            $limit = $limit ?? $settings->leaderboard_size;

            return StudentPoint::where('teacher_id', $teacherId)
                ->orderByDesc('total_points')
                ->with('student:id,name,avatar_key')
                ->limit($limit)
                ->get()
                ->map(function ($item, $index) {
                    return [
                        'rank'         => $index + 1,
                        'student_id'   => $item->student_id,
                        'student'      => [
                            'id'         => $item->student->id,
                            'name'       => $item->student->name,
                            'avatar_key' => $item->student->avatar_key
                                ? app(ImageService::class)->getUrl($item->student->avatar_key)
                                : null,
                        ],
                        'total_points' => $item->total_points,
                    ];
                });
        });
    }

    /**
     * Get all-time leaderboard for a teacher (paginated)
     */
    public function getAllTimeLeaderboardPaginated(
        string $teacherId,
        int $perPage = 15,
        ?string $academyId = null,
        ?string $gradeId = null,
        ?string $groupId = null
    ): \Illuminate\Contracts\Pagination\LengthAwarePaginator {
        $query = StudentPoint::where('teacher_id', $teacherId)
            ->orderByDesc('total_points')
            ->with('student:id,name,avatar_key');

        // Filter by academy via student's enrollment (direct academy_id)
        if ($academyId === 'independent') {
            $query->whereHas('student.enrollments', function ($q) use ($teacherId) {
                $q->where('teacher_id', $teacherId)->whereNull('academy_id');
            });
        } elseif ($academyId) {
            $query->whereHas('student.enrollments', function ($q) use ($teacherId, $academyId) {
                $q->where('teacher_id', $teacherId)->where('academy_id', $academyId);
            });
        }

        // Filter by grade
        if ($gradeId) {
            $query->whereHas('student.enrollments', function ($q) use ($teacherId, $gradeId) {
                $q->where('teacher_id', $teacherId)->where('grade_id', $gradeId);
            });
        }

        // Filter by group
        if ($groupId) {
            $query->whereHas('student.enrollments', function ($q) use ($teacherId, $groupId) {
                $q->where('teacher_id', $teacherId)->where('group_id', $groupId);
            });
        }

        $paginator = $query->paginate($perPage);

        $paginator->getCollection()->transform(function ($item, $index) use ($paginator) {
            $rank = HelperService::calculatePaginationRank($index, $paginator);

            return [
                'rank'         => $rank,
                'student_id'   => $item->student_id,
                'student'      => [
                    'id'         => $item->student->id,
                    'name'       => $item->student->name,
                    'avatar_key' => $item->student->avatar_key
                        ? app(ImageService::class)->getUrl($item->student->avatar_key)
                        : null,
                ],
                'total_points' => $item->total_points,
            ];
        });

        return $paginator;
    }

    /**
     * Get student's points and rank for a specific teacher
     */
    public function getStudentStats(string $studentId, string $teacherId): array
    {
        $studentPoints = StudentPoint::getOrCreate($studentId, $teacherId);

        // Calculate rank
        $rank = StudentPoint::where('teacher_id', $teacherId)
            ->where('total_points', '>', $studentPoints->total_points)
            ->count() + 1;

        // Get weekly points
        $weeklyPoints = PointTransaction::where('student_id', $studentId)
            ->where('teacher_id', $teacherId)
            ->where('created_at', '>=', now()->startOfWeek())
            ->sum('points');

        // Calculate weekly rank
        $weeklyRank = PointTransaction::where('teacher_id', $teacherId)
            ->where('created_at', '>=', now()->startOfWeek())
            ->select('student_id', DB::raw('SUM(points) as weekly_points'))
            ->groupBy('student_id')
            ->having('weekly_points', '>', $weeklyPoints)
            ->get()
            ->count() + 1;

        return [
            'total_points'     => $studentPoints->total_points,
            'weekly_points'    => (int) $weeklyPoints,
            'rank'             => $rank,
            'weekly_rank'      => $weeklyRank,
            'attendance_streak' => $studentPoints->attendance_streak,
        ];
    }

    /**
     * Get weekly leaderboard for an academy (paginated)
     */
    public function getAcademyWeeklyLeaderboardPaginated(
        string $academyId,
        int $perPage = 15,
        ?string $gradeId = null,
        ?string $groupId = null,
        ?string $gradeName = null
    ): \Illuminate\Contracts\Pagination\LengthAwarePaginator {
        $query = PointTransaction::query()
            ->join('enrollments', function ($join) {
                $join->on('point_transactions.student_id', '=', 'enrollments.student_id')
                    ->on('point_transactions.teacher_id', '=', 'enrollments.teacher_id');
            })
            ->where('enrollments.academy_id', $academyId)
            ->where('point_transactions.created_at', '>=', now()->startOfWeek())
            ->select(
                'point_transactions.student_id',
                DB::raw('SUM(point_transactions.points) as weekly_points')
            )
            ->groupBy('point_transactions.student_id')
            ->orderByDesc('weekly_points')
            ->with('student:id,name,avatar_key');

        // Filter by grade ID
        if ($gradeId) {
            $query->where('enrollments.grade_id', $gradeId);
        }

        // Filter by grade Name
        if ($gradeName) {
            $query->join('grades', 'enrollments.grade_id', '=', 'grades.id')
                ->where('grades.name', $gradeName);
        }

        // Filter by group
        if ($groupId) {
            $query->where('enrollments.group_id', $groupId);
        }

        $paginator = $query->paginate($perPage);

        $paginator->getCollection()->transform(function ($item, $index) use ($paginator) {
            $rank = HelperService::calculatePaginationRank($index, $paginator);

            return [
                'rank'          => $rank,
                'student_id'    => $item->student_id,
                'student'       => [
                    'id'         => $item->student->id,
                    'name'       => $item->student->name,
                    'avatar_key' => $item->student->avatar_key
                        ? app(ImageService::class)->getUrl($item->student->avatar_key)
                        : null,
                ],
                'weekly_points' => (int) $item->weekly_points,
            ];
        });

        return $paginator;
    }

    /**
     * Get all-time leaderboard for an academy (paginated)
     */
    public function getAcademyAllTimeLeaderboardPaginated(
        string $academyId,
        int $perPage = 15,
        ?string $gradeId = null,
        ?string $groupId = null,
        ?string $gradeName = null
    ): \Illuminate\Contracts\Pagination\LengthAwarePaginator {
        $query = StudentPoint::query()
            ->join('enrollments', function ($join) {
                $join->on('student_points.student_id', '=', 'enrollments.student_id')
                    ->on('student_points.teacher_id', '=', 'enrollments.teacher_id');
            })
            ->where('enrollments.academy_id', $academyId)
            ->select(
                'student_points.student_id',
                DB::raw('SUM(student_points.total_points) as total_points')
            )
            ->groupBy('student_points.student_id')
            ->orderByDesc('total_points')
            ->with('student:id,name,avatar_key');

        // Filter by grade ID
        if ($gradeId) {
            $query->where('enrollments.grade_id', $gradeId);
        }

        // Filter by grade Name
        if ($gradeName) {
            $query->join('grades', 'enrollments.grade_id', '=', 'grades.id')
                ->where('grades.name', $gradeName);
        }

        // Filter by group
        if ($groupId) {
            $query->where('enrollments.group_id', $groupId);
        }

        $paginator = $query->paginate($perPage);

        $paginator->getCollection()->transform(function ($item, $index) use ($paginator) {
            $rank = HelperService::calculatePaginationRank($index, $paginator);

            return [
                'rank'         => $rank,
                'student_id'   => $item->student_id,
                'student'      => [
                    'id'         => $item->student->id,
                    'name'       => $item->student->name,
                    'avatar_key' => $item->student->avatar_key
                        ? app(ImageService::class)->getUrl($item->student->avatar_key)
                        : null,
                ],
                'total_points' => (int) $item->total_points,
            ];
        });

        return $paginator;
    }

    /**
     * Check and award streak bonuses
     */
    private function checkStreakBonuses(StudentPoint $studentPoints, GamificationSetting $settings, int $streak): void
    {
        // Check for streak 5
        if ($streak === 5 && $settings->streak_5_bonus > 0) {
            $studentPoints->addPoints(
                $settings->streak_5_bonus,
                PointTransaction::TYPE_STREAK_5,
                null,
                null,
                'بونص سلسلة 5 حصص متتالية! 🔥'
            );
        }

        // Check for streak 10
        if ($streak === 10 && $settings->streak_10_bonus > 0) {
            $studentPoints->addPoints(
                $settings->streak_10_bonus,
                PointTransaction::TYPE_STREAK_10,
                null,
                null,
                'بونص سلسلة 10 حصص متتالية! 🔥🔥'
            );
        }
    }

    /**
     * Check and award perfect month bonus
     */
    private function checkPerfectMonthBonus(StudentPoint $studentPoints, GamificationSetting $settings, string $teacherId): void
    {
        if ($settings->perfect_month_bonus <= 0) {
            return;
        }

        $startOfMonth = now()->startOfMonth();
        $endOfMonth   = now()->endOfMonth();

        // Get all lectures this month for this teacher
        $totalLectures = Lecture::where('teacher_id', $teacherId)
            ->whereBetween('date', [$startOfMonth, $endOfMonth])
            ->where('date', '<=', now())
            ->count();

        if ($totalLectures === 0) {
            return;
        }

        // Get student's attendance this month
        $attendedLectures = Attendance::where('student_id', $studentPoints->student_id)
            ->whereHas('lecture', function ($query) use ($teacherId, $startOfMonth, $endOfMonth) {
                $query->where('teacher_id', $teacherId)
                    ->whereBetween('date', [$startOfMonth, $endOfMonth]);
            })
            ->where('status', 'present')
            ->count();

        // If perfect attendance and not already awarded this month
        if ($attendedLectures >= $totalLectures) {
            $alreadyAwarded = PointTransaction::where('student_id', $studentPoints->student_id)
                ->where('teacher_id', $teacherId)
                ->where('type', PointTransaction::TYPE_PERFECT_MONTH)
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->exists();

            if (!$alreadyAwarded) {
                $studentPoints->addPoints(
                    $settings->perfect_month_bonus,
                    PointTransaction::TYPE_PERFECT_MONTH,
                    null,
                    null,
                    'حضور شهر كامل! 🌟'
                );
            }
        }
    }

    /**
     * Check and award exam retake bonus
     */
    private function checkExamRetakeBonus(StudentPoint $studentPoints, GamificationSetting $settings, $exam, ExamResult $result): void
    {
        if ($settings->exam_retake_bonus <= 0 || $result->percentage < 50) {
            return; // Only award if passed (50%+)
        }

        // Count successful attempts on this exam
        $successfulAttempts = ExamResult::where('student_id', $studentPoints->student_id)
            ->where('exam_id', $exam->id)
            ->where('percentage', '>=', 50)
            ->count();

        // Award bonus for 2nd+ successful attempt
        if ($successfulAttempts >= 2) {
            $alreadyAwarded = PointTransaction::where('student_id', $studentPoints->student_id)
                ->where('teacher_id', $studentPoints->teacher_id)
                ->where('type', PointTransaction::TYPE_EXAM_RETAKE_BONUS)
                ->where('reference_type', ExamResult::class)
                ->where('reference_id', $result->id)
                ->exists();

            if (!$alreadyAwarded) {
                $studentPoints->addPoints(
                    $settings->exam_retake_bonus,
                    PointTransaction::TYPE_EXAM_RETAKE_BONUS,
                    ExamResult::class,
                    $result->id,
                    'بونص إعادة الامتحان بنجاح! 💪'
                );
            }
        }
    }

    /**
     * Check and award first place bonus
     */
    private function checkFirstPlaceBonus(StudentPoint $studentPoints, GamificationSetting $settings, $exam, ExamResult $result): void
    {
        if ($settings->exam_first_place_bonus <= 0) {
            return;
        }

        // Check if this is the highest score
        $highestScore = ExamResult::where('exam_id', $exam->id)->max('percentage');

        if ($result->percentage >= $highestScore) {
            // Check if already awarded for this exam
            $alreadyAwarded = PointTransaction::where('student_id', $studentPoints->student_id)
                ->where('teacher_id', $studentPoints->teacher_id)
                ->where('type', PointTransaction::TYPE_EXAM_FIRST_PLACE)
                ->where('reference_type', ExamResult::class)
                ->whereHas('reference', function ($query) use ($exam) {
                    $query->where('exam_id', $exam->id);
                })
                ->exists();

            if (!$alreadyAwarded) {
                $studentPoints->addPoints(
                    $settings->exam_first_place_bonus,
                    PointTransaction::TYPE_EXAM_FIRST_PLACE,
                    ExamResult::class,
                    $result->id,
                    'أول الدفعة في الامتحان! 🏆'
                );
            }
        }
    }
}
