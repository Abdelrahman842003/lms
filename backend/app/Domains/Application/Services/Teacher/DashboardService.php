<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Teacher;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Application\Services\CacheService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class DashboardService
{
    private function applyContextFilter($query, ?string $academyId)
    {
        if (!$academyId) {
            return $query->whereRaw('1 = 0');
        }

        if ($academyId === 'independent') {
            return $query->whereNull('academy_id');
        }

        return $query->where('academy_id', $academyId);
    }

    public function getStats(Teacher $teacher, ?string $academyId): array
    {

        return CacheService::getTeacherDashboardStats($teacher->id, function () use ($teacher, $academyId) {
            // Get total students
            $enrollmentsQuery = \App\Domains\Enrollments\Models\Enrollment::query()
                ->where('teacher_id', $teacher->id)
                ->where('is_active', true);
            $this->applyContextFilter($enrollmentsQuery, $academyId);
            $totalStudents = (clone $enrollmentsQuery)
                ->distinct('student_id')
                ->count('student_id');

            // Get active students (students who have logged in recently or have activity)
            // For now, same as total
            $activeStudents = $totalStudents;

            // Get total groups
            $groupsQuery = $teacher->groups();
            $this->applyContextFilter($groupsQuery, $academyId);
            $totalGroups = $groupsQuery->count();

            // Get total exams
            $examsQuery = \App\Domains\Exams\Models\Exam::where('teacher_id', $teacher->id);
            $this->applyContextFilter($examsQuery, $academyId);
            $totalExams = $examsQuery->count();

            // Calculate Average Attendance
            // Total Present / Total Attendance Records * 100
            $lecturesQuery = $teacher->lectures();
            $this->applyContextFilter($lecturesQuery, $academyId);
            $teacherLecturesIds = $lecturesQuery->pluck('id');
            
            $totalAttendanceRecords = \App\Domains\Lectures\Models\Attendance::whereIn('lecture_id', $teacherLecturesIds)->count();
            $totalPresent = \App\Domains\Lectures\Models\Attendance::whereIn('lecture_id', $teacherLecturesIds)
                ->where('status', 'present')
                ->count();
            
            $averageAttendance = $totalAttendanceRecords > 0 
                ? round(($totalPresent / $totalAttendanceRecords) * 100) 
                : 0;

            // Attendance Trend (Last 7 Lectures) - Optimized with withCount to avoid N+1
            $trendLecturesQuery = $teacher->lectures()
                ->where('start_time', '<=', now())
                ->orderBy('start_time', 'desc');
            
            $this->applyContextFilter($trendLecturesQuery, $academyId);
            
            $attendanceTrend = $trendLecturesQuery
                ->withCount([
                    'attendances as total_attendances',
                    'attendances as present_attendances' => fn($q) => $q->where('status', 'present')
                ])
                ->take(7)
                ->get()
                ->map(function ($lecture) {
                    $total = $lecture->total_attendances;
                    $present = $lecture->present_attendances;
                    return [
                        'date' => $lecture->start_time->format('m/d'),
                        'rate' => $total > 0 ? round(($present / $total) * 100) : 0,
                    ];
                })->reverse()->values();

            return [
                'total_students' => $totalStudents,
                'active_students' => $activeStudents,
                'total_groups' => $totalGroups,
                'total_exams' => $totalExams,
                'average_attendance' => $averageAttendance,
                'attendance_trend' => $attendanceTrend,
            ];
        }, $academyId);
    }

    public function getRecentStudents(Teacher $teacher, ?string $academyId, int $limit = 5): Collection
    {
        $query = \App\Domains\Enrollments\Models\Enrollment::where('teacher_id', $teacher->id)
            ->with([
                'student:id,name,phone,avatar_key',
                'grade:id,name',
                'group:id,name',
                'academy:id',
                'academy.tenantPlan',
                'teacher:id',
                'teacher.tenantPlan',
            ]);

        $this->applyContextFilter($query, $academyId);

        $enrollments = $query->latest()
            ->limit($limit)
            ->get();

        return $enrollments;
    }

    public function getUpcomingLectures(Teacher $teacher, ?string $academyId, int $limit = 4): Collection
    {
        $query = $teacher->lectures()
            ->where('start_time', '>', now())
            ->orderBy('start_time', 'asc');

        $this->applyContextFilter($query, $academyId);

        return $query->limit($limit)
            ->get()
            ->map(function ($lecture) {
                // Arabic day names mapping
                $days = [
                    'Sunday' => 'الأحد',
                    'Monday' => 'الاثنين',
                    'Tuesday' => 'الثلاثاء',
                    'Wednesday' => 'الأربعاء',
                    'Thursday' => 'الخميس',
                    'Friday' => 'الجمعة',
                    'Saturday' => 'السبت',
                ];
                
                return [
                    'id' => $lecture->id,
                    'title' => $lecture->title,
                    'date' => $lecture->start_time->format('Y-m-d'),
                    'time' => $lecture->start_time->format('H:i'),
                    'day_name' => $days[$lecture->start_time->format('l')] ?? $lecture->start_time->format('l'),
                    'students' => 0,
                ];
            });
    }

    public function getTeacherAcademies(Teacher $teacher): Collection
    {
        $academies = $teacher->academies()
            ->withPivot(['is_active'])
            ->get()
            ->map(function ($academy) {
                return [
                    'id' => $academy->id,
                    'name' => $academy->name,
                    'logo' => $academy->logo_key ? url("/api/media/{$academy->logo_key}") : null,
                    'is_active' => $academy->is_active,
                    'pivot' => [
                        'is_active' => $academy->pivot->is_active,
                    ],
                ];
            });

        if ($teacher->subscription_fee > 0) {
            $academies->push([
                'id' => 'independent',
                'name' => 'مدرس مستقل',
                'logo' => null,
                'is_active' => (bool) $teacher->is_independent_active,
            ]);
        }

        return $academies;
    }
}
