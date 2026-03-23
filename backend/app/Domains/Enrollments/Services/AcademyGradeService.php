<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\Services;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\DTOs\GradeData;
use App\Domains\Enrollments\Models\Grade;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class AcademyGradeService
{
    public function getGrades(Academy $academy, array $filters = [], int $perPage = 10)
    {
        // Base query: Grades for all teachers belonging to this academy OR grades created by the academy directly
        // Filter strictly by academy_id to ensure only academy-specific grades are shown
        $query = Grade::where('academy_id', $academy->id)->whereNotNull('academy_id');

        // Filter by teacher_id if provided
        if (isset($filters['teacher_id']) && $filters['teacher_id']) {
            return $query->where('teacher_id', $filters['teacher_id'])
                ->select('id', 'name', 'price', 'teacher_id')
                ->get();
        }

        // 1. Detail View: If filtering by specific grade name
        if (isset($filters['name']) && $filters['name'] !== null && $filters['name'] !== '') {
            return $query->where('name', $filters['name'])
                ->with('teacher')
                ->withCount(['groups', 'enrollments'])
                ->latest()
                ->paginate($perPage);
        }

        // 2. Grouped View: Group by name and aggregate stats using MySQL GROUP BY
        // Use parameter binding to prevent SQL injection
        $academyId = $academy->id;
        $groupedQuery = \DB::table('grades as g')
            ->select([
                'g.id',
                'g.name',
                \DB::raw('COUNT(DISTINCT g.teacher_id) as teachers_count'),
                \DB::raw('(SELECT COUNT(*) FROM groups WHERE grade_id IN (SELECT id FROM grades WHERE name = g.name AND academy_id = ?)) as groups_count'),
                \DB::raw('(SELECT COUNT(*) FROM enrollments WHERE grade_id IN (SELECT id FROM grades WHERE name = g.name AND academy_id = ?)) as students_count'),
                'g.created_at',
            ])
            ->addBinding($academyId, 'select')
            ->addBinding($academyId, 'select')
            ->where('g.academy_id', $academy->id)
            ->whereNotNull('g.academy_id')
            ->groupBy('g.id', 'g.name', 'g.created_at')
            ->orderBy('g.created_at', 'desc');

        return $groupedQuery->paginate($perPage);
    }

    public function createGrade(Academy $academy, GradeData $data): Grade
    {
        // If teacher_id is provided, verify it belongs to academy and is active
        if ($data->teacherId) {
            $teacher = Teacher::where('id', $data->teacherId)
                ->where('teachers.status', 'active')
                ->whereHas('academies', function ($q) use ($academy) {
                    $q->where('academy_id', $academy->id)
                      ->where('academy_teacher.is_active', true);
                })->firstOrFail();

            return $teacher->grades()->create([
                'name' => $data->name,
                'price' => $data->price,
                'academy_id' => $academy->id,
            ]);
        }

        // Create a global grade for this academy
        // Note: Grade model uses HasUuids trait which auto-generates UUIDs
        $grade = Grade::create([
            'name' => $data->name,
            'price' => $data->price,
            'teacher_id' => null,
            'academy_id' => $academy->id,
        ]);

        return $grade;
    }

    public function updateGrade(Academy $academy, Grade $grade, GradeData $data): Grade
    {
        $grade->update([
            'name' => $data->name,
            'price' => $data->price,
        ]);

        return $grade;
    }

    public function deleteGrade(Grade $grade): void
    {
        $grade->delete();
    }

    public function bulkUpdateName(Academy $academy, string $oldName, string $newName): int
    {
        return Grade::where('name', $oldName)
            ->join('teachers', 'grades.teacher_id', '=', 'teachers.id')
            ->join('academy_teacher', function ($join) use ($academy) {
                $join->on('teachers.id', '=', 'academy_teacher.teacher_id')
                     ->where('academy_teacher.academy_id', $academy->id)
                     ->where('academy_teacher.is_active', true);
            })
            ->where('teachers.status', 'active')
            ->update(['grades.name' => $newName]);
    }

    public function bulkDelete(Academy $academy, string $name): int
    {
        return Grade::where('name', $name)
            ->join('teachers', 'grades.teacher_id', '=', 'teachers.id')
            ->join('academy_teacher', function ($join) use ($academy) {
                $join->on('teachers.id', '=', 'academy_teacher.teacher_id')
                     ->where('academy_teacher.academy_id', $academy->id)
                     ->where('academy_teacher.is_active', true);
            })
            ->where('teachers.status', 'active')
            ->delete();
    }
}
