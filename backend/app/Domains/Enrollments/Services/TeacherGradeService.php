<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\Services;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\DTOs\TeacherGradeData;
use App\Domains\Enrollments\Models\Grade;
use App\Domains\Application\Filters\GradeFilter;
use App\Domains\Application\Traits\HasAcademyFilter;
use Illuminate\Pagination\LengthAwarePaginator;

class TeacherGradeService
{
    use HasAcademyFilter;

    public function getGrades(Teacher $teacher, int $perPage = 10, array $filters = [], ?string $academyId = null): LengthAwarePaginator
    {
        $query = $teacher->grades()
            ->withCount(['groups', 'enrollments'])
            ->latest();

        // Apply filters using Filter class
        (new GradeFilter($filters))->apply($query);

        // Apply direct academy filter (grades have academy_id column)
        $query = $this->applyDirectAcademyFilter($query, $academyId);

        return $query->paginate($perPage);
    }

    public function createGrade(Teacher $teacher, TeacherGradeData $data): Grade
    {
        return $teacher->grades()->create($data->toArray());
    }

    public function updateGrade(Grade $grade, TeacherGradeData $data): Grade
    {
        $grade->update($data->toArray());

        return $grade;
    }

    public function deleteGrade(Grade $grade): ?bool
    {
        return $grade->delete();
    }
}
