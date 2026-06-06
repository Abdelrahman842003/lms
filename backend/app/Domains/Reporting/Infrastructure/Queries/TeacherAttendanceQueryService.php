<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Infrastructure\Queries;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Enrollments\Models\Group;
use App\Domains\Lectures\Models\Attendance;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Lectures\Models\LectureSession;
use App\Domains\Reporting\Domain\ValueObjects\TeacherReportFilters;
use Illuminate\Support\Facades\DB;

final class TeacherAttendanceQueryService
{
    public function overallAttendanceRate($teacher, TeacherReportFilters $filters): float
    {
        $lectureQuery = $teacher->lectures();
        if ($filters->groupId) $lectureQuery->where('group_id', $filters->groupId);
        $lectureIds = $lectureQuery->pluck('lectures.id');

        $sessionIds = LectureSession::whereIn('lecture_id', $lectureIds)
            ->where('is_cancelled', false)
            ->whereBetween('date', [$filters->base->period->startAt, $filters->base->period->endAt])
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

    public function attendanceByGroup($teacher, TeacherReportFilters $filters): array
    {
        $groupQuery = $teacher->groups();
        if ($filters->groupId) $groupQuery->where('groups.id', $filters->groupId);
        $groupIds = $groupQuery->pluck('groups.id');

        // Single query: attendance counts per group
        $attendanceCounts = Attendance::join('lecture_sessions', 'attendances.lecture_session_id', '=', 'lecture_sessions.id')
            ->join('lectures', 'lecture_sessions.lecture_id', '=', 'lectures.id')
            ->whereIn('lectures.group_id', $groupIds)
            ->where('lecture_sessions.is_cancelled', false)
            ->whereBetween('lecture_sessions.date', [$filters->base->period->startAt, $filters->base->period->endAt])
            ->select('lectures.group_id',
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN attendances.status = \'present\' THEN 1 ELSE 0 END) as present'),
            )
            ->groupBy('lectures.group_id')
            ->get()
            ->keyBy('group_id');

        // Single query: sessions count per group
        $sessionsCounts = LectureSession::join('lectures', 'lecture_sessions.lecture_id', '=', 'lectures.id')
            ->whereIn('lectures.group_id', $groupIds)
            ->where('lecture_sessions.is_cancelled', false)
            ->whereBetween('lecture_sessions.date', [$filters->base->period->startAt, $filters->base->period->endAt])
            ->select('lectures.group_id', DB::raw('COUNT(*) as sessions_count'))
            ->groupBy('lectures.group_id')
            ->get()
            ->keyBy('group_id');

        // Single query: active students per group
        $studentsCounts = $teacher->enrollments()
            ->whereIn('enrollments.group_id', $groupIds)
            ->where('enrollments.is_active', true)
            ->select('enrollments.group_id', DB::raw('COUNT(*) as students_count'))
            ->groupBy('enrollments.group_id')
            ->get()
            ->keyBy('group_id');

        $groups = $teacher->groups()->whereIn('groups.id', $groupIds)->get();
        $result = [];

        foreach ($groups as $group) {
            $att = $attendanceCounts->get($group->id);
            $total = (int) ($att?->total ?? 0);
            $present = (int) ($att?->present ?? 0);
            $rate = $total > 0 ? round(($present / $total) * 100, 2) : 0.0;

            $result[] = [
                'group_name' => $group->name,
                'students_count' => (int) ($studentsCounts->get($group->id)?->students_count ?? 0),
                'attendance_rate' => $rate,
                'sessions_count' => (int) ($sessionsCounts->get($group->id)?->sessions_count ?? 0),
                'trend' => 'stable',
            ];
        }

        usort($result, fn(array $a, array $b): int => $b['attendance_rate'] <=> $a['attendance_rate']);

        return $result;
    }

    public function bestAndWorstGroup($teacher, TeacherReportFilters $filters): array
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

    public function attendanceChangeFromPrevious($teacher, TeacherReportFilters $filters): ?float
    {
        if (!$filters->base->hasComparison() || $filters->base->comparisonPeriod === null) {
            return null;
        }

        $current = $this->overallAttendanceRate($teacher, $filters);

        $previousFilters = new TeacherReportFilters(
            base: \App\Domains\Reporting\Domain\ValueObjects\ReportFilters::fromArray([
                'preset' => 'custom_range',
                'start_at' => $filters->base->comparisonPeriod->startAt->toIso8601String(),
                'end_at' => $filters->base->comparisonPeriod->endAt->toIso8601String(),
                'timezone' => $filters->base->period->timezone->getName(),
            ]),
            groupId: $filters->groupId,
            studentActivityState: $filters->studentActivityState,
            attendanceState: $filters->attendanceState,
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
