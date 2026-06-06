<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Infrastructure\Queries\Academy;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Lectures\Models\Attendance;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Reporting\Domain\ValueObjects\AcademyReportFilters;
use App\Domains\Reporting\Domain\ValueObjects\ReportingPeriod;
use Illuminate\Support\Facades\DB;

final class AcademyTeacherQueries
{
    public function getTotalTeachers(Academy $academy, ?AcademyReportFilters $filters = null): int
    {
        $query = $academy->teachers();
        
        if ($filters) {
            $query = $this->applyEntityFilters($query, $filters);
        }

        return $query->count();
    }

    public function getActiveTeachers(Academy $academy, ?AcademyReportFilters $filters = null): int
    {
        $query = $academy->activeTeachers();

        if ($filters) {
            $query = $this->applyEntityFilters($query, $filters);
        }

        return $query->count();
    }

    public function getTeacherStudentLoad(Academy $academy, ?AcademyReportFilters $filters = null): array
    {
        $query = Enrollment::where('enrollments.academy_id', $academy->id)
            ->join('teacher_profiles', 'enrollments.teacher_profile_id', '=', 'teacher_profiles.id')
            ->join('teachers', 'teacher_profiles.teacher_id', '=', 'teachers.id');

        if ($filters) {
            $query = $this->applyEntityFilters($query, $filters);
        }

        $rows = $query->select(
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

    public function getTeacherPerformanceMetrics(Academy $academy, ReportingPeriod $period, ?AcademyReportFilters $filters = null): array
    {
        $teacherQuery = $academy->activeTeachers();
        if ($filters) {
            $teacherQuery = $this->applyEntityFilters($teacherQuery, $filters);
        }
        $teachers = $teacherQuery->get();
        $teacherIds = $teachers->pluck('id');

        // Map teacher IDs to profile IDs for this academy
        $teacherProfileMap = DB::table('teacher_profiles')
            ->where('academy_id', $academy->id)
            ->whereIn('teacher_id', $teacherIds)
            ->pluck('id', 'teacher_id');
        
        $profileIds = $teacherProfileMap->values();

        // Single query: enrollment counts per profile
        $enrollmentQuery = Enrollment::where('academy_id', $academy->id)
            ->whereIn('teacher_profile_id', $profileIds);
        
        if ($filters) {
            $enrollmentQuery = $this->applyEnrollmentFilters($enrollmentQuery, $filters);
        }

        $enrollmentCounts = $enrollmentQuery->select('teacher_profile_id',
                DB::raw('COUNT(DISTINCT student_id) as linked_students'),
                DB::raw('COUNT(DISTINCT CASE WHEN is_active = 1 THEN student_id END) as active_students'),
            )
            ->groupBy('teacher_profile_id')
            ->get()
            ->keyBy('teacher_profile_id');

        // Single query: attendance counts per profile
        $attendanceQuery = Attendance::join('lectures', 'attendances.lecture_id', '=', 'lectures.id')
            ->where('lectures.academy_id', $academy->id)
            ->whereIn('lectures.teacher_profile_id', $profileIds)
            ->whereBetween('lectures.start_time', [$period->startAt->toDateTimeString(), $period->endAt->toDateTimeString()]);
        
        if ($filters) {
            $attendanceQuery = $this->applyAttendanceFilters($attendanceQuery, $filters);
        }

        $attendanceCounts = $attendanceQuery->select('lectures.teacher_profile_id',
                DB::raw('COUNT(*) as total_attendances'),
                DB::raw('SUM(CASE WHEN attendances.status = \'present\' THEN 1 ELSE 0 END) as present_attendances'),
            )
            ->groupBy('lectures.teacher_profile_id')
            ->get()
            ->keyBy('teacher_profile_id');

        // Single query: groups count per profile
        $groupsQuery = DB::table('groups')
            ->whereIn('teacher_profile_id', $profileIds)
            ->where('academy_id', $academy->id);
        
        if ($filters && $filters->groupId) {
            $groupsQuery->where('id', $filters->groupId);
        }

        $groupsCounts = $groupsQuery->select('teacher_profile_id', DB::raw('COUNT(*) as groups_count'))
            ->groupBy('teacher_profile_id')
            ->get()
            ->keyBy('teacher_profile_id');

        // Single query: delivered sessions per profile
        $sessionsQuery = Lecture::where('academy_id', $academy->id)
            ->whereIn('teacher_profile_id', $profileIds)
            ->where('is_active', true)
            ->whereBetween('start_time', [$period->startAt->toDateTimeString(), $period->endAt->toDateTimeString()]);

        if ($filters) {
            $sessionsQuery = $this->applyLectureFilters($sessionsQuery, $filters);
        }

        $sessionsCounts = $sessionsQuery->select('teacher_profile_id', DB::raw('COUNT(*) as delivered_sessions'))
            ->groupBy('teacher_profile_id')
            ->get()
            ->keyBy('teacher_profile_id');

        $rows = [];

        foreach ($teachers as $teacher) {
            $profileId = $teacherProfileMap->get($teacher->id);
            if (!$profileId) continue;

            $enrollments = $enrollmentCounts->get($profileId);
            $linkedStudents = (int) ($enrollments?->linked_students ?? 0);
            $activeStudents = (int) ($enrollments?->active_students ?? 0);

            $attendance = $attendanceCounts->get($profileId);
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
                'groups_count' => (int) ($groupsCounts->get($profileId)?->groups_count ?? 0),
                'delivered_sessions' => (int) ($sessionsCounts->get($profileId)?->delivered_sessions ?? 0),
            ];
        }

        return $rows;
    }

    public function getTeacherAttendanceRate(Academy $academy, string $teacherId, ReportingPeriod $period, ?AcademyReportFilters $filters = null): float
    {
        $baseQuery = function ($q) use ($academy, $teacherId, $period, $filters) {
            $q->where('academy_id', $academy->id)
                ->where('teacher_profile_id', $teacherId)
                ->whereBetween('start_time', [
                    $period->startAt->toDateTimeString(),
                    $period->endAt->toDateTimeString(),
                ]);
            
            if ($filters) {
                $q = $this->applyLectureFilters($q, $filters);
            }
        };

        $total = Attendance::whereHas('lecture', $baseQuery)->count();

        if ($total === 0) {
            return 0.0;
        }

        $present = Attendance::whereHas('lecture', $baseQuery)->where('status', 'present')->count();

        return round(($present / $total) * 100, 2);
    }

    private function applyEntityFilters($query, AcademyReportFilters $filters)
    {
        return $query
            ->when($filters->teacherId, fn ($q) => $q->where('teachers.id', $filters->teacherId));
    }

    private function applyEnrollmentFilters($query, AcademyReportFilters $filters)
    {
        return $query
            ->when($filters->teacherId, fn ($q) => $q->where('teacher_profile_id', $filters->teacherId))
            ->when($filters->groupId, fn ($q) => $q->where('group_id', $filters->groupId))
            ->when($filters->gradeId, fn ($q) => $q->where('grade_id', $filters->gradeId))
            ->when($filters->studentStatus === 'active', fn ($q) => $q->where('is_active', true))
            ->when($filters->studentStatus === 'inactive', fn ($q) => $q->where('is_active', false))
            ->where('created_at', '<=', $filters->period()->endAt->toDateTimeString());
    }

    private function applyLectureFilters($query, AcademyReportFilters $filters)
    {
        return $query
            ->when($filters->teacherId, fn ($q) => $q->where('teacher_profile_id', $filters->teacherId))
            ->when($filters->groupId, fn ($q) => $q->where('group_id', $filters->groupId))
            ->when($filters->gradeId, fn ($q) => $q->where('grade_id', $filters->gradeId))
            ->when($filters->sessionStatus, function ($q) use ($filters) {
                 if ($filters->sessionStatus === 'delivered') return $q->where('is_active', true)->where('start_time', '<=', now());
                 if ($filters->sessionStatus === 'cancelled') return $q->where('is_active', false);
                 return $q;
            });
    }

    private function applyAttendanceFilters($query, AcademyReportFilters $filters)
    {
        return $query
            ->when($filters->teacherId, fn ($q) => $q->where('lectures.teacher_profile_id', $filters->teacherId))
            ->when($filters->groupId, fn ($q) => $q->where('lectures.group_id', $filters->groupId))
            ->when($filters->gradeId, fn ($q) => $q->where('lectures.grade_id', $filters->gradeId));
    }
}
