<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Infrastructure\Queries;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Enrollments\Models\Group;
use App\Domains\Lectures\Models\Attendance;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Lectures\Models\LectureSession;
use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;

final class TeacherAttendanceQueryService
{
    public function overallAttendanceRate(Teacher $teacher, ReportFilters $filters): float
    {
        $lectureIds = Lecture::where('teacher_id', $teacher->id)->pluck('id');

        $sessionIds = LectureSession::whereIn('lecture_id', $lectureIds)
            ->where('is_cancelled', false)
            ->whereBetween('date', [$filters->period->startAt, $filters->period->endAt])
            ->pluck('id');

        $total = Attendance::whereIn('lecture_session_id', $sessionIds)->count();

        if ($total === 0) {
            return 0.0;
        }

        $present = Attendance::whereIn('lecture_session_id', $sessionIds)
            ->where('status', 'present')
            ->count();

        return round(($present / $total) * 100, 2);
    }

    public function attendanceByGroup(Teacher $teacher, ReportFilters $filters): array
    {
        $groups = Group::where('teacher_id', $teacher->id)->get();
        $result = [];

        foreach ($groups as $group) {
            $lectureIds = Lecture::where('teacher_id', $teacher->id)
                ->where('group_id', $group->id)
                ->pluck('id');

            $sessionIds = LectureSession::whereIn('lecture_id', $lectureIds)
                ->where('is_cancelled', false)
                ->whereBetween('date', [$filters->period->startAt, $filters->period->endAt])
                ->pluck('id');

            $total = Attendance::whereIn('lecture_session_id', $sessionIds)->count();
            $present = $total > 0
                ? Attendance::whereIn('lecture_session_id', $sessionIds)->where('status', 'present')->count()
                : 0;

            $rate = $total > 0 ? round(($present / $total) * 100, 2) : 0.0;

            $studentsCount = Enrollment::where('teacher_id', $teacher->id)
                ->where('group_id', $group->id)
                ->where('is_active', true)
                ->count();

            $sessionsCount = $sessionIds->count();

            $result[] = [
                'group_name' => $group->name,
                'students_count' => $studentsCount,
                'attendance_rate' => $rate,
                'sessions_count' => $sessionsCount,
                'trend' => 'stable',
            ];
        }

        usort($result, fn(array $a, array $b): int => $b['attendance_rate'] <=> $a['attendance_rate']);

        return $result;
    }

    public function bestAndWorstGroup(Teacher $teacher, ReportFilters $filters): array
    {
        $byGroup = $this->attendanceByGroup($teacher, $filters);

        if (empty($byGroup)) {
            return ['best' => null, 'worst' => null];
        }

        return [
            'best' => $byGroup[0]['group_name'] ?? null,
            'worst' => $byGroup[count($byGroup) - 1]['group_name'] ?? null,
        ];
    }

    public function attendanceChangeFromPrevious(Teacher $teacher, ReportFilters $filters): ?float
    {
        if (!$filters->hasComparison() || $filters->comparisonPeriod === null) {
            return null;
        }

        $current = $this->overallAttendanceRate($teacher, $filters);

        $previousFilters = new ReportFilters(
            period: new \App\Domains\Reporting\Domain\ValueObjects\ReportingPeriod(
                $filters->comparisonPeriod->startAt,
                $filters->comparisonPeriod->endAt,
                $filters->period->timezone,
            ),
        );

        $previous = $this->overallAttendanceRate($teacher, $previousFilters);

        if ($previous == 0.0 && $current > 0.0) {
            return null;
        }
        if ($previous == 0.0 && $current == 0.0) {
            return 0.0;
        }

        return round((($current - $previous) / abs($previous)) * 100, 2);
    }
}
