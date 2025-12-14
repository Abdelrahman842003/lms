<?php

namespace App\Services\Teacher;

use App\Models\Grade;

class GradeService
{
    public function getGrades($teacher, int $perPage = 10, array $filters = [])
    {
        return $teacher->grades()
            ->withCount(['groups', 'enrollments'])
            ->latest()
            ->filter($filters)
            ->paginate($perPage);
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
