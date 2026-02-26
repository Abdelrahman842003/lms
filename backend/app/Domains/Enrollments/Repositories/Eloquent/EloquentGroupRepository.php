<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\Repositories\Eloquent;

use App\Domains\Enrollments\Models\Group;
use App\Domains\Enrollments\DTOs\CreateGroupDTO;
use App\Domains\Enrollments\Repositories\Contracts\GroupRepository;
use Illuminate\Pagination\LengthAwarePaginator;

final class EloquentGroupRepository implements GroupRepository
{
    public function create(CreateGroupDTO $dto): Group
    {
        return Group::query()->create($dto->toArray());
    }

    public function findById(int|string $id): ?Group
    {
        return Group::query()->find($id);
    }

    public function update(Group $group, array $data): Group
    {
        $group->update($data);
        return $group->refresh();
    }

    public function delete(Group $group): bool
    {
        return (bool) $group->delete();
    }

    public function getByTeacher(int $teacherId, int $perPage = 15): LengthAwarePaginator
    {
        return Group::query()
            ->where('teacher_id', $teacherId)
            ->with(['grade'])
            ->withCount(['enrollments' => fn ($q) => $q->where('is_active', true)])
            ->paginate($perPage);
    }

    public function getByOrganization(int $orgId, int $perPage = 15): LengthAwarePaginator
    {
        return Group::query()
            ->where('academy_id', $orgId)
            ->with(['grade', 'teacher'])
            ->withCount(['enrollments' => fn ($q) => $q->where('is_active', true)])
            ->paginate($perPage);
    }

    public function countByTeacher(int $teacherId): int
    {
        return Group::query()->where('teacher_id', $teacherId)->count();
    }
}
