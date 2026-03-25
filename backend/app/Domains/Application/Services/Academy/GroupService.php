<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Academy;

use App\Domains\Application\Exceptions\DomainException;
use App\Domains\Enrollments\DTOs\GroupData;
use App\Domains\Enrollments\Models\Group;
use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use Illuminate\Pagination\LengthAwarePaginator;

class GroupService
{
    public function getGroups(Academy $academy, array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        $query = Group::where(function ($query) use ($academy) {
            // Get groups that belong to this academy directly (created by academy)
            $query->where('academy_id', $academy->id);
        });

        return $query->when(isset($filters['search']), function ($query) use ($filters) {
            $query->where('name', 'like', "%{$filters['search']}%");
        })
        ->when(isset($filters['grade_id']), function ($query) use ($filters) {
            $query->where('grade_id', $filters['grade_id']);
        })
        ->when(isset($filters['grade_name']), function ($query) use ($filters) {
            $query->whereHas('grade', function ($q) use ($filters) {
                $q->where('name', $filters['grade_name']);
            });
        })
        ->when(isset($filters['teacher_id']), function ($query) use ($filters) {
            $query->where('teacher_id', $filters['teacher_id']);
        })
        ->with(['teacher', 'grade'])
        ->withCount('enrollments')
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

        // If grade_id is provided, verify it belongs to the teacher OR the academy
        if ($data->gradeId) {
            $grade = \App\Domains\Enrollments\Models\Grade::where('id', $data->gradeId)
                ->where(function ($query) use ($teacher, $academy) {
                    $query->where('teacher_id', $teacher->id)
                          ->orWhere('academy_id', $academy->id);
                })->first();

            if (!$grade) {
                throw new DomainException('الصف الدراسي المختار غير متاح لهذا المدرس أو الأكاديمية');
            }
        }

        // Create the group with academy_id
        $groupData = $data->toArray();
        $groupData['academy_id'] = $academy->id;

        $group = $teacher->groups()->create($groupData);
        
        // Load relationships and counts
        $group->load(['teacher', 'grade'])->loadCount('enrollments');

        return $group;
    }

    public function updateGroup(Academy $academy, Group $group, GroupData $data): Group
    {
        // If grade_id is changing, verify it belongs to the SAME teacher OR the academy
        if ($data->gradeId && $data->gradeId !== $group->grade_id) {
            $grade = \App\Domains\Enrollments\Models\Grade::where('id', $data->gradeId)
                ->where(function ($query) use ($group, $academy) {
                    $query->where('teacher_id', $group->teacher_id)
                          ->orWhere('academy_id', $academy->id);
                })->first();

            if (!$grade) {
                throw new DomainException('الصف الدراسي المختار غير متاح لهذا المدرس أو الأكاديمية');
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
