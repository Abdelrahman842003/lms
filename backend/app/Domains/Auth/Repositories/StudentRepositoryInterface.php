<?php

declare(strict_types=1);

namespace App\Domains\Auth\Repositories;

use App\Domains\Auth\Models\Student;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Student Repository Interface
 *
 * Implements the Repository Pattern to abstract data access for Student entities.
 * This allows for better testability, separation of concerns, and flexibility
 * in changing data sources without affecting business logic.
 *
 * @see https://laravel.com/docs/12.x/repositories Repository Pattern in Laravel
 * @see https://designpatternsphp.readthedocs.io/en/latest/More/Repository/ Repository Pattern
 */
interface StudentRepositoryInterface
{
    /**
     * Find a student by their primary key
     */
    public function find(string $id): ?Student;

    /**
     * Find a student by phone number
     */
    public function findByPhone(string $phone): ?Student;

    /**
     * Find a student by phone or fail with exception
     */
    public function findByPhoneOrFail(string $phone): Student;

    /**
     * Get all students
     */
    public function all(): Collection;

    /**
     * Get paginated students with filters
     *
     * @param array $filters Available filters: search, status, academy_id, teacher_id, grade_id, group_id
     * @param int $perPage Number of items per page
     */
    public function paginate(array $filters = [], int $perPage = 10): LengthAwarePaginator;

    /**
     * Get students for a specific academy with filters
     */
    public function getForAcademy(string $academyId, array $filters = [], int $perPage = 10): LengthAwarePaginator;

    /**
     * Get students for a specific teacher with filters
     */
    public function getForTeacher(string $teacherId, array $filters = [], int $perPage = 10): LengthAwarePaginator;

    /**
     * Create a new student
     */
    public function create(array $data): Student;

    /**
     * Update an existing student
     */
    public function update(Student $student, array $data): Student;

    /**
     * Delete a student
     */
    public function delete(Student $student): bool;

    /**
     * Restore a soft-deleted student
     */
    public function restore(Student $student): bool;

    /**
     * Get count of active students for a teacher
     */
    public function countActiveForTeacher(string $teacherId): int;

    /**
     * Get count of active students for an academy
     */
    public function countActiveForAcademy(string $academyId): int;

    /**
     * Check if student exists with given phone
     */
    public function existsByPhone(string $phone): bool;

    /**
     * Get students by IDs
     */
    public function findByIds(array $ids): Collection;
}
