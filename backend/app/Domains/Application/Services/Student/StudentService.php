<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Student;

use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Auth\Models\Student;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class StudentService
{
    /**
     * Login student by phone
     */
    public function login(string $phone, string $password): array|false
    {
        $student = Student::where('phone', $phone)->first();

        if (! $student || ! Hash::check($password, $student->password)) {
            return false;
        }

        // Get list of enrolled teachers
        $teachers = $this->getEnrolledTeachers($student);

        return [
            'user' => $student,
            'teachers' => $teachers,
        ];
    }

    /**
     * Get list of teachers the student is enrolled with
     */
    public function getEnrolledTeachers(Student $student): array
    {
        return $student->enrollments()
            ->with(['teacher:teachers.id,name,avatar_key,teachers.status', 'teacher.tenantPlan', 'grade:id,name', 'group:id,name', 'academy:id,name'])
            ->get()
            ->map(function ($enrollment) {
                $enrollmentStatus = (string) $enrollment->status;
                $isTeacherSuspended = $enrollment->teacher->status === 'suspended';
                $isSubscriptionBlocked = $enrollment->teacher->isSubscriptionBlocked();

                return [
                    'enrollment_id' => $enrollment->id,
                    'teacher_profile_id' => $enrollment->teacher_profile_id,
                    'teacher_name' => $enrollment->teacher->name,
                    'teacher_avatar' => $enrollment->teacher->avatar_url ?? null,
                    'is_teacher_suspended' => $isTeacherSuspended,
                    'is_subscription_blocked' => $isSubscriptionBlocked,
                    'is_suspended' => $isTeacherSuspended,
                    'grade_name' => $enrollment->grade?->name,
                    'group_name' => $enrollment->group?->name,
                    'balance' => $enrollment->balance,
                    'status' => $enrollmentStatus,
                    'days_left' => $enrollment->days_left,
                    'enrolled_at' => $enrollment->created_at,
                    'is_active' => (bool) $enrollment->is_active,
                    'academy_id' => $enrollment->academy_id ? (string) $enrollment->academy_id : null,
                    'academy_name' => $enrollment->academy?->name,
                ];
            })
            ->toArray();
    }

    /**
     * Get list of teachers grouped by academy
     */
    public function getEnrolledTeachersGrouped(Student $student): array
    {
        $enrollments = $student->enrollments()
            ->with([
                'teacher:teachers.id,name,avatar_key,teachers.status',
                'teacher.tenantPlan',
                'teacher.academies:id,name',
                'grade:id,name',
                'group:id,name'
            ])
            ->get();

        $grouped = [
            'academies' => [],
            'independent' => []
        ];

        foreach ($enrollments as $enrollment) {
            $enrollmentStatus = (string) $enrollment->status;
            $isTeacherSuspended = $enrollment->teacher->status === 'suspended';
            $isSubscriptionBlocked = $enrollment->teacher->isSubscriptionBlocked();

            $teacherData = [
                'enrollment_id' => $enrollment->id,
                'teacher_profile_id' => $enrollment->teacher_profile_id,
                'teacher_name' => $enrollment->teacher->name,
                'teacher_avatar' => $enrollment->teacher->avatar_url ?? null,
                'is_teacher_suspended' => $isTeacherSuspended,
                'is_subscription_blocked' => $isSubscriptionBlocked,
                'is_suspended' => $isTeacherSuspended,
                'grade_name' => $enrollment->grade?->name,
                'group_name' => $enrollment->group?->name,
                'balance' => $enrollment->balance,
                'status' => $enrollmentStatus,
                'days_left' => $enrollment->days_left,
                'enrolled_at' => $enrollment->created_at,
                'is_active' => (bool) $enrollment->is_active,
            ];

            // Check if teacher belongs to any academy
            $academies = $enrollment->teacher->academies;
            
            if ($academies->isNotEmpty()) {
                foreach ($academies as $academy) {
                    if (!isset($grouped['academies'][$academy->id])) {
                        $grouped['academies'][$academy->id] = [
                            'academy_id' => $academy->id,
                            'academy_name' => $academy->name,
                            'teachers' => []
                        ];
                    }
                    $grouped['academies'][$academy->id]['teachers'][] = $teacherData;
                }
            } else {
                // Independent teacher
                $grouped['independent'][] = $teacherData;
            }
        }

        // Convert academies to indexed array
        $grouped['academies'] = array_values($grouped['academies']);

        return $grouped;
    }

    /**
     * Get student dashboard for a specific teacher
     */
    public function getTeacherDashboard(Student $student, string $teacherProfileId): array
    {
        $enrollment = $student->enrollments()
            ->with(['teacher', 'grade', 'group'])
            ->where('teacher_profile_id', $teacherProfileId)
            ->where('is_active', true)
            ->firstOrFail();

        $enrollmentStatus = (string) $enrollment->status;
        $isTeacherSuspended = $enrollment->teacher->status === 'suspended';
        $isSubscriptionBlocked = $enrollment->teacher->isSubscriptionBlocked();

        if ($isTeacherSuspended || ($isSubscriptionBlocked && $enrollmentStatus !== 'trial')) {
            abort(403, "لا يمكنك الدخول لهذا المدرس حالياً بسبب حالة الاشتراك. يرجى التواصل مع الإدارة.");
        }

        // Get exams for this teacher
        $examResults = $student->examResults()
            ->whereHas('exam', function ($q) use ($teacherProfileId) {
                $q->where('teacher_profile_id', $teacherProfileId);
            })
            ->with('exam:id,title,date,max_score')
            ->latest()
            ->take(10)
            ->get()
            ->map(function ($result) {
                return [
                    'exam_title' => $result->exam->title,
                    'score' => $result->score,
                    'max_score' => $result->exam->max_score,
                    'percentage' => $result->exam->max_score > 0 
                        ? round(($result->score / $result->exam->max_score) * 100, 1) 
                        : 0,
                    'date' => $result->exam->date,
                ];
            });

        // Get attendance for this teacher
        $attendances = $student->attendances()
            ->whereHas('lecture', function ($q) use ($teacherProfileId) {
                $q->where('teacher_profile_id', $teacherProfileId);
            })
            ->with('lecture:id,title,date')
            ->latest()
            ->take(10)
            ->get()
            ->map(function ($attendance) {
                return [
                    'lecture_title' => $attendance->lecture->title,
                    'status' => $attendance->status,
                    'date' => $attendance->lecture->date,
                ];
            });

        return [
            'enrollment' => [
                'balance' => $enrollment->balance,
                'is_active' => $enrollment->is_active,
                'subscription_start' => $enrollment->subscription_start,
                'subscription_end' => $enrollment->subscription_end,
            ],
            'teacher' => [
                'id' => $enrollment->teacher->id,
                'name' => $enrollment->teacher->name,
                'avatar' => $enrollment->teacher->avatar_url ?? null,
            ],
            'grade' => $enrollment->grade?->name,
            'group' => $enrollment->group?->name,
            'recent_exams' => $examResults,
            'recent_attendance' => $attendances,
        ];
    }

    /**
     * Update student profile
     */
    public function updateProfile(Student $student, array $data): Student
    {
        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $student->update($data);

        return $student;
    }
}
