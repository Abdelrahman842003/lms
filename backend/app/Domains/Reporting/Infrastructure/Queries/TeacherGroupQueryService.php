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
use App\Domains\Subscriptions\Models\PaymentLog;

final class TeacherGroupQueryService
{
    public function activeGroupsCount(Teacher $teacher, ReportFilters $filters): int
    {
        return Group::where('teacher_id', $teacher->id)
            ->whereHas('enrollments', fn($q) => $q->where('is_active', true))
            ->count();
    }

    public function perGroupMetrics(Teacher $teacher, ReportFilters $filters): array
    {
        $groups = Group::where('teacher_id', $teacher->id)->get();

        $totalActive = Enrollment::where('teacher_id', $teacher->id)
            ->where('is_active', true)
            ->count();

        $totalIncome = (float) PaymentLog::where('teacher_id', $teacher->id)
            ->where('status', 'confirmed')
            ->whereBetween('confirmed_at', [$filters->period->startAt, $filters->period->endAt])
            ->sum('amount');

        $result = [];

        foreach ($groups as $group) {
            $studentsCount = Enrollment::where('teacher_id', $teacher->id)
                ->where('group_id', $group->id)
                ->count();

            $activeStudents = Enrollment::where('teacher_id', $teacher->id)
                ->where('group_id', $group->id)
                ->where('is_active', true)
                ->count();

            $deliveredSessions = LectureSession::whereHas('lecture', fn($q) => $q
                ->where('teacher_id', $teacher->id)
                ->where('group_id', $group->id))
                ->where('is_cancelled', false)
                ->whereBetween('date', [$filters->period->startAt, $filters->period->endAt])
                ->count();

            $lectureIds = Lecture::where('teacher_id', $teacher->id)
                ->where('group_id', $group->id)
                ->pluck('id');

            $sessionIds = LectureSession::whereIn('lecture_id', $lectureIds)
                ->where('is_cancelled', false)
                ->whereBetween('date', [$filters->period->startAt, $filters->period->endAt])
                ->pluck('id');

            $totalAttendance = Attendance::whereIn('lecture_session_id', $sessionIds)->count();
            $presentAttendance = $totalAttendance > 0
                ? Attendance::whereIn('lecture_session_id', $sessionIds)->where('status', 'present')->count()
                : 0;

            $attendanceRate = $totalAttendance > 0
                ? round(($presentAttendance / $totalAttendance) * 100, 2)
                : 0.0;

            $groupIncome = $totalIncome > 0 && $totalActive > 0
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
