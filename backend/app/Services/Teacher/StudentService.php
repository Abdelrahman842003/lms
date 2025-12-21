<?php

namespace App\Services\Teacher;

use App\Models\Student;
use App\Models\Enrollment;
use App\Models\StudentActivityLog;
use App\Models\Teacher;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class StudentService
{
    /**
     * Get students for a teacher (via enrollments)
     */
    public function getStudents($teacher, $perPage = 10, $search = null, $status = null)
    {
        $query = Enrollment::with(['student', 'grade', 'group'])
            ->where('teacher_id', $teacher->id)
            ->filter(['search' => $search, 'status' => $status])
            ->latest();

        return $query->paginate($perPage);
    }

    /**
     * Create or attach a student to a teacher
     * Smart flow: if student exists (by phone), attach; otherwise create
     */
    public function createStudent(Teacher $teacher, array $data): array
    {
        return DB::transaction(function () use ($teacher, $data) {
            $existingStudent = null;
            $isNewStudent = true;

            // Check if student exists by phone
            if (!empty($data['phone'])) {
                $existingStudent = Student::findByPhone($data['phone']);
            }

            if ($existingStudent) {
                // Check if already enrolled with this teacher
                $existingEnrollment = Enrollment::where('student_id', $existingStudent->id)
                    ->where('teacher_id', $teacher->id)
                    ->first();

                if ($existingEnrollment) {
                    // Reactivate if soft deleted
                    if ($existingEnrollment->trashed()) {
                        $existingEnrollment->restore();
                        $existingEnrollment->update(['is_active' => true]);
                    }
                    
                    return [
                        'student' => $existingStudent,
                        'enrollment' => $existingEnrollment,
                        'is_new_student' => false,
                        'was_already_enrolled' => true,
                    ];
                }

                $student = $existingStudent;
                $isNewStudent = false;
            } else {
                // Create new student
                $student = Student::create([
                    'name' => $data['name'],
                    'password' => Hash::make($data['password']),
                    'phone' => $data['phone'] ?? null,
                    'parent_phone' => $data['parent_phone'] ?? null,
                    'gender' => $data['gender'] ?? 'male',
                    'education_type' => $data['education_type'] ?? null,
                    'location' => $data['location'] ?? null,
                ]);
            }

            // Create enrollment
            $enrollment = Enrollment::create([
                'student_id' => $student->id,
                'teacher_id' => $teacher->id,
                'grade_id' => $data['grade_id'] ?? null,
                'group_id' => $data['group_id'] ?? null,
                'balance' => $data['balance'] ?? 0,
                'is_active' => true,
            ]);

            // Log activity
            StudentActivityLog::log(
                $student->id,
                StudentActivityLog::ACTION_ENROLLED,
                $enrollment->id,
                ['teacher_id' => $teacher->id, 'is_new_student' => $isNewStudent],
                'Teacher',
                $teacher->id
            );

            // Initialize gamification points
            \App\Models\StudentPoint::getOrCreate($student->id, $teacher->id);

            return [
                'student' => $student,
                'enrollment' => $enrollment,
                'is_new_student' => $isNewStudent,
                'was_already_enrolled' => false,
            ];
        });
    }

    /**
     * Search for existing student by phone (for smart enrollment)
     * Uses Redis cache with phone index for fast lookups
     */
    public function searchByPhone(string $phone): ?Student
    {
        // Try to get from cache first
        $cachedId = \App\Services\Infrastructure\CacheService::getStudentIdByPhone($phone);
        
        if ($cachedId) {
            $cachedProfile = \App\Services\Infrastructure\CacheService::getStudentProfile($cachedId);
            if ($cachedProfile) {
                // Return cached student as model
                return Student::find($cachedId);
            }
        }
        
        // Not in cache, get from database
        $student = Student::findByPhone($phone);
        
        if ($student) {
            // Cache for future lookups
            \App\Services\Infrastructure\CacheService::cacheStudent(
                $student->id,
                $student->phone,
                $student->toArray()
            );
        }
        
        return $student;
    }

    /**
     * Update enrollment data (teacher-specific)
     */
    public function updateEnrollment(Enrollment $enrollment, array $data): Enrollment
    {
        $oldData = $enrollment->only(['grade_id', 'group_id', 'balance', 'is_active']);
        
        $enrollment->update($data);

        // Log changes
        if (isset($data['grade_id']) && $data['grade_id'] !== $oldData['grade_id']) {
            StudentActivityLog::log(
                $enrollment->student_id,
                StudentActivityLog::ACTION_GRADE_CHANGE,
                $enrollment->id,
                ['old' => $oldData['grade_id'], 'new' => $data['grade_id']]
            );
        }

        if (isset($data['group_id']) && $data['group_id'] !== $oldData['group_id']) {
            StudentActivityLog::log(
                $enrollment->student_id,
                StudentActivityLog::ACTION_GROUP_CHANGE,
                $enrollment->id,
                ['old' => $oldData['group_id'], 'new' => $data['group_id']]
            );
        }

        return $enrollment;
    }

    /**
     * Update student profile data (shared across teachers)
     */
    public function updateStudent(Student $student, array $data): Student
    {
        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        // Only update student-level data
        $studentData = array_intersect_key($data, array_flip([
            'name', 'phone', 'parent_phone', 'gender', 'education_type', 'location', 'password'
        ]));

        if (!empty($studentData)) {
            $student->update($studentData);
        }

        return $student;
    }

    /**
     * Soft delete enrollment (deactivate)
     */
    public function deleteEnrollment(Enrollment $enrollment): bool
    {
        StudentActivityLog::log(
            $enrollment->student_id,
            StudentActivityLog::ACTION_UNENROLLED,
            $enrollment->id,
            ['teacher_id' => $enrollment->teacher_id]
        );

        return $enrollment->delete();
    }

    /**
     * Toggle enrollment status
     */
    public function toggleStatus(Enrollment $enrollment): Enrollment
    {
        $enrollment->update(['is_active' => !$enrollment->is_active]);

        StudentActivityLog::log(
            $enrollment->student_id,
            StudentActivityLog::ACTION_STATUS_CHANGE,
            $enrollment->id,
            ['is_active' => $enrollment->is_active]
        );

        return $enrollment;
    }

    /**
     * Get statistics for teacher dashboard
     */
    public function getStatistics(Teacher $teacher): array
    {
        // Total enrolled students
        $totalStudents = $teacher->enrollments()->count();
        
        // Active students
        $activeStudents = $teacher->activeEnrollments()->count();
        
        // New enrollments this month
        $newStudentsThisMonth = $teacher->enrollments()
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();
            
        // Top Grade by enrollment count
        $topGrade = $teacher->grades()
            ->withCount(['enrollments' => function ($q) use ($teacher) {
                $q->where('teacher_id', $teacher->id);
            }])
            ->orderByDesc('enrollments_count')
            ->first();
            
        // Top Group by enrollment count
        $topGroup = $teacher->groups()
            ->withCount(['enrollments' => function ($q) use ($teacher) {
                $q->where('teacher_id', $teacher->id);
            }])
            ->orderByDesc('enrollments_count')
            ->first();

        // Total Groups
        $totalGroups = $teacher->groups()->count();

        return [
            'total_students' => $totalStudents,
            'active_students' => $activeStudents,
            'new_students_this_month' => $newStudentsThisMonth,
            'top_grade' => $topGrade?->name ?? 'N/A',
            'top_group' => $topGroup?->name ?? 'N/A',
            'total_groups' => $totalGroups,
        ];
    }

    /**
     * Generate slug from Arabic name
     */
    private function generateSlug(string $name): string
    {
        $text = trim($name);
        
        // Specific replacements for common names/prefixes
        $replacements = [
            'عبدال' => 'abdel',
            'عبد ال' => 'abdel',
            'عيد' => 'eid',
            'الله' => 'allah',
            'ال' => 'el',
        ];

        foreach ($replacements as $key => $value) {
            $text = str_replace($key, $value, $text);
        }
        
        $arabicChars = [
            'ا', 'أ', 'إ', 'آ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي', 'ى', 'ة',
            '٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'
        ];
        
        $englishChars = [
            'a', 'a', 'e', 'a', 'b', 't', 'th', 'j', 'h', 'kh', 'd', 'th', 'r', 'z', 's', 'sh', 's', 'd', 't', 'z', 'a', 'gh', 'f', 'q', 'k', 'l', 'm', 'n', 'h', 'w', 'i', 'a', 'a',
            '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
        ];

        for ($i = 0; $i < count($arabicChars); $i++) {
            $text = str_replace($arabicChars[$i], $englishChars[$i], $text);
        }

        return strtolower(preg_replace('/[^a-zA-Z0-9]+/', '_', $text));
    }
}
