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

        // Apply direct academy filter (groups now have academy_id column)
        $query = $this->applyDirectAcademyFilter($query, $academyId);

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
