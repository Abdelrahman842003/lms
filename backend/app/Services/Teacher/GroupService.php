<?php

namespace App\Services\Teacher;

use App\Models\Group;
use App\Traits\HasAcademyFilter;

class GroupService
{
    use HasAcademyFilter;

    public function getGroups($teacher, int $perPage = 10, array $filters = [], ?string $academyId = null)
    {
        $query = $teacher->groups()
            ->with(['grade'])
            ->withCount('enrollments')
            ->latest()
            ->filter($filters);

        // Apply academy filter via grade relationship
        $query = $this->applyAcademyFilter($query, $academyId, 'grade');

        return $query->paginate($perPage);
    }

    public function createGroup($teacher, array $data)
    {
        return $teacher->groups()->create($data);
    }

    public function updateGroup(Group $group, array $data)
    {
        $group->update($data);
        return $group;
    }

    public function deleteGroup(Group $group)
    {
        return $group->delete();
    }
}
