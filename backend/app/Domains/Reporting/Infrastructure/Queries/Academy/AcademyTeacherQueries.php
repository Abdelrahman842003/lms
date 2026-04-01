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
        $teacherIds = $academy->activeTeachers()->pluck('teachers.id');

        // Single query: enrollment counts per teacher
        $enrollmentCounts = Enrollment::where('academy_id', $academy->id)
            ->whereIn('teacher_id', $teacherIds)
            ->select('teacher_id',
                DB::raw('COUNT(DISTINCT student_id) as linked_students'),
                DB::raw('COUNT(DISTINCT CASE WHEN is_active = 1 THEN student_id END) as active_students'),
            )
            ->groupBy('teacher_id')
            ->get()
            ->keyBy('teacher_id');

        // Single query: attendance counts per teacher
        $attendanceCounts = Attendance::join('lectures', 'attendances.lecture_id', '=', 'lectures.id')
            ->where('lectures.academy_id', $academy->id)
            ->whereIn('lectures.teacher_id', $teacherIds)
            ->whereBetween('lectures.start_time', [$period->startAt->toDateTimeString(), $period->endAt->toDateTimeString()])
            ->select('lectures.teacher_id',
                DB::raw('COUNT(*) as total_attendances'),
                DB::raw('SUM(CASE WHEN attendances.status = \'present\' THEN 1 ELSE 0 END) as present_attendances'),
            )
            ->groupBy('lectures.teacher_id')
            ->get()
            ->keyBy('teacher_id');

        // Single query: groups count per teacher
        $groupsCounts = DB::table('groups')
            ->whereIn('teacher_id', $teacherIds)
            ->where('academy_id', $academy->id)
            ->select('teacher_id', DB::raw('COUNT(*) as groups_count'))
            ->groupBy('teacher_id')
            ->get()
            ->keyBy('teacher_id');

        // Single query: delivered sessions per teacher
        $sessionsCounts = Lecture::where('academy_id', $academy->id)
            ->whereIn('teacher_id', $teacherIds)
            ->where('is_active', true)
            ->whereBetween('start_time', [$period->startAt->toDateTimeString(), $period->endAt->toDateTimeString()])
            ->select('teacher_id', DB::raw('COUNT(*) as delivered_sessions'))
            ->groupBy('teacher_id')
            ->get()
            ->keyBy('teacher_id');

        $teachers = $academy->activeTeachers()->get();
        $rows = [];

        foreach ($teachers as $teacher) {
            $enrollments = $enrollmentCounts->get($teacher->id);
            $linkedStudents = (int) ($enrollments?->linked_students ?? 0);
            $activeStudents = (int) ($enrollments?->active_students ?? 0);

            $attendance = $attendanceCounts->get($teacher->id);
            $totalAttendances = (int) ($attendance?->total_attendances ?? 0);
            $presentAttendances = (int) ($attendance?->present_attendances ?? 0);

            $attendancePct = $totalAttendances > 0
                ? round(($presentAttendances / $totalAttendances) * 100, 2)
                : 0;

            $rows[] = [
                'teacher_name' => $teacher->name,
                'linked_students' => $linkedStudents,
                'active_students' => $activeStudents,
                'attendance_pct' => $attendancePct,
                'groups_count' => (int) ($groupsCounts->get($teacher->id)?->groups_count ?? 0),
                'delivered_sessions' => (int) ($sessionsCounts->get($teacher->id)?->delivered_sessions ?? 0),
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
