<?php

declare(strict_types=1);

namespace App\Services\Academy;

use App\DTOs\Academy\GroupData;
use App\Models\Academy;
use App\Models\Group;
use App\Models\Teacher;
use Illuminate\Pagination\LengthAwarePaginator;

class GroupService
{
    public function getGroups(Academy $academy, array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        return Group::whereHas('teacher', function ($query) use ($academy) {
            $query->whereHas('academies', function ($q) use ($academy) {
                      $q->where('academy_id', $academy->id);
                  });
        })
        ->when(isset($filters['search']), function ($query) use ($filters) {
            $query->where('name', 'like', "%{$filters['search']}%");
        })
        ->when(isset($filters['grade_id']), function ($query) use ($filters) {
            $query->where('grade_id', $filters['grade_id']);
        })
        ->when(isset($filters['teacher_id']), function ($query) use ($filters) {
            $query->where('teacher_id', $filters['teacher_id']);
        })
        ->with(['teacher', 'grade'])
        ->latest()
        ->paginate($perPage);
    }

    public function createGroup(Academy $academy, GroupData $data): Group
    {
        // Verify teacher belongs to academy and is active
        $teacher = Teacher::where('id', $data->teacherId)
            ->where('teachers.status', 'active')
            ->whereHas('academies', function ($q) use ($academy) {
                $q->where('academy_id', $academy->id)
                  ->where('academy_teacher.is_active', true);
            })->firstOrFail();

        // If grade_id is provided, verify it belongs to the teacher
        if ($data->gradeId) {
            $grade = $teacher->grades()->where('id', $data->gradeId)->first();
            if (!$grade) {
                throw new \Exception('الصف الدراسي غير تابع للمدرس المختار');
            }
        }

        return $teacher->groups()->create($data->toArray());
    }

    public function updateGroup(Academy $academy, Group $group, GroupData $data): Group
    {
        // If grade_id is changing, verify it belongs to the SAME teacher
        if ($data->gradeId && $data->gradeId !== $group->grade_id) {
            $grade = $group->teacher->grades()->where('id', $data->gradeId)->first();
            if (!$grade) {
                throw new \Exception('الصف الدراسي غير تابع لمدرس المجموعة');
            }
        }

        $group->update($data->toArray());

        return $group;
    }

    public function deleteGroup(Group $group): void
    {
        $group->delete();
    }
}
