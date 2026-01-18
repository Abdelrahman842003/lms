<?php

namespace App\Services\Teacher;

use App\Models\Grade;
use App\Traits\HasAcademyFilter;

class GradeService
{
    use HasAcademyFilter;

    public function getGrades($teacher, int $perPage = 10, array $filters = [], ?string $academyId = null)
    {
        $query = $teacher->grades()
            ->withCount(['groups', 'enrollments'])
            ->latest()
            ->filter($filters);

        // Apply direct academy filter (grades have academy_id column)
        $query = $this->applyDirectAcademyFilter($query, $academyId);

        return $query->paginate($perPage);
    }

    public function createGrade($teacher, array $data)
    {
        return $teacher->grades()->create($data);
    }

    public function updateGrade(Grade $grade, array $data)
    {
        $grade->update($data);
        return $grade;
    }

    public function deleteGrade(Grade $grade)
    {
        return $grade->delete();
    }
}
