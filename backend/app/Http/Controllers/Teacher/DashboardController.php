<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Services\Infrastructure\CacheService;
use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\Lecture;

class DashboardController extends Controller
{
    use \App\Traits\ResolvesTeacher;
    public function getStats(Request $request)
    {
        $teacher = $this->getTeacherFromRequest($request);
        $academyId = $request->header('X-Academy-Id');
        \Illuminate\Support\Facades\Log::info("getStats: Teacher {$teacher->id}, AcademyId: " . ($academyId ?? 'NULL'));

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

        $stats = CacheService::getTeacherDashboardStats($teacher->id, function () use ($teacher, $academyId, $applyAcademyFilter) {
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
            \Illuminate\Support\Facades\Log::info("getStats: Total Students: {$totalStudents}");

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

            // Attendance Trend (Last 7 Lectures)
            $trendLecturesQuery = $teacher->lectures()
                ->where('start_time', '<=', now())
                ->orderBy('start_time', 'desc');
            
            $applyAcademyFilter($trendLecturesQuery);
            
            $attendanceTrend = $trendLecturesQuery
                ->take(7)
                ->get()
                ->map(function ($lecture) {
                    $total = $lecture->attendances()->count();
                    $present = $lecture->attendances()->where('status', 'present')->count();
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

        return $this->successResponse($stats);
    }

    public function getRecentStudents(Request $request)
    {
        $teacher = $this->getTeacherFromRequest($request);
        $limit = $request->input('limit', 5);
        $academyId = $request->header('X-Academy-Id');

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
        
        \Illuminate\Support\Facades\Log::info("getRecentStudents: Count: " . $enrollments->count());

        return $this->successResponse([
            'students' => \App\Http\Resources\Teacher\EnrollmentResource::collection($enrollments),
        ]);
    }

    public function getUpcomingLectures(Request $request)
    {
        $teacher = $this->getTeacherFromRequest($request);
        $limit = $request->input('limit', 4);
        $academyId = $request->header('X-Academy-Id');

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

        $lectures = $query->limit($limit)
            ->get()
            ->map(function ($lecture) use ($teacher) {
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

        return $this->successResponse([
            'lectures' => $lectures,
        ]);
    }

    public function getTeacherAcademies(Request $request)
    {
        $teacher = $this->getTeacherFromRequest($request);
        
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

        // Check if teacher is independent
        // A teacher is independent if they have a subscription fee set or have independent enrollments
        // We can also check the 'independent_enrollments_count' if available, but checking subscription_fee > 0 is a good proxy for "enabled as independent"
        // Or we can check if they have any students not associated with an academy (which is harder to check efficiently here without eager loading)
        // Based on TeacherResource logic:
        $isIndependent = $teacher->subscription_fee > 0 || $teacher->enrollments()->whereNull('academy_id')->exists();
        
        // Actually, checking subscription_fee is usually how we enable "Independent" mode in admin.
        // Let's check the Admin/TeacherController logic for "enableIndependent".
        // It sets subscription_fee.
        
        if ($teacher->subscription_fee > 0) {
            $academies->push([
                'id' => null,
                'name' => 'مدرس مستقل',
                'logo' => null,
                'is_active' => true,
            ]);
        }

        return $this->successResponse([
            'academies' => $academies,
        ]);
    }
}
