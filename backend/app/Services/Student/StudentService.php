<?php

namespace App\Services\Student;

use App\Models\Student;
use App\Models\Enrollment;
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
            ->with(['teacher:id,name,avatar_key,is_suspended', 'grade:id,name', 'group:id,name'])
            ->get()
            ->map(function ($enrollment) {
                return [
                    'enrollment_id' => $enrollment->id,
                    'teacher_id' => $enrollment->teacher_id,
                    'teacher_name' => $enrollment->teacher->name,
                    'teacher_avatar' => $enrollment->teacher->avatar_key 
                        ? config('filesystems.disks.r2.url') . '/' . $enrollment->teacher->avatar_key 
                        : null,
                    'is_suspended' => (bool) $enrollment->teacher->is_suspended,
                    'grade_name' => $enrollment->grade?->name,
                    'group_name' => $enrollment->group?->name,
                    'balance' => $enrollment->balance,
                    'status' => $enrollment->status,
                    'days_left' => $enrollment->days_left,
                    'enrolled_at' => $enrollment->created_at,
                ];
            })
            ->toArray();
    }

    /**
     * Get student dashboard for a specific teacher
     */
    public function getTeacherDashboard(Student $student, string $teacherId): array
    {
        $enrollment = $student->enrollments()
            ->with(['teacher', 'grade', 'group'])
            ->where('teacher_id', $teacherId)
            ->where('is_active', true)
            ->firstOrFail();

        if ($enrollment->teacher->is_suspended) {
            abort(403, "ممنوع الدخول علي المدرس {$enrollment->teacher->name} في الوقت الحالي");
        }

        // Get exams for this teacher
        $examResults = $student->examResults()
            ->whereHas('exam', function ($q) use ($teacherId) {
                $q->where('teacher_id', $teacherId);
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
            ->whereHas('lecture', function ($q) use ($teacherId) {
                $q->where('teacher_id', $teacherId);
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
                'avatar' => $enrollment->teacher->avatar_key 
                    ? config('filesystems.disks.r2.url') . '/' . $enrollment->teacher->avatar_key 
                    : null,
            ],
            'grade' => $enrollment->grade?->name,
            'group' => $enrollment->group?->name,
            'recent_exams' => $examResults,
            'recent_attendance' => $attendances,
        ];
    }
}
