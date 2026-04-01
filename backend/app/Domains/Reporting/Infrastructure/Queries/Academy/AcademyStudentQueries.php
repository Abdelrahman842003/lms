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

    public function getTotalStudents(Academy $academy): int
    {
        return Enrollment::where('academy_id', $academy->id)
            ->distinct('student_id')
            ->count('student_id');
    }

    public function getActiveStudents(Academy $academy): int
    {
        return Enrollment::where('academy_id', $academy->id)
            ->where('is_active', true)
            ->distinct('student_id')
            ->count('student_id');
    }

    public function getNewStudents(Academy $academy, ReportingPeriod $period): int
    {
        return Enrollment::where('academy_id', $academy->id)
            ->whereBetween('created_at', [
                $period->startAt->toDateTimeString(),
                $period->endAt->toDateTimeString(),
            ])
            ->distinct('student_id')
            ->count('student_id');
    }

    public function getInactiveStudents(Academy $academy): int
    {
        return $this->getTotalStudents($academy) - $this->getActiveStudents($academy);
    }

    public function getStudentsByGrade(Academy $academy): array
    {
        $rows = Enrollment::where('enrollments.academy_id', $academy->id)
            ->join('grades', 'enrollments.grade_id', '=', 'grades.id')
            ->select('grades.name as grade', DB::raw('COUNT(DISTINCT enrollments.student_id) as count'))
            ->groupBy('grades.id', 'grades.name')
            ->get();

        return $rows->map(fn ($row) => [
            'grade' => $row->grade,
            'count' => (int) $row->count,
        ])->all();
    }

    public function getStudentsByGroup(Academy $academy): array
    {
        $rows = Enrollment::where('enrollments.academy_id', $academy->id)
            ->join('groups', 'enrollments.group_id', '=', 'groups.id')
            ->leftJoin('teachers', 'groups.teacher_id', '=', 'teachers.id')
            ->select(
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

    public function getStudentsByTeacher(Academy $academy): array
    {
        $rows = Enrollment::where('enrollments.academy_id', $academy->id)
            ->join('teachers', 'enrollments.teacher_id', '=', 'teachers.id')
            ->select('teachers.name as teacher', DB::raw('COUNT(DISTINCT enrollments.student_id) as count'))
            ->groupBy('teachers.id', 'teachers.name')
            ->get();

        return $rows->map(fn ($row) => [
            'teacher' => $row->teacher,
            'count' => (int) $row->count,
        ])->all();
    }

    public function getActiveVsInactive(Academy $academy): array
    {
        return [
            'active' => $this->getActiveStudents($academy),
            'inactive' => $this->getInactiveStudents($academy),
        ];
    }

    public function getNewStudentsOverTime(Academy $academy, ReportingPeriod $period): array
    {
        $rows = Enrollment::where('academy_id', $academy->id)
            ->whereBetween('created_at', [
                $period->startAt->toDateTimeString(),
                $period->endAt->toDateTimeString(),
            ])
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(DISTINCT student_id) as count')
            )
            ->groupBy(DB::raw('DATE(created_at)'))
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
            ->when($filters->teacherId, fn ($q) => $q->where('enrollments.teacher_id', $filters->teacherId))
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
}
