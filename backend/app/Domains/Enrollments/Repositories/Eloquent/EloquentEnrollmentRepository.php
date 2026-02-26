<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\Repositories\Eloquent;

use App\Domains\Enrollments\DTOs\CreateEnrollmentDTO;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Enrollments\Repositories\Contracts\EnrollmentRepository;
use Illuminate\Pagination\LengthAwarePaginator;

final class EloquentEnrollmentRepository implements EnrollmentRepository
{
    public function create(CreateEnrollmentDTO $dto): Enrollment
    {
        return Enrollment::query()->create($dto->toArray());
    }

    public function findActiveByStudentTeacher(int $studentId, int $teacherId, ?int $orgId = null): ?Enrollment
    {
        return Enrollment::query()
            ->where('student_id', $studentId)
            ->where('teacher_id', $teacherId)
            ->where('is_active', true)
            ->when($orgId, fn ($q) => $q->where('academy_id', $orgId))
            ->first();
    }

    public function suspend(Enrollment $enrollment, ?string $reason): Enrollment
    {
        $enrollment->update([
            'is_active'    => false,
            'teacher_notes' => $reason,
        ]);

        return $enrollment->refresh();
    }

    public function activate(Enrollment $enrollment): Enrollment
    {
        $enrollment->update(['is_active' => true]);

        return $enrollment->refresh();
    }

    public function getByGroup(int $groupId, int $perPage = 15): LengthAwarePaginator
    {
        return Enrollment::query()
            ->where('group_id', $groupId)
            ->where('is_active', true)
            ->with(['student'])
            ->paginate($perPage);
    }

    public function getByTeacher(int $teacherId, int $perPage = 15): LengthAwarePaginator
    {
        return Enrollment::query()
            ->where('teacher_id', $teacherId)
            ->with(['student', 'group'])
            ->paginate($perPage);
    }

    public function countActiveByTeacher(int $teacherId): int
    {
        return Enrollment::query()
            ->where('teacher_id', $teacherId)
            ->where('is_active', true)
            ->count();
    }

    public function countActiveByOrganization(int $orgId): int
    {
        return Enrollment::query()
            ->where('academy_id', $orgId)
            ->where('is_active', true)
            ->count();
    }
}
