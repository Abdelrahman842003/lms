<?php

declare(strict_types=1);

namespace App\Services\Teacher;

use App\Models\Teacher;
use App\Services\Infrastructure\CacheService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class DashboardService
{
    public function getStats(Teacher $teacher, ?string $academyId): array
    {
        Log::info("getStats: Teacher {$teacher->id}, AcademyId: " . ($academyId ?? 'NULL'));

        // Helper to apply academy filter
        $applyAcademyFilter = function ($query) use ($academyId) {
            // If no academy selected, return empty results (require explicit selection)
            if (!$academyId) {
                $query->whereRaw('1 = 0');
                return;
            }

            if ($academyId === 'independent') {
                $query->where(function ($q) {
                    $q->whereDoesntHave('grade')
                      ->orWhereHas('grade', function ($g) {
                          $g->whereNull('academy_id');
                      });
                });
            } else {
                $query->whereHas('grade', function ($q) use ($academyId) {
                    $q->where('academy_id', $academyId);
                });
            }
        };

        return CacheService::getTeacherDashboardStats($teacher->id, function () use ($teacher, $academyId, $applyAcademyFilter) {
            // Get total students
            $studentsQuery = $teacher->students();
            // Filter students based on their enrollment's grade
            $studentsQuery->whereHas('enrollments', function ($q) use ($academyId) {
                 // If no academy selected, return empty results
                 if (!$academyId) {
                     $q->whereRaw('1 = 0');
                     return;
                 }
                 if ($academyId === 'independent') {
                     $q->where(function ($sub) {
                         $sub->whereDoesntHave('grade')
                             ->orWhereHas('grade', function ($g) {
                                 $g->whereNull('academy_id');
                             });
                     });
                 } else {
                     $q->whereHas('grade', function ($g) use ($academyId) {
                         $g->where('academy_id', $academyId);
                     });
                 }
            });
            $totalStudents = $studentsQuery->count();
            Log::info("getStats: Total Students: {$totalStudents}");

            // Get active students (students who have logged in recently or have activity)
            // For now, same as total
            $activeStudents = $totalStudents;

            // Get total groups
            $groupsQuery = $teacher->groups();
            $applyAcademyFilter($groupsQuery);
            $totalGroups = $groupsQuery->count();

            // Get total exams
            $examsQuery = \App\Models\Exam::where('teacher_id', $teacher->id);
            $applyAcademyFilter($examsQuery);
            $totalExams = $examsQuery->count();

            // Calculate Average Attendance
            // Total Present / Total Attendance Records * 100
            $lecturesQuery = $teacher->lectures();
            $applyAcademyFilter($lecturesQuery);
            $teacherLecturesIds = $lecturesQuery->pluck('id');
            
            $totalAttendanceRecords = \App\Models\Attendance::whereIn('lecture_id', $teacherLecturesIds)->count();
            $totalPresent = \App\Models\Attendance::whereIn('lecture_id', $teacherLecturesIds)
                ->where('status', 'present')
                ->count();
            
            $averageAttendance = $totalAttendanceRecords > 0 
                ? round(($totalPresent / $totalAttendanceRecords) * 100) 
                : 0;

            // Attendance Trend (Last 7 Lectures) - Optimized with withCount to avoid N+1
            $trendLecturesQuery = $teacher->lectures()
                ->where('start_time', '<=', now())
                ->orderBy('start_time', 'desc');
            
            $applyAcademyFilter($trendLecturesQuery);
            
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
        $query = \App\Models\Enrollment::where('teacher_id', $teacher->id)
            ->with(['student', 'grade', 'group', 'student.examResults.exam', 'student.attendances.lecture']);

        if ($academyId) {
            if ($academyId === 'independent') {
                $query->where(function ($q) {
                    $q->whereDoesntHave('grade')
                      ->orWhereHas('grade', function ($g) {
                          $g->whereNull('academy_id');
                      });
                });
            } else {
                $query->whereHas('grade', function ($q) use ($academyId) {
                    $q->where('academy_id', $academyId);
                });
            }
        }

        $enrollments = $query->latest()
            ->limit($limit)
            ->get();
        
        Log::info("getRecentStudents: Count: " . $enrollments->count());

        return $enrollments;
    }

    public function getUpcomingLectures(Teacher $teacher, ?string $academyId, int $limit = 4): Collection
    {
        $query = $teacher->lectures()
            ->where('start_time', '>', now())
            ->orderBy('start_time', 'asc');

        if ($academyId) {
            if ($academyId === 'independent') {
                $query->where(function ($q) {
                    $q->whereDoesntHave('grade')
                      ->orWhereHas('grade', function ($g) {
                          $g->whereNull('academy_id');
                      });
                });
            } else {
                $query->whereHas('grade', function ($q) use ($academyId) {
                    $q->where('academy_id', $academyId);
                });
            }
        }

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
            ->get()
            ->map(function ($academy) {
                return [
                    'id' => $academy->id,
                    'name' => $academy->name,
                    'logo' => $academy->logo_key ? url("/api/media/{$academy->logo_key}") : null,
                    'is_active' => $academy->is_active,
                ];
            });

        if ($teacher->subscription_fee > 0) {
            $academies->push([
                'id' => 'independent',
                'name' => 'مدرس مستقل',
                'logo' => null,
                'is_active' => true,
            ]);
        }

        return $academies;
    }
}
