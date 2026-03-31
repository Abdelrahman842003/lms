<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Infrastructure\Queries\Academy;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Lectures\Models\Attendance;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Reporting\Domain\ValueObjects\ReportingPeriod;
use Illuminate\Support\Facades\DB;

final class AcademyTeacherQueries
{
    public function getTotalTeachers(Academy $academy): int
    {
        return $academy->teachers()->count();
    }

    public function getActiveTeachers(Academy $academy): int
    {
        return $academy->activeTeachers()->count();
    }

    public function getTeacherStudentLoad(Academy $academy): array
    {
        $rows = Enrollment::where('academy_id', $academy->id)
            ->join('teachers', 'enrollments.teacher_id', '=', 'teachers.id')
            ->select(
                'teachers.id as teacher_id',
                'teachers.name as teacher_name',
                DB::raw('COUNT(DISTINCT enrollments.student_id) as linked_students'),
                DB::raw('COUNT(DISTINCT CASE WHEN enrollments.is_active = 1 THEN enrollments.student_id END) as active_students'),
            )
            ->groupBy('teachers.id', 'teachers.name')
            ->get();

        return $rows->map(fn ($row) => [
            'teacher_id' => $row->teacher_id,
            'teacher_name' => $row->teacher_name,
            'linked_students' => (int) $row->linked_students,
            'active_students' => (int) $row->active_students,
        ])->all();
    }

    public function getTeacherPerformanceMetrics(Academy $academy, ReportingPeriod $period): array
    {
        $teachers = $academy->activeTeachers()->get();

        $rows = [];
        foreach ($teachers as $teacher) {
            $linkedStudents = Enrollment::where('academy_id', $academy->id)
                ->where('teacher_id', $teacher->id)
                ->distinct('student_id')
                ->count('student_id');

            $activeStudents = Enrollment::where('academy_id', $academy->id)
                ->where('teacher_id', $teacher->id)
                ->where('is_active', true)
                ->distinct('student_id')
                ->count('student_id');

            $totalAttendances = Attendance::whereHas('lecture', function ($q) use ($academy, $teacher, $period) {
                $q->where('academy_id', $academy->id)
                    ->where('teacher_id', $teacher->id)
                    ->whereBetween('start_time', [
                        $period->startAt->toDateTimeString(),
                        $period->endAt->toDateTimeString(),
                    ]);
            })->count();

            $presentAttendances = Attendance::whereHas('lecture', function ($q) use ($academy, $teacher, $period) {
                $q->where('academy_id', $academy->id)
                    ->where('teacher_id', $teacher->id)
                    ->whereBetween('start_time', [
                        $period->startAt->toDateTimeString(),
                        $period->endAt->toDateTimeString(),
                    ]);
            })->where('status', 'present')->count();

            $attendancePct = $totalAttendances > 0
                ? round(($presentAttendances / $totalAttendances) * 100, 2)
                : 0;

            $groupsCount = $teacher->groups()->where('academy_id', $academy->id)->count();

            $deliveredSessions = Lecture::where('academy_id', $academy->id)
                ->where('teacher_id', $teacher->id)
                ->where('is_active', true)
                ->whereBetween('start_time', [
                    $period->startAt->toDateTimeString(),
                    $period->endAt->toDateTimeString(),
                ])
                ->where('status', '!=', 'cancelled')
                ->count();

            $rows[] = [
                'teacher_name' => $teacher->name,
                'linked_students' => $linkedStudents,
                'active_students' => $activeStudents,
                'attendance_pct' => $attendancePct,
                'groups_count' => $groupsCount,
                'delivered_sessions' => $deliveredSessions,
            ];
        }

        return $rows;
    }

    public function getTeacherAttendanceRate(Academy $academy, string $teacherId, ReportingPeriod $period): float
    {
        $total = Attendance::whereHas('lecture', function ($q) use ($academy, $teacherId, $period) {
            $q->where('academy_id', $academy->id)
                ->where('teacher_id', $teacherId)
                ->whereBetween('start_time', [
                    $period->startAt->toDateTimeString(),
                    $period->endAt->toDateTimeString(),
                ]);
        })->count();

        if ($total === 0) {
            return 0.0;
        }

        $present = Attendance::whereHas('lecture', function ($q) use ($academy, $teacherId, $period) {
            $q->where('academy_id', $academy->id)
                ->where('teacher_id', $teacherId)
                ->whereBetween('start_time', [
                    $period->startAt->toDateTimeString(),
                    $period->endAt->toDateTimeString(),
                ]);
        })->where('status', 'present')->count();

        return round(($present / $total) * 100, 2);
    }
}
