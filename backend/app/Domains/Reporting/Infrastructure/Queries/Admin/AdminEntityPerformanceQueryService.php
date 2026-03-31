<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Infrastructure\Queries\Admin;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Lectures\Models\Attendance;
use App\Domains\Subscriptions\Models\PlatformPayment;
use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;
use App\Domains\Reporting\Infrastructure\Queries\SharedDateScope;
use Illuminate\Support\Facades\DB;

final class AdminEntityPerformanceQueryService
{
    public function __construct(
        private readonly SharedDateScope $dateScope,
    ) {}

    public function topGrowingAcademies(ReportFilters $filters, int $limit = 5): array
    {
        return Academy::query()
            ->active()
            ->withCount(['teachers as teacher_count'])
            ->withCount(['students as student_count' => fn ($q) => $q->wherePivot('is_active', true)])
            ->select('id', 'name', 'plan_type', 'plan_max_students', 'is_unlimited_students')
            ->get()
            ->map(fn (Academy $academy) => [
                'id' => $academy->id,
                'name' => $academy->name,
                'student_count' => $academy->student_count ?? 0,
                'teacher_count' => $academy->teacher_count ?? 0,
                'plan_type' => $academy->plan_type,
                'usage_pct' => $academy->is_unlimited_students ? null : $academy->getQuotaUsage(),
            ])
            ->sortByDesc('student_count')
            ->take($limit)
            ->values()
            ->toArray();
    }

    public function topGrowingTeachers(ReportFilters $filters, int $limit = 5): array
    {
        return Teacher::query()
            ->where('status', 'active')
            ->withCount(['activeStudents as active_student_count'])
            ->select('id', 'name', 'plan_type', 'plan_max_students', 'is_unlimited_students')
            ->get()
            ->map(fn (Teacher $teacher) => [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'active_students' => $teacher->active_student_count ?? 0,
                'plan_type' => $teacher->plan_type,
                'usage_pct' => $this->calculateTeacherUsage($teacher),
            ])
            ->sortByDesc('active_students')
            ->take($limit)
            ->values()
            ->toArray();
    }

    public function academiesWithAttendanceDecline(ReportFilters $filters, float $threshold = -10.0, int $limit = 10): array
    {
        if (!$filters->comparisonPeriod) {
            return [];
        }

        $academies = Academy::query()->active()->get();
        $result = [];

        foreach ($academies as $academy) {
            $currentAttendances = Attendance::query()
                ->whereHas('lecture', fn ($q) => $q->where('academy_id', $academy->id)
                    ->whereBetween('start_time', [$filters->period->startAt, $filters->period->endAt]))
                ->count();

            $baselineAttendances = Attendance::query()
                ->whereHas('lecture', fn ($q) => $q->where('academy_id', $academy->id)
                    ->whereBetween('start_time', [$filters->comparisonPeriod->startAt, $filters->comparisonPeriod->endAt]))
                ->count();

            $changePct = $baselineAttendances > 0
                ? round((($currentAttendances - $baselineAttendances) / $baselineAttendances) * 100, 2)
                : null;

            if ($changePct !== null && $changePct <= $threshold) {
                $result[] = [
                    'id' => $academy->id,
                    'name' => $academy->name,
                    'current_attendances' => $currentAttendances,
                    'baseline_attendances' => $baselineAttendances,
                    'change_pct' => $changePct,
                ];
            }
        }

        usort($result, fn (array $a, array $b): int => $a['change_pct'] <=> $b['change_pct']);

        return array_slice($result, 0, $limit);
    }

    public function teachersWithRevenueDecline(ReportFilters $filters, float $threshold = -10.0, int $limit = 10): array
    {
        if (!$filters->comparisonPeriod) {
            return [];
        }

        $teachers = Teacher::query()->where('status', 'active')->get();
        $result = [];

        foreach ($teachers as $teacher) {
            $currentRevenue = (float) PlatformPayment::query()
                ->where('payable_type', Teacher::class)
                ->where('payable_id', $teacher->id)
                ->whereNotNull('confirmed_at')
                ->whereBetween('confirmed_at', [$filters->period->startAt, $filters->period->endAt])
                ->sum('amount');

            $baselineRevenue = (float) PlatformPayment::query()
                ->where('payable_type', Teacher::class)
                ->where('payable_id', $teacher->id)
                ->whereNotNull('confirmed_at')
                ->whereBetween('confirmed_at', [$filters->comparisonPeriod->startAt, $filters->comparisonPeriod->endAt])
                ->sum('amount');

            $changePct = $baselineRevenue > 0
                ? round((($currentRevenue - $baselineRevenue) / $baselineRevenue) * 100, 2)
                : null;

            if ($changePct !== null && $changePct <= $threshold) {
                $result[] = [
                    'id' => $teacher->id,
                    'name' => $teacher->name,
                    'current_revenue' => $currentRevenue,
                    'baseline_revenue' => $baselineRevenue,
                    'change_pct' => $changePct,
                ];
            }
        }

        usort($result, fn (array $a, array $b): int => $a['change_pct'] <=> $b['change_pct']);

        return array_slice($result, 0, $limit);
    }

    public function entitiesNearLimit(float $threshold = 80.0, int $limit = 10): array
    {
        $result = [];

        Academy::query()
            ->active()
            ->where('is_unlimited_students', false)
            ->get()
            ->each(function (Academy $academy) use ($threshold, &$result): void {
                $usage = $academy->getQuotaUsage();
                if ($usage >= $threshold) {
                    $result[] = [
                        'id' => $academy->id,
                        'name' => $academy->name,
                        'type' => 'academy',
                        'usage_pct' => $usage,
                        'plan_type' => $academy->plan_type,
                    ];
                }
            });

        Teacher::query()
            ->where('status', 'active')
            ->where('is_unlimited_students', false)
            ->get()
            ->each(function (Teacher $teacher) use ($threshold, &$result): void {
                $usage = $this->calculateTeacherUsage($teacher);
                if ($usage !== null && $usage >= $threshold) {
                    $result[] = [
                        'id' => $teacher->id,
                        'name' => $teacher->name,
                        'type' => 'teacher',
                        'usage_pct' => $usage,
                        'plan_type' => $teacher->plan_type,
                    ];
                }
            });

        usort($result, fn (array $a, array $b): int => $b['usage_pct'] <=> $a['usage_pct']);

        return array_slice($result, 0, $limit);
    }

    private function calculateTeacherUsage(Teacher $teacher): ?float
    {
        if ($teacher->is_unlimited_students || !$teacher->plan_max_students) {
            return null;
        }

        $activeStudents = $teacher->activeStudents()->count();
        $limit = (int) $teacher->plan_max_students;

        if ($limit === 0) {
            return null;
        }

        return round(($activeStudents / $limit) * 100, 2);
    }
}
