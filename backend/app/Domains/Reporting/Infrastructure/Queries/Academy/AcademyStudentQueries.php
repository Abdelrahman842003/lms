<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Infrastructure\Queries\Academy;

use App\Domains\Auth\Models\Academy;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Reporting\Domain\ValueObjects\AcademyReportFilters;
use App\Domains\Reporting\Domain\ValueObjects\ReportingPeriod;
use App\Domains\Reporting\Infrastructure\Queries\SharedDateScope;
use Illuminate\Support\Facades\DB;

final class AcademyStudentQueries
{
    public function __construct(
        private readonly SharedDateScope $dateScope,
    ) {}

    public function getTotalStudents(Academy $academy, ?AcademyReportFilters $filters = null): int
    {
        $query = Enrollment::where('enrollments.academy_id', $academy->id);

        if ($filters) {
            $query = $this->applyEntityFilters($query, $filters)
                ->where('enrollments.created_at', '<=', $filters->period()->endAt->toDateTimeString());
        }

        return $query->distinct('enrollments.student_id')
            ->count('enrollments.student_id');
    }

    public function getActiveStudents(Academy $academy, ?AcademyReportFilters $filters = null): int
    {
        $query = Enrollment::where('enrollments.academy_id', $academy->id)
            ->where('enrollments.is_active', true);

        if ($filters) {
            $query = $this->applyEntityFilters($query, $filters)
                ->where('enrollments.created_at', '<=', $filters->period()->endAt->toDateTimeString());
        }

        return $query->distinct('enrollments.student_id')
            ->count('enrollments.student_id');
    }

    public function getNewStudents(Academy $academy, ReportingPeriod $period, ?AcademyReportFilters $filters = null): int
    {
        $query = Enrollment::where('enrollments.academy_id', $academy->id)
            ->whereBetween('enrollments.created_at', [
                $period->startAt->toDateTimeString(),
                $period->endAt->toDateTimeString(),
            ]);

        if ($filters) {
            $query = $this->applyEntityFilters($query, $filters);
        }

        return $query->distinct('enrollments.student_id')
            ->count('enrollments.student_id');
    }

    public function getInactiveStudents(Academy $academy, ?AcademyReportFilters $filters = null): int
    {
        $query = Enrollment::where('enrollments.academy_id', $academy->id)
            ->where('enrollments.is_active', false);

        if ($filters) {
            $query = $this->applyEntityFilters($query, $filters)
                ->where('enrollments.created_at', '<=', $filters->period()->endAt->toDateTimeString());
        }

        return $query->distinct('enrollments.student_id')
            ->count('enrollments.student_id');
    }

    public function getStudentsByGrade(Academy $academy, ?AcademyReportFilters $filters = null): array
    {
        $query = Enrollment::where('enrollments.academy_id', $academy->id)
            ->join('grades', 'enrollments.grade_id', '=', 'grades.id');

        if ($filters) {
            $query = $this->applyEntityFilters($query, $filters);
        }

        $rows = $query->select('grades.name as grade', DB::raw('COUNT(DISTINCT enrollments.student_id) as count'))
            ->groupBy('grades.id', 'grades.name')
            ->get();

        return $rows->map(fn ($row) => [
            'grade' => $row->grade,
            'count' => (int) $row->count,
        ])->all();
    }

    public function getStudentsByGroup(Academy $academy, ?AcademyReportFilters $filters = null): array
    {
        $query = Enrollment::where('enrollments.academy_id', $academy->id)
            ->join('groups', 'enrollments.group_id', '=', 'groups.id')
            ->leftJoin('teacher_profiles', 'groups.teacher_profile_id', '=', 'teacher_profiles.id')
            ->leftJoin('teachers', 'teacher_profiles.teacher_id', '=', 'teachers.id');

        if ($filters) {
            $query = $this->applyEntityFilters($query, $filters);
        }

        $rows = $query->select(
                'groups.name as group_name',
                'teachers.name as teacher_name',
                DB::raw('COUNT(DISTINCT enrollments.student_id) as count')
            )
            ->groupBy('groups.id', 'groups.name', 'teachers.name')
            ->get();

        return $rows->map(fn ($row) => [
            'group' => $row->group_name,
            'teacher' => $row->teacher_name ?? '',
            'count' => (int) $row->count,
        ])->all();
    }

    public function getStudentsByTeacher(Academy $academy, ?AcademyReportFilters $filters = null): array
    {
        $query = Enrollment::where('enrollments.academy_id', $academy->id)
            ->join('teacher_profiles', 'enrollments.teacher_profile_id', '=', 'teacher_profiles.id')
            ->join('teachers', 'teacher_profiles.teacher_id', '=', 'teachers.id');

        if ($filters) {
            $query = $this->applyEntityFilters($query, $filters);
        }

        $rows = $query->select('teachers.name as teacher', DB::raw('COUNT(DISTINCT enrollments.student_id) as count'))
            ->groupBy('teachers.id', 'teachers.name')
            ->get();

        return $rows->map(fn ($row) => [
            'teacher' => $row->teacher,
            'count' => (int) $row->count,
        ])->all();
    }

    public function getActiveVsInactive(Academy $academy, ?AcademyReportFilters $filters = null): array
    {
        return [
            'active' => $this->getActiveStudents($academy, $filters),
            'inactive' => $this->getInactiveStudents($academy, $filters),
        ];
    }

    public function getNewStudentsOverTime(Academy $academy, ReportingPeriod $period, ?AcademyReportFilters $filters = null): array
    {
        $query = Enrollment::where('enrollments.academy_id', $academy->id)
            ->whereBetween('enrollments.created_at', [
                $period->startAt->toDateTimeString(),
                $period->endAt->toDateTimeString(),
            ]);

        if ($filters) {
            $query = $this->applyEntityFilters($query, $filters);
        }

        $rows = $query->select(
                DB::raw('DATE(enrollments.created_at) as date'),
                DB::raw('COUNT(DISTINCT enrollments.student_id) as count')
            )
            ->groupBy(DB::raw('DATE(enrollments.created_at)'))
            ->orderBy('date')
            ->get();

        return $rows->map(fn ($row) => [
            'date' => $row->date,
            'count' => (int) $row->count,
        ])->all();
    }

    public function applyEntityFilters($query, AcademyReportFilters $filters)
    {
        return $query
            ->when($filters->teacherId, function ($q) use ($filters) {
                // We need to join teacher_profiles to filter by actual teacher_id
                if (!$this->isJoined($q, 'teacher_profiles')) {
                    $q->join('teacher_profiles', 'enrollments.teacher_profile_id', '=', 'teacher_profiles.id');
                }
                $q->where('teacher_profiles.teacher_id', $filters->teacherId);
            })
            ->when($filters->gradeId, fn ($q) => $q->where('enrollments.grade_id', $filters->gradeId))
            ->when($filters->groupId, fn ($q) => $q->where('enrollments.group_id', $filters->groupId))
            ->when(
                $filters->studentStatus === 'active',
                fn ($q) => $q->where('enrollments.is_active', true)
            )
            ->when(
                $filters->studentStatus === 'inactive',
                fn ($q) => $q->where('enrollments.is_active', false)
            );
    }

    private function isJoined($query, string $table): bool
    {
        $joins = $query->getQuery()->joins ?? [];
        foreach ($joins as $join) {
            if ($join->table === $table) {
                return true;
            }
        }
        return false;
    }
}
