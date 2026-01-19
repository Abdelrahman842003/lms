<?php

declare(strict_types=1);

namespace App\Services\Teacher;

use App\DTOs\Teacher\GroupData;
use App\Models\Group;
use App\Models\Teacher;
use App\Traits\HasAcademyFilter;
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
        $query = $this->applyDirectAcademyFilter($query, $academyId);

        return $query->paginate($perPage);
    }

    public function createGroup(Teacher $teacher, GroupData $data): Group
    {
        return $teacher->groups()->create($data->toArray());
    }

    public function updateGroup(Group $group, GroupData $data): Group
    {
        $group->update($data->toArray());
        return $group;
    }

    public function deleteGroup(Group $group): ?bool
    {
        return $group->delete();
    }
}
