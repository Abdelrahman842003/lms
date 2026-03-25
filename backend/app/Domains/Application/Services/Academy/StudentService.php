<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Academy;

use App\Domains\Application\Exceptions\DomainException;
use App\Domains\Auth\DTOs\StudentData;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Subscriptions\Exceptions\QuotaExceededException;
use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class StudentService
{
    public function getStudents(Academy $academy, array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        $status = $filters['status'] ?? null;
        $search = $filters['search'] ?? null;

        $query = Student::whereHas('enrollments', function ($q) use ($academy, $status) {
            $q->where('academy_id', $academy->id);
            
            if ($status === 'active') {
                $q->where('is_active', true);
            } elseif ($status === 'inactive') {
                $q->where('is_active', false);
            }
        })
        ->with(['enrollments' => function ($q) use ($academy) {
            $q->where('academy_id', $academy->id)
            ->with(['teacher', 'grade', 'group']);
        }]);

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        return $query->latest()->paginate($perPage);
    }

    public function createStudent(Academy $academy, StudentData $data): array
    {
        // Verify teacher belongs to academy
        $teacher = Teacher::where('id', $data->teacherId)
            ->whereHas('academies', function ($q) use ($academy) {
                $q->where('academy_id', $academy->id)
                  ->where('academy_teacher.is_active', true);
            })->firstOrFail();

        // Check if plan is expired
        if ($academy->plan_expires_at && now()->gt($academy->plan_expires_at)) {
            throw new DomainException('عفواً، لقد انتهت صلاحية باقتك. يرجى تجديد الاشتراك.');
        }

        // Check student limit
        if (!$academy->is_unlimited_students && $academy->plan_max_students !== null) {
            $currentCount = $this->getActiveStudentsCount($academy);
            $maxAllowed = $academy->plan_max_students;

            if ($currentCount >= $maxAllowed) {
                throw new QuotaExceededException(
                    message: "عفواً، لقد وصلت للحد الأقصى من الطلاب ({$maxAllowed}).",
                    currentCount: $currentCount,
                    maxAllowed: $maxAllowed,
                    remainingSeats: 0
                );
            }
        }

        return DB::transaction(function () use ($teacher, $data, $academy) {
            $isNewStudent = false;
            $student = null;

            if ($data->phone) {
                $student = Student::where('phone', $data->phone)->first();
            }

            if (!$student) {
                $isNewStudent = true;
                $studentData = [
                    'name' => $data->name,
                    'phone' => $data->phone,
                    'parent_phone' => $data->parentPhone,
                    'gender' => $data->gender,
                    'education_type' => $data->educationType,
                    'location' => $data->location,
                ];
                
                if ($data->password) {
                    $studentData['password'] = Hash::make($data->password);
                }

                $student = Student::create($studentData);
            }

            // Check if already enrolled with this teacher IN THIS ACADEMY
            $enrollment = Enrollment::where('student_id', $student->id)
                ->where('teacher_id', $teacher->id)
                ->where('academy_id', $academy->id)
                ->with(['academy:id,trial_period_days', 'teacher:id,trial_period_days'])
                ->first();

            if ($enrollment) {
                // Update existing enrollment
                $enrollment->update([
                    'grade_id' => $data->gradeId,
                    'group_id' => $data->groupId,
                    'is_active' => true,
                    // We don't overwrite joined_at to keep history
                ]);
            } else {
                $enrollment = Enrollment::create([
                    'student_id' => $student->id,
                    'teacher_id' => $teacher->id,
                    'academy_id' => $academy->id,
                    'grade_id' => $data->gradeId,
                    'group_id' => $data->groupId,
                    'is_active' => true,
                    'joined_at' => now(),
                ]);
            }

            return [
                'student' => $student,
                'enrollment' => $enrollment,
                'is_new_student' => $isNewStudent,
            ];
        });
    }

    public function updateStudent(Academy $academy, Enrollment $enrollment, StudentData $data): array
    {
        // Update student data
        $studentData = array_filter([
            'name' => $data->name,
            'phone' => $data->phone,
            'parent_phone' => $data->parentPhone,
            'gender' => $data->gender,
            'education_type' => $data->educationType,
            'location' => $data->location,
        ], fn($value) => $value !== null);

        if ($data->password) {
            $studentData['password'] = Hash::make($data->password);
        }

        if (!empty($studentData)) {
            $enrollment->student->update($studentData);
        }

        // Update enrollment data
        $enrollmentData = array_filter([
            'grade_id' => $data->gradeId,
            'group_id' => $data->groupId,
        ], fn($value) => $value !== null);

        if (!empty($enrollmentData)) {
            $enrollment->update($enrollmentData);
        }

        $enrollment->refresh();
        $enrollment->load(['student', 'grade', 'group']);

        return [
            'student' => $enrollment->student,
            'enrollment' => $enrollment,
        ];
    }

    public function deleteEnrollment(Enrollment $enrollment): void
    {
        $enrollment->delete();
    }

    public function toggleStatus(Enrollment $enrollment): Enrollment
    {
        $enrollment->update(['is_active' => !$enrollment->is_active]);
        return $enrollment;
    }

    public function getStatistics(Academy $academy): array
    {
        $baseQuery = Enrollment::whereHas('teacher', function ($q) use ($academy) {
            $q->whereHas('academies', function ($q2) use ($academy) {
                $q2->where('academy_id', $academy->id);
            });
        })->with(['academy:id,trial_period_days', 'teacher:id,trial_period_days']);

        // Get unique students count
        $totalStudents = Student::whereHas('enrollments.teacher.academies', function ($q) use ($academy) {
            $q->where('academy_id', $academy->id);
        })->count();

        $activeStudents = Student::whereHas('enrollments', function ($q) use ($academy) {
            $q->where('is_active', true)
              ->whereHas('teacher.academies', function ($q2) use ($academy) {
                  $q2->where('academy_id', $academy->id);
              });
        })->count();

        return [
            'total_enrollments' => $baseQuery->count(),
            'active_enrollments' => (clone $baseQuery)->where('is_active', true)->count(),
            'inactive_enrollments' => (clone $baseQuery)->where('is_active', false)->count(),
            'total_students' => $totalStudents,
            'active_students' => $activeStudents,
            'inactive_students' => $totalStudents - $activeStudents,
        ];
    }

    /**
     * Get active students count for academy
     */
    private function getActiveStudentsCount(Academy $academy): int
    {
        return Student::whereHas('enrollments', function ($q) use ($academy) {
            $q->where('is_active', true)
              ->where('academy_id', $academy->id);
        })->count();
    }
}
