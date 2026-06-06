<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Teacher;

use App\Domains\Auth\Models\TeacherProfile;
use App\Domains\Enrollments\DTOs\TeacherGroupData;
use App\Domains\Enrollments\Models\Group;
use App\Domains\Application\Filters\GroupFilter;
use App\Domains\Application\Traits\HasAcademyFilter;
use Illuminate\Pagination\LengthAwarePaginator;

class GroupService
{
    use HasAcademyFilter;

    public function getGroups(TeacherProfile $teacher, int $perPage = 10, array $filters = [], ?string $academyId = null): LengthAwarePaginator
    {
        $query = $teacher->groups()
            ->with(['grade'])
            ->withCount('enrollments')
            ->latest();

        // Apply filters using Filter class
        (new GroupFilter($filters))->apply(
            $query instanceof \Illuminate\Database\Eloquent\Builder 
                ? $query 
                : ($query instanceof \Illuminate\Database\Eloquent\Relations\Relation ? $query->getQuery() : $query)
        );

        // Apply academy filter with compatibility for legacy data:
        // - independent: only pure independent groups
        // - academy: include direct academy groups and groups linked via grade academy
        if ($academyId === 'independent') {
            $query->whereNull('academy_id')
                ->whereDoesntHave('grade', fn ($q) => $q->whereNotNull('academy_id'));
        } elseif ($academyId) {
            $query->where(function ($q) use ($academyId) {
                $q->where('academy_id', $academyId)
                    ->orWhereHas('grade', fn ($g) => $g->where('academy_id', $academyId));
            });
        }

        return $query->paginate($perPage);
    }

    public function createGroup(TeacherProfile $teacher, TeacherGroupData $data): Group
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
