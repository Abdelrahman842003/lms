<?php

namespace App\Services\Teacher;

use App\Models\Group;

class GroupService
{
    public function getGroups($teacher, int $perPage = 10, array $filters = [])
    {
        return $teacher->groups()
            ->with(['grade'])
            ->withCount('enrollments')
            ->latest()
            ->filter($filters)
            ->paginate($perPage);
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
