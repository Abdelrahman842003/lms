<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\Repositories\Contracts;

use App\Domains\Enrollments\DTOs\CreateEnrollmentDTO;
use App\Domains\Enrollments\Models\Enrollment;
use Illuminate\Pagination\LengthAwarePaginator;

interface EnrollmentRepository
{
    public function create(CreateEnrollmentDTO $dto): Enrollment;

    public function findActiveByStudentTeacher(int $studentId, int $teacherId, ?int $orgId = null): ?Enrollment;

    public function suspend(Enrollment $enrollment, ?string $reason): Enrollment;

    public function activate(Enrollment $enrollment): Enrollment;

    public function getByGroup(int $groupId, int $perPage = 15): LengthAwarePaginator;

    public function getByTeacher(int $teacherId, int $perPage = 15): LengthAwarePaginator;

    public function countActiveByTeacher(int $teacherId): int;

    public function countActiveByOrganization(int $orgId): int;
}
