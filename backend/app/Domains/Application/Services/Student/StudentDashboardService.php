<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Student;

use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Auth\Models\Student;
use App\Domains\Lectures\Models\Attendance;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Exams\Models\Exam;
use App\Domains\Exams\Models\ExamResult;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Gamification\Models\StudentPoint;
use Carbon\Carbon;

class StudentDashboardService
{
    public function getDashboardStats(Student $student)
    {
        $enrollments = $student->enrollments()->where('is_active', true)->with('teacher')->get();
        
        $stats = [
            'total_teachers' => $enrollments->count(),
            'total_lectures_attended' => 0,
            'total_exams_taken' => 0,
            'average_exam_score' => 0,
            'upcoming_lectures' => [],
            'upcoming_exams' => [],
            'recent_activities' => [],
        ];

        // Aggregate stats
        $stats['total_lectures_attended'] = Attendance::where('student_id', $student->id)
            ->where('status', 'present')
            ->count();

        $examResults = ExamResult::where('student_id', $student->id)->get();
        $stats['total_exams_taken'] = $examResults->count();
        $stats['average_exam_score'] = $examResults->avg('percentage') ?? 0;

        // Get upcoming lectures (active lectures for enrolled teachers)
        $teacherIds = $enrollments->pluck('teacher_id');
        
        $stats['upcoming_lectures'] = Lecture::whereIn('teacher_id', $teacherIds)
            ->where('is_active', true)
            ->with('teacher:id,name,avatar_key')
            ->latest()
            ->take(5)
            ->get();

        // Get upcoming exams (active exams)
        $stats['upcoming_exams'] = Exam::whereIn('teacher_id', $teacherIds)
            ->where('is_active', true)
            ->with('teacher:id,name,avatar_key')
            ->latest()
            ->take(5)
            ->get();

        return $stats;
    }

    public function getTeacherStats(Student $student, string $teacherId)
    {
        // Verify enrollment
        $enrollment = Enrollment::where('student_id', $student->id)
            ->where('teacher_id', $teacherId)
            ->where('is_active', true)
            ->with(['academy:id', 'teacher:id'])
            ->firstOrFail();

        // Count lectures directly in DB
        $totalLectures = Lecture::where('teacher_id', $teacherId)->count();

        // Count attendance directly in DB using join
        $attendanceCount = Attendance::where('student_id', $student->id)
            ->where('status', 'present')
            ->whereHas('lecture', fn($q) => $q->where('teacher_id', $teacherId))
            ->count();

        // Get exam stats directly in DB
        $examStats = ExamResult::where('student_id', $student->id)
            ->whereHas('exam', fn($q) => $q->where('teacher_id', $teacherId))
            ->selectRaw('COUNT(*) as count, COALESCE(AVG(percentage), 0) as avg')
            ->first();

        $totalExams = Exam::where('teacher_id', $teacherId)->count();

        return [
            'attendance_rate' => $totalLectures > 0 ? round(($attendanceCount / $totalLectures) * 100) : 0,
            'exam_average' => (float) ($examStats->avg ?? 0),
            'exams_taken' => $examStats->count ?? 0,
            'total_exams' => $totalExams,
            'subscription_status' => [
                'is_active' => $enrollment->is_active,
                'ends_at' => $enrollment->subscription_end,
            ]
        ];
    }

    /**
     * Validate teacher and get enrollment for dashboard
     */
    public function validateTeacherAndGetEnrollment(Student $student, string $teacherId): ?array
    {
        // Get Enrollment (for Balance & Status)
        $enrollment = Enrollment::where('student_id', $student->id)
            ->where('teacher_id', $teacherId)
            ->with(['academy:id', 'academy.tenantPlan', 'teacher:id,status', 'teacher.tenantPlan'])
            ->first();

        if (!$enrollment || !$enrollment->is_active) {
            return null;
        }

        $teacher = $enrollment->teacher;
        if (!$teacher) {
            return null;
        }

        $enrollmentStatus = (string) $enrollment->status;
        $isTeacherSuspended = $teacher->status === 'suspended';
        $isSubscriptionBlocked = $teacher->isSubscriptionBlocked();

        if ($isTeacherSuspended) {
            return null;
        }

        return [
            'teacher' => $teacher,
            'enrollment' => $enrollment,
        ];
    }

    /**
     * Get student points for a teacher
     */
    public function getStudentPoints(Student $student, string $teacherId): int
    {
        $pointsRecord = StudentPoint::where('student_id', $student->id)
            ->where('teacher_id', $teacherId)
            ->first();
        return $pointsRecord ? $pointsRecord->total_points : 0;
    }

    /**
     * Get upcoming lectures for a teacher
     */
    public function getUpcomingLectures(string $teacherId, int $limit = 3): array
    {
        return Lecture::where('teacher_id', $teacherId)
            ->where('start_time', '>=', Carbon::today())
            ->orderBy('start_time')
            ->take($limit)
            ->get()
            ->map(function ($lecture) {
                return [
                    'id' => $lecture->id,
                    'title' => $lecture->title,
                    'date' => $lecture->start_time->format('Y-m-d'),
                    'time' => $lecture->start_time->format('H:i'),
                    'status' => 'قادمة',
                ];
            })
            ->toArray();
    }

    /**
     * Get recent attendance records
     */
    public function getRecentAttendance(Student $student, string $teacherId, int $limit = 5): array
    {
        return $student->attendances()
            ->whereHas('lecture', function ($q) use ($teacherId) {
                $q->where('teacher_id', $teacherId);
            })
            ->with('lecture:id,title')
            ->latest()
            ->take($limit)
            ->get()
            ->map(function ($attendance) {
                return [
                    'type' => 'attendance',
                    'id' => $attendance->id,
                    'title' => $attendance->lecture->title,
                    'status' => $attendance->status, // present, absent
                    'date' => $attendance->created_at->format('Y-m-d'),
                    'timestamp' => $attendance->created_at->timestamp,
                ];
            })
            ->toArray();
    }

    /**
     * Get recent exam results
     */
    public function getRecentExams(Student $student, string $teacherId, int $limit = 5): array
    {
        return Exam::where('teacher_id', $teacherId)
            ->whereHas('results', function ($q) use ($student) {
                $q->where('student_id', $student->id);
            })
            ->with(['results' => function ($q) use ($student) {
                $q->where('student_id', $student->id);
            }])
            ->latest()
            ->take($limit)
            ->get()
            ->map(function ($exam) {
                $result = $exam->results->first();
                return [
                    'type' => 'exam',
                    'id' => $exam->id,
                    'title' => $exam->title,
                    'score' => $result ? $result->score : 0,
                    'total' => $exam->total_marks ?? 100,
                    'date' => $exam->created_at->format('Y-m-d'),
                    'timestamp' => $exam->created_at->timestamp,
                ];
            })
            ->toArray();
    }

    /**
     * Get latest news (mixed feed of attendance and exams)
     */
    public function getLatestNews(Student $student, string $teacherId, int $limit = 5): array
    {
        $recentAttendance = collect($this->getRecentAttendance($student, $teacherId, $limit));
        $recentExams = collect($this->getRecentExams($student, $teacherId, $limit));

        // Merge and sort by timestamp desc
        return $recentAttendance->concat($recentExams)
            ->sortByDesc('timestamp')
            ->take($limit)
            ->values()
            ->toArray();
    }
}
