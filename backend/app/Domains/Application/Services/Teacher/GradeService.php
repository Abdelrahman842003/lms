<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Teacher;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\DTOs\TeacherGradeData;
use App\Domains\Enrollments\Models\Grade;
use App\Domains\Application\Filters\GradeFilter;
use App\Domains\Application\Services\CacheService;
use App\Domains\Application\Traits\HasAcademyFilter;
use Illuminate\Pagination\LengthAwarePaginator;

class GradeService
{
    use HasAcademyFilter;

    public function getGrades(Teacher $teacher, int $perPage = 10, array $filters = [], ?string $academyId = null): LengthAwarePaginator
    {
        $query = $teacher->grades()
            ->withCount(['groups', 'enrollments'])
            ->latest();

        // Apply filters using Filter class
        (new GradeFilter($filters))->apply(
            $query instanceof \Illuminate\Database\Eloquent\Builder 
                ? $query 
                : ($query instanceof \Illuminate\Database\Eloquent\Relations\Relation ? $query->getQuery() : $query)
        );

        // Apply direct academy filter (grades have academy_id column)
        $query = $this->applyDirectAcademyFilter($query, $academyId);

        return $query->paginate($perPage);
    }

    public function createGrade(Teacher $teacher, TeacherGradeData $data): Grade
    {
        $grade = $teacher->grades()->create($data->toArray());
        // Clear cache after creating a grade
        CacheService::forgetTeacherGrades($teacher->id);

        return $grade;
    }

    public function updateGrade(Grade $grade, TeacherGradeData $data): Grade
    {
        $grade->update($data->toArray());
        // Clear cache after updating a grade
        CacheService::forgetTeacherGrades($grade->teacher_id);

        return $grade;
    }

    public function deleteGrade(Grade $grade): ?bool
    {
        $teacherId = $grade->teacher_id;
        $result = $grade->delete();
        // Clear cache after deleting a grade
        if ($result && $teacherId) {
            CacheService::forgetTeacherGrades($teacherId);
        }

        return $result;
    }
}
