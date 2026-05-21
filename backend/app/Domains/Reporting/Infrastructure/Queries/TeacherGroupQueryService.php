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
use App\Domains\Subscriptions\Models\PaymentLog;
use Illuminate\Support\Facades\DB;

final class TeacherGroupQueryService
{
    public function activeGroupsCount(Teacher $teacher, TeacherReportFilters $filters): int
    {
        $query = Group::where('teacher_id', $teacher->id);
        
        if ($filters->groupId) {
            $query->where('id', $filters->groupId);
        }

        return $query->whereHas('enrollments', fn($q) => $q->where('is_active', true))
            ->count();
    }

    public function perGroupMetrics(Teacher $teacher, TeacherReportFilters $filters): array
    {
        $groupQuery = Group::where('teacher_id', $teacher->id);
        if ($filters->groupId) $groupQuery->where('id', $filters->groupId);
        $groupIds = $groupQuery->pluck('id');

        $totalActiveQuery = Enrollment::where('teacher_id', $teacher->id)->where('is_active', true);
        if ($filters->groupId) $totalActiveQuery->where('group_id', $filters->groupId);
        $totalActive = $totalActiveQuery->count();

        $totalIncomeQuery = PaymentLog::where('teacher_id', $teacher->id)
            ->where('status', 'confirmed')
            ->whereBetween('confirmed_at', [$filters->base->period->startAt, $filters->base->period->endAt]);
        if ($filters->groupId) {
            $totalIncomeQuery->whereHas('enrollment', fn($q) => $q->where('group_id', $filters->groupId));
        }
        $totalIncome = (float) $totalIncomeQuery->sum('amount');

        // Single query: students per group
        $studentsPerGroup = Enrollment::where('teacher_id', $teacher->id)
            ->whereIn('group_id', $groupIds)
            ->select('group_id',
                DB::raw('COUNT(*) as students_count'),
                DB::raw('SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_students'),
            )
            ->groupBy('group_id')
            ->get()
            ->keyBy('group_id');

        // Single query: sessions per group
        $sessionsPerGroup = LectureSession::join('lectures', 'lecture_sessions.lecture_id', '=', 'lectures.id')
            ->where('lectures.teacher_id', $teacher->id)
            ->whereIn('lectures.group_id', $groupIds)
            ->where('lecture_sessions.is_cancelled', false)
            ->whereBetween('lecture_sessions.date', [$filters->base->period->startAt, $filters->base->period->endAt])
            ->select('lectures.group_id', DB::raw('COUNT(*) as delivered_sessions'))
            ->groupBy('lectures.group_id')
            ->get()
            ->keyBy('group_id');

        // Single query: attendance per group
        $attendancePerGroup = Attendance::join('lecture_sessions', 'attendances.lecture_session_id', '=', 'lecture_sessions.id')
            ->join('lectures', 'lecture_sessions.lecture_id', '=', 'lectures.id')
            ->where('lectures.teacher_id', $teacher->id)
            ->whereIn('lectures.group_id', $groupIds)
            ->where('lecture_sessions.is_cancelled', false)
            ->whereBetween('lecture_sessions.date', [$filters->base->period->startAt, $filters->base->period->endAt])
            ->select('lectures.group_id',
                DB::raw('COUNT(*) as total_attendance'),
                DB::raw('SUM(CASE WHEN attendances.status = \'present\' THEN 1 ELSE 0 END) as present_attendance'),
            )
            ->groupBy('lectures.group_id')
            ->get()
            ->keyBy('group_id');

        $groups = Group::where('teacher_id', $teacher->id)->whereIn('id', $groupIds)->get();
        $result = [];

        foreach ($groups as $group) {
            $sg = $studentsPerGroup->get($group->id);
            $studentsCount = (int) ($sg?->students_count ?? 0);
            $activeStudents = (int) ($sg?->active_students ?? 0);

            $deliveredSessions = (int) ($sessionsPerGroup->get($group->id)?->delivered_sessions ?? 0);

            $att = $attendancePerGroup->get($group->id);
            $totalAttendance = (int) ($att?->total_attendance ?? 0);
            $presentAttendance = (int) ($att?->present_attendance ?? 0);

            $attendanceRate = $totalAttendance > 0
                ? round(($presentAttendance / $totalAttendance) * 100, 2)
                : 0.0;

            $groupIncome = $totalIncome > 0 && $totalActive>0
                ? round(($activeStudents / $totalActive) * $totalIncome, 2)
                : 0.0;

            $result[] = [
                'group_name' => $group->name,
                'students_count' => $studentsCount,
                'active_students' => $activeStudents,
                'attendance_rate' => $attendanceRate,
                'delivered_sessions' => $deliveredSessions,
                'income_contribution' => $groupIncome,
                'trend' => 'stable',
            ];
        }

        return $result;
    }
}
