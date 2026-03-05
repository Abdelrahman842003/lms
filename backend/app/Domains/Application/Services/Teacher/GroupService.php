<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Teacher;

use App\Domains\Enrollments\DTOs\TeacherGroupData;
use App\Domains\Enrollments\Models\Group;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Support\Traits\HasAcademyFilter;
use Illuminate\Pagination\LengthAwarePaginator;

class GroupService
{
    use HasAcademyFilter;

    public function getGroups(Teacher $teacher, int $perPage = 10, array $filters = [], ?string $academyId = null): LengthAwarePaginator
    {
        $query = $teacher->groups()
            ->with(['grade'])
            ->withCount('enrollments')
            ->latest()
            ->filter($filters);

        // Apply direct academy filter (groups now have academy_id column)
        // Strict tenant isolation:
        // independent => academy_id IS NULL
        // academy => academy_id = selected academy id
        $query = $this->applyDirectAcademyFilter($query, $academyId);

        return $query->paginate($perPage);
    }

    public function createGroup(Teacher $teacher, TeacherGroupData $data): Group
    {
        return $teacher->groups()->create($data->toArray());
    }

    public function updateGroup(Group $group, TeacherGroupData $data): Group
    {
        $group->update($data->toArray());
        return $group;
    }

    public function deleteGroup(Group $group): ?bool
    {
        return $group->delete();
    }
}
