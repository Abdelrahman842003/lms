<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\Repositories\Contracts;

use App\Domains\Enrollments\Models\Group;
use App\Domains\Enrollments\DTOs\CreateGroupDTO;
use Illuminate\Pagination\LengthAwarePaginator;

interface GroupRepository
{
    public function create(CreateGroupDTO $dto): Group;

    public function findById(int|string $id): ?Group;

    public function update(Group $group, array $data): Group;

    public function delete(Group $group): bool;

    public function getByTeacher(int $teacherId, int $perPage = 15): LengthAwarePaginator;

    public function getByOrganization(int $orgId, int $perPage = 15): LengthAwarePaginator;

    public function countByTeacher(int $teacherId): int;
}
