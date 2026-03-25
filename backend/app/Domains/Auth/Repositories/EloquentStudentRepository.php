<?php

declare(strict_types=1);

namespace App\Domains\Auth\Repositories;

use App\Domains\Auth\Models\Student;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Eloquent Student Repository Implementation
 *
 * Implements the Repository Pattern using Laravel's Eloquent ORM.
 * This class handles all data access operations for Student entities,
 * keeping the data layer separate from business logic.
 *
 * @see https://laravel.com/docs/12.x/eloquent Eloquent ORM
 */
class EloquentStudentRepository implements StudentRepositoryInterface
{
    /**
     * Find a student by their primary key
     */
    public function find(string $id): ?Student
    {
        return Student::find($id);
    }

    /**
     * Find a student by phone number
     */
    public function findByPhone(string $phone): ?Student
    {
        return Student::where('phone', $phone)->first();
    }

    /**
     * Find a student by phone or fail with exception
     */
    public function findByPhoneOrFail(string $phone): Student
    {
        return Student::where('phone', $phone)->firstOrFail();
    }

    /**
     * Get all students
     */
    public function all(): Collection
    {
        return Student::all();
    }

    /**
     * Get paginated students with filters
     *
     * @param array $filters Available filters: search, status, academy_id, teacher_id, grade_id, group_id
     * @param int $perPage Number of items per page
     */
    public function paginate(array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        $query = Student::query()->with(['enrollments.grade', 'enrollments.group']);

        $this->applyFilters($query, $filters);

        return $query->latest()->paginate($perPage);
    }

    /**
     * Get students for a specific academy with filters
     */
    public function getForAcademy(string $academyId, array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        $query = Student::whereHas('enrollments', function ($q) use ($academyId, $filters) {
            $q->where('academy_id', $academyId);

            $status = $filters['status'] ?? null;
            if ($status === 'active') {
                $q->where('is_active', true);
            } elseif ($status === 'inactive') {
                $q->where('is_active', false);
            }
        })
        ->with(['enrollments' => function ($q) use ($academyId) {
            $q->where('academy_id', $academyId)
              ->with(['teacher', 'grade', 'group']);
        }]);

        $this->applySearchFilter($query, $filters['search'] ?? null);

        return $query->latest()->paginate($perPage);
    }

    /**
     * Get students for a specific teacher with filters
     */
    public function getForTeacher(string $teacherId, array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        $query = Student::whereHas('enrollments', function ($q) use ($teacherId, $filters) {
            $q->where('teacher_id', $teacherId);

            $status = $filters['status'] ?? null;
            if ($status === 'active') {
                $q->where('is_active', true);
            } elseif ($status === 'inactive') {
                $q->where('is_active', false);
            }
        })
        ->with(['enrollments' => function ($q) use ($teacherId) {
            $q->where('teacher_id', $teacherId)
              ->with(['grade', 'group']);
        }]);

        $this->applySearchFilter($query, $filters['search'] ?? null);

        return $query->latest()->paginate($perPage);
    }

    /**
     * Create a new student
     */
    public function create(array $data): Student
    {
        return Student::create($data);
    }

    /**
     * Update an existing student
     */
    public function update(Student $student, array $data): Student
    {
        $student->update($data);
        return $student->fresh();
    }

    /**
     * Delete a student
     */
    public function delete(Student $student): bool
    {
        return $student->delete();
    }

    /**
     * Restore a soft-deleted student
     */
    public function restore(Student $student): bool
    {
        return $student->restore();
    }

    /**
     * Get count of active students for a teacher
     */
    public function countActiveForTeacher(string $teacherId): int
    {
        return Student::whereHas('enrollments', function ($q) use ($teacherId) {
            $q->where('teacher_id', $teacherId)
              ->where('is_active', true);
        })->count();
    }

    /**
     * Get count of active students for an academy
     */
    public function countActiveForAcademy(string $academyId): int
    {
        return Student::whereHas('enrollments', function ($q) use ($academyId) {
            $q->where('academy_id', $academyId)
              ->where('is_active', true);
        })->count();
    }

    /**
     * Check if student exists with given phone
     */
    public function existsByPhone(string $phone): bool
    {
        return Student::where('phone', $phone)->exists();
    }

    /**
     * Get students by IDs
     */
    public function findByIds(array $ids): Collection
    {
        return Student::whereIn('id', $ids)->get();
    }

    /**
     * Apply filters to the query
     */
    protected function applyFilters($query, array $filters): void
    {
        $this->applySearchFilter($query, $filters['search'] ?? null);
        $this->applyStatusFilter($query, $filters['status'] ?? null);
        $this->applyAcademyFilter($query, $filters['academy_id'] ?? null);
        $this->applyTeacherFilter($query, $filters['teacher_id'] ?? null);
        $this->applyGradeFilter($query, $filters['grade_id'] ?? null);
        $this->applyGroupFilter($query, $filters['group_id'] ?? null);
    }

    /**
     * Apply search filter
     */
    protected function applySearchFilter($query, ?string $search): void
    {
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('parent_phone', 'like', "%{$search}%");
            });
        }
    }

    /**
     * Apply status filter
     */
    protected function applyStatusFilter($query, ?string $status): void
    {
        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        }
    }

    /**
     * Apply academy filter
     */
    protected function applyAcademyFilter($query, ?string $academyId): void
    {
        if ($academyId) {
            $query->whereHas('enrollments', function ($q) use ($academyId) {
                $q->where('academy_id', $academyId);
            });
        }
    }

    /**
     * Apply teacher filter
     */
    protected function applyTeacherFilter($query, ?string $teacherId): void
    {
        if ($teacherId) {
            $query->whereHas('enrollments', function ($q) use ($teacherId) {
                $q->where('teacher_id', $teacherId);
            });
        }
    }

    /**
     * Apply grade filter
     */
    protected function applyGradeFilter($query, ?string $gradeId): void
    {
        if ($gradeId) {
            $query->whereHas('enrollments', function ($q) use ($gradeId) {
                $q->where('grade_id', $gradeId);
            });
        }
    }

    /**
     * Apply group filter
     */
    protected function applyGroupFilter($query, ?string $groupId): void
    {
        if ($groupId) {
            $query->whereHas('enrollments', function ($q) use ($groupId) {
                $q->where('group_id', $groupId);
            });
        }
    }
}
