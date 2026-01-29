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
        // Apply context filter (Academy or Independent)
        if (!$academyId) {
            $query->whereRaw('1 = 0');
        } elseif ($academyId === 'independent') {
            // Independent: Must have NO academy_id AND (No Grade OR Independent Grade)
            $query->whereNull('academy_id')
                  ->where(function ($q) {
                      $q->whereNull('grade_id')
                        ->orWhereHas('grade', function ($g) {
                            $g->whereNull('academy_id');
                        });
                  });
        } else {
            // Academy: Must have matches academy_id OR matches Grade's academy_id
            $query->where(function ($q) use ($academyId) {
                $q->where('academy_id', $academyId)
                  ->orWhereHas('grade', function ($g) use ($academyId) {
                      $g->where('academy_id', $academyId);
                  });
            });
        }

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
