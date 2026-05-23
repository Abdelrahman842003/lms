<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Academy;

use App\Domains\Auth\Models\Academy;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Media\Services\ImageService;
use App\Domains\Application\Models\TeacherAttendanceLog;
use App\Domains\Application\Services\CacheService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function getStats(Academy $academy): array
    {
        return CacheService::getAcademyDashboardStats($academy->id, function () use ($academy) {
        // Dashboard counters should include all teachers linked to this academy.
        $linkedTeacherIds = $academy->teachers()
            ->pluck('teachers.id');

        $linkedTeachersCount = $linkedTeacherIds->count();
        $activeTeachersCount = $academy->activeTeachers()->count();
        
        // Get active secretaries count
        $activeSecretariesCount = $academy->activeSecretaries()->count();

        // Get total enrollments (links) and unique students for linked academy teachers
        $enrollmentsQuery = Enrollment::query()
            ->whereIn('teacher_id', $linkedTeacherIds)
            ->where('academy_id', $academy->id)
            ->where('is_active', true);

        $totalEnrollments = (clone $enrollmentsQuery)->count();
        $uniqueStudentsCount = (clone $enrollmentsQuery)
            ->distinct('student_id')
            ->count('student_id');

        // Get today's attendance
        $today = Carbon::today();
        $todayAttendance = TeacherAttendanceLog::forAcademy($academy->id)
            ->whereDate('date', $today)
            ->get();

        $checkedInToday = $todayAttendance->where('status', 'checked_in')->count();
        $checkedOutToday = $todayAttendance->where('status', 'checked_out')->count();

        // Get this month's attendance stats
        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();
        
        $monthlyAttendance = TeacherAttendanceLog::forAcademy($academy->id)
            ->dateRange($startOfMonth, $endOfMonth)
            ->get();

        $monthlyPresent = $monthlyAttendance->where('status', 'checked_out')->count();
        $monthlyAbsent = $monthlyAttendance->where('status', 'absent')->count();

        // --- Revenue Statistics ---
        // Use all currently linked teachers in this academy.
        $teacherIds = $linkedTeacherIds;
        
        // Current Month Revenue
        $currentMonthRevenue = \App\Domains\Subscriptions\Models\PaymentLog::whereIn('teacher_id', $teacherIds)
            ->confirmed()
            ->whereBetween('confirmed_at', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        // Historical Revenue (Last 6 months)
        $revenueChart = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $monthStart = $date->copy()->startOfMonth();
            $monthEnd = $date->copy()->endOfMonth();
            
            $revenue = \App\Domains\Subscriptions\Models\PaymentLog::whereIn('teacher_id', $teacherIds)
                ->confirmed()
                ->whereBetween('confirmed_at', [$monthStart, $monthEnd])
                ->sum('amount');
                
            $revenueChart[] = [
                'month' => $date->format('M'), // e.g., Jan
                'full_date' => $date->format('Y-m'),
                'revenue' => $revenue,
                'label' => $date->translatedFormat('F'), // Arabic month name if locale set
            ];
        }

        // Get pending billing
        $pendingBilling = \App\Domains\Subscriptions\Models\Subscription::query()
            ->where('subscriber_id', $academy->id)
            ->where('subscriber_type', \App\Domains\Auth\Models\Academy::class)
            ->whereIn('status', [
                \App\Domains\Subscriptions\Enums\SubscriptionStatus::PENDING->value,
                \App\Domains\Subscriptions\Enums\SubscriptionStatus::PARTIAL->value,
            ])
            ->latest()
            ->first();
        
        // Get recent teachers (last 5 linked teachers in academy)
        $recentTeachers = $academy->teachers()
            ->select('teachers.*')
            ->orderBy('academy_teacher.created_at', 'desc')
            ->limit(5)
            ->get();

        // Pre-load student counts for all teachers to avoid N+1 queries
        $teacherIds = $recentTeachers->pluck('id');
        $studentCounts = Enrollment::query()
            ->select('teacher_id', DB::raw('COUNT(*) as students_count'))
            ->where('academy_id', $academy->id)
            ->where('is_active', true)
            ->whereIn('teacher_id', $teacherIds)
            ->groupBy('teacher_id')
            ->pluck('students_count', 'teacher_id')
            ->toArray();

        // Transform recent teachers
        $imageService = app(ImageService::class);
        $transformedTeachers = $recentTeachers->map(function ($teacher) use ($academy, $imageService, $studentCounts) {
            $rawStatus = $this->normalizeEnumValue($teacher->status);
            $status = 'نشط';
            if ($rawStatus === 'pending') {
                $status = 'في انتظار الموافقة';
            } elseif ($rawStatus === 'suspended' || !$teacher->pivot?->is_active) {
                $status = 'معلق';
            }

            return [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'avatar' => $teacher->avatar_key ? $imageService->getUrl($teacher->avatar_key) : null,
                'students_count' => $studentCounts[$teacher->id] ?? 0,
                'status' => $status,
                'created_at' => $teacher->pivot->created_at,
            ];
        });

        return [
            'academy' => [
                'id' => $academy->id,
                'name' => $academy->name,
                'logo_key' => $academy->logo_key,
            ],
            'teachers_count' => $linkedTeachersCount,
            'students_count' => $uniqueStudentsCount,
            'total_enrollments' => $totalEnrollments,
            'actual_revenue' => $currentMonthRevenue,
            'revenue_chart' => $revenueChart,
            'teachers' => $transformedTeachers,
            'stats' => [
                'active_teachers' => $activeTeachersCount,
                'linked_teachers' => $linkedTeachersCount,
                'active_secretaries' => $activeSecretariesCount,
                'total_students' => $uniqueStudentsCount,
                'total_enrollments' => $totalEnrollments,
                'checked_in_today' => $checkedInToday,
                'checked_out_today' => $checkedOutToday,
                'monthly_present' => $monthlyPresent,
                'monthly_absent' => $monthlyAbsent,
            ],
            'pending_billing' => $pendingBilling ? [
                'month' => $pendingBilling->month?->format('m'),
                'year' => $pendingBilling->month?->format('Y'),
                'total_cost' => $pendingBilling->amount_due,
            ] : null,
        ];
        });
    }

    /**
     * Clear academy dashboard cache
     * Call this when data changes (students, teachers, enrollments, etc.)
     */
    public function clearStatsCache(Academy $academy): void
    {
        CacheService::forgetAcademyDashboard($academy->id);
    }

    private function normalizeEnumValue(mixed $value): ?string
    {
        if ($value instanceof \BackedEnum) {
            return (string) $value->value;
        }

        if ($value === null) {
            return null;
        }

        return (string) $value;
    }
}
