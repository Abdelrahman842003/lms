<?php

declare(strict_types=1);

namespace App\Services\Academy;

use App\DTOs\Academy\GradeData;
use App\Models\Academy;
use App\Models\Grade;
use App\Models\Teacher;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class GradeService
{
    public function getGrades(Academy $academy, array $filters = [], int $perPage = 10)
    {
        // Base query: Grades for all teachers belonging to this academy OR grades created by the academy directly
        $query = Grade::where(function($q) use ($academy) {
            // Grades linked to academy's teachers
            $q->whereHas('teacher', function ($q2) use ($academy) {
                $q2->whereHas('academies', function ($q3) use ($academy) {
                    $q3->where('academy_id', $academy->id);
                });
            })
            // OR grades linked directly to the academy
            ->orWhere('academy_id', $academy->id);
        });

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

        // 2. Grouped View: Group by name and aggregate stats
        // We fetch all to group in PHP as it's cleaner for aggregations across relations
        $grades = $query->withCount(['groups', 'enrollments'])->get();

        $grouped = $grades->groupBy('name')->map(function ($group, $name) {
            return [
                'name' => $name,
                'teachers_count' => $group->pluck('teacher_id')->filter()->unique()->count(),
                'groups_count' => $group->sum('groups_count'),
                'students_count' => $group->sum('enrollments_count'),
                'created_at' => $group->first()->created_at,
            ];
        })->values();

        // Manual Pagination for grouped results
        $page = LengthAwarePaginator::resolveCurrentPage();
        $items = $grouped->slice(($page - 1) * $perPage, $perPage)->values();

        return new LengthAwarePaginator(
            $items,
            $grouped->count(),
            $perPage,
            $page,
            ['path' => LengthAwarePaginator::resolveCurrentPath()]
        );
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
        $grade = new Grade();
        $grade->id = Str::uuid()->toString();
        $grade->name = $data->name;
        $grade->price = $data->price;
        $grade->teacher_id = null;
        $grade->academy_id = $academy->id;
        $grade->save();

        return $grade;
    }

    public function updateGrade(Academy $academy, Grade $grade, GradeData $data): Grade
    {
        // Authorization check is done in Controller or Request usually, but good to have safety here
        // Assuming controller handles authorization for now as per template structure

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
            ->whereHas('teacher', function ($q) use ($academy) {
                $q->where('teachers.status', 'active')
                  ->whereHas('academies', function ($q2) use ($academy) {
                      $q2->where('academy_id', $academy->id)
                         ->where('academy_teacher.is_active', true);
                  });
            })
            ->update(['name' => $newName]);
    }

    public function bulkDelete(Academy $academy, string $name): int
    {
        return Grade::where('name', $name)
            ->whereHas('teacher', function ($q) use ($academy) {
                $q->where('teachers.status', 'active')
                  ->whereHas('academies', function ($q2) use ($academy) {
                      $q2->where('academy_id', $academy->id)
                         ->where('academy_teacher.is_active', true);
                  });
            })
            ->delete();
    }
}
