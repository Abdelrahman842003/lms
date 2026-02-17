<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Enums\SubscriptionStatus;
use App\Enums\SubscriptionType;
use App\Models\Academy;
use App\Models\Enrollment;
use App\Models\Setting;
use App\Models\Subscription;
use App\Models\Teacher;
use App\Services\Infrastructure\HelperService;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Unified Subscription Service
 * 
 * Handles subscription calculations for both teachers and academies
 */
class SubscriptionService
{
    /**
     * Get paginated subscriptions
     */
    public function getSubscriptions(int $perPage, array $filters): LengthAwarePaginator
    {
        return Subscription::with('subscriber')
            ->filter($filters)
            ->orderBy('month', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get or create subscription for a teacher
     */
    public function getTeacherSubscription(string $teacherId, Carbon $month): Subscription
    {
        $teacher = Teacher::findOrFail($teacherId);
        $monthStart = $month->copy()->startOfMonth();

        $subscription = Subscription::firstOrCreate(
            [
                'subscriber_id' => $teacher->id,
                'subscriber_type' => Teacher::class,
                'month' => $monthStart,
            ],
            [
                'type' => SubscriptionType::TEACHER,
                'quota_limit' => $teacher->student_quota ?? 0,
                'cost_per_seat' => $this->getTeacherPricePerSeat(),
                'amount_paid' => 0,
                'status' => SubscriptionStatus::PENDING,
            ]
        );

        // Recalculate if not paid
        if (!$subscription->isPaid()) {
            $this->recalculateTeacherSubscription($subscription, $teacher, $monthStart);
        }

        return $subscription;
    }

    /**
     * Get or create subscription for an academy
     *
     * NOW SAME AS TEACHER: Counts UNIQUE STUDENTS (not enrollments)
     */
    public function getAcademySubscription(string $academyId, Carbon $month): Subscription
    {
        $academy = Academy::findOrFail($academyId);
        $monthStart = $month->copy()->startOfMonth();

        $subscription = Subscription::firstOrCreate(
            [
                'subscriber_id' => $academy->id,
                'subscriber_type' => Academy::class,
                'month' => $monthStart,
            ],
            [
                'type' => SubscriptionType::ACADEMY,
                'quota_limit' => $academy->plan_max_students, // null = unlimited
                'cost_per_seat' => $this->getAcademyPricePerSeat(),
                'amount_paid' => 0,
                'status' => SubscriptionStatus::PENDING,
            ]
        );

        // Recalculate if not paid
        if (!$subscription->isPaid()) {
            $this->recalculateAcademySubscription($subscription, $academy, $monthStart);
        }

        return $subscription;
    }

    /**
     * Recalculate teacher subscription
     */
    private function recalculateTeacherSubscription(Subscription $subscription, Teacher $teacher, Carbon $month): void
    {
        // Get active student count (seats used)
        $seatsCount = $teacher->activeEnrollments()->count();
        
        // Get price per seat
        $costPerSeat = $this->getTeacherPricePerSeat();
        
        // Calculate amount due
        $amountDue = $seatsCount * $costPerSeat;

        // Update subscription
        $subscription->seats_count = $seatsCount;
        $subscription->cost_per_seat = $costPerSeat;
        $subscription->amount_due = $amountDue;
        $subscription->quota_limit = $teacher->student_quota ?? 0;
        
        // Update status based on payment
        $subscription->updateStatusFromPayment();
        $subscription->save();
    }

    /**
     * Recalculate academy subscription
     *
     * NOW SAME AS TEACHER: Counts UNIQUE STUDENTS (not enrollments)
     * Example: 3 students = 3 seats (regardless of how many teachers)
     */
    private function recalculateAcademySubscription(Subscription $subscription, Academy $academy, Carbon $month): void
    {
        // Get active teacher IDs
        $teacherIds = $academy->activeTeachers()->pluck('teachers.id')->toArray();
        
        // Count UNIQUE STUDENTS (same as teacher logic)
        $seatsCount = Enrollment::whereIn('teacher_id', $teacherIds)
            ->where('is_active', true)
            ->distinct('student_id')
            ->count('student_id');
        
        // Get price per seat
        $costPerSeat = $this->getAcademyPricePerSeat();
        
        // Calculate amount due
        $amountDue = $seatsCount * $costPerSeat;

        // Update subscription
        $subscription->seats_count = $seatsCount;
        $subscription->cost_per_seat = $costPerSeat;
        $subscription->amount_due = $amountDue;
        $subscription->quota_limit = $academy->plan_max_students;
        
        // Update status based on payment
        $subscription->updateStatusFromPayment();
        $subscription->save();
    }

    /**
     * Record payment for subscription
     */
    public function recordPayment(
        Subscription $subscription, 
        float $amount, 
        ?string $paymentMethod = null,
        ?string $notes = null
    ): Subscription {
        if ($amount <= 0) {
            throw new \InvalidArgumentException('Payment amount must be greater than zero');
        }

        $subscription->amount_paid += $amount;
        
        // Generate payment key if first payment
        if (!$subscription->payment_key) {
            $subscription->payment_key = Subscription::generatePaymentKey();
            $subscription->payment_initiated_at = now();
        }
        
        if ($paymentMethod) {
            $subscription->payment_method = $paymentMethod;
        }
        
        if ($notes) {
            $subscription->notes = $notes;
        }

        // Update status
        $subscription->updateStatusFromPayment();
        
        return $subscription->fresh();
    }

    /**
     * Get teacher price per seat from settings
     */
    public function getTeacherPricePerSeat(): float
    {
        return HelperService::getPricePerStudent();
    }

    /**
     * Get academy price per seat from settings
     */
    public function getAcademyPricePerSeat(): float
    {
        return HelperService::getAcademyStudentPrice();
    }

    /**
     * Get subscription statistics
     */
    public function getStatistics(int $year, ?SubscriptionType $type = null): array
    {
        $query = Subscription::whereYear('month', $year);
        
        if ($type) {
            $query->where('type', $type);
        }

        $totalPending = (float) $query->clone()->pending()->sum('amount_due');
        $totalPaid = (float) $query->clone()->paid()->sum('amount_paid');
        $totalPartialPaid = (float) $query->clone()->partial()->sum('amount_paid');
        
        $monthlyData = $query->clone()
            ->selectRaw('MONTH(month) as month_num, SUM(amount_due) as total_due, SUM(amount_paid) as total_paid, COUNT(*) as count')
            ->groupBy('month_num')
            ->orderBy('month_num')
            ->get();

        return [
            'year' => $year,
            'total_pending' => $totalPending,
            'total_paid' => $totalPaid,
            'total_partial_paid' => $totalPartialPaid,
            'monthly_data' => $monthlyData,
            'by_type' => [
                'teacher' => [
                    'pending' => (float) Subscription::whereYear('month', $year)->forTeachers()->pending()->sum('amount_due'),
                    'paid' => (float) Subscription::whereYear('month', $year)->forTeachers()->paid()->sum('amount_paid'),
                ],
                'academy' => [
                    'pending' => (float) Subscription::whereYear('month', $year)->forAcademies()->pending()->sum('amount_due'),
                    'paid' => (float) Subscription::whereYear('month', $year)->forAcademies()->paid()->sum('amount_paid'),
                ],
            ],
        ];
    }

    /**
     * Check if teacher can add more students (within quota)
     */
    public function canTeacherAddStudent(string $teacherId): bool
    {
        $teacher = Teacher::findOrFail($teacherId);
        
        // If no quota set, check current month subscription
        if (!$teacher->student_quota || $teacher->student_quota <= 0) {
            return true; // Unlimited or trial mode
        }

        $currentSeats = $teacher->activeEnrollments()->count();
        return $currentSeats < $teacher->student_quota;
    }

    /**
     * Check if academy can add more enrollments (within quota)
     */
    public function canAcademyAddEnrollment(string $academyId): bool
    {
        $academy = Academy::findOrFail($academyId);
        
        // If no quota set (null), it's unlimited
        if ($academy->max_enrollments_limit === null) {
            return true;
        }

        $teacherIds = $academy->activeTeachers()->pluck('teachers.id')->toArray();
        $currentEnrollments = Enrollment::whereIn('teacher_id', $teacherIds)
            ->where('is_active', true)
            ->count();
            
        return $currentEnrollments < $academy->max_enrollments_limit;
    }

    /**
     * Get quota usage for teacher
     */
    public function getTeacherQuotaUsage(string $teacherId): array
    {
        $teacher = Teacher::findOrFail($teacherId);
        $currentSeats = $teacher->activeEnrollments()->count();
        $quota = $teacher->student_quota;

        return [
            'used' => $currentSeats,
            'limit' => $quota,
            'remaining' => $quota ? max(0, $quota - $currentSeats) : null,
            'unlimited' => !$quota || $quota <= 0,
            'percentage' => $quota ? min(100, round(($currentSeats / $quota) * 100, 2)) : 0,
        ];
    }

    /**
     * Get quota usage for academy
     */
    public function getAcademyQuotaUsage(string $academyId): array
    {
        $academy = Academy::findOrFail($academyId);
        $teacherIds = $academy->activeTeachers()->pluck('teachers.id')->toArray();
        $currentEnrollments = Enrollment::whereIn('teacher_id', $teacherIds)
            ->where('is_active', true)
            ->count();
        $quota = $academy->max_enrollments_limit;

        return [
            'used' => $currentEnrollments,
            'limit' => $quota,
            'remaining' => $quota !== null ? max(0, $quota - $currentEnrollments) : null,
            'unlimited' => $quota === null,
            'percentage' => $quota ? min(100, round(($currentEnrollments / $quota) * 100, 2)) : 0,
        ];
    }

    /**
     * Get aggregated subscriptions for both teachers and academies
     * Used by admin/subscriptions page
     */
    public function getAggregatedSubscriptions(int $perPage, array $filters): array
    {
        $search = $filters['search'] ?? null;
        $typeFilter = $filters['type'] ?? null;
        $statusFilter = $filters['status'] ?? null;

        $items = collect();
        $stats = ['total' => 0, 'active' => 0, 'trial' => 0, 'expired' => 0];

        // Get teachers if type filter allows
        if (!$typeFilter || $typeFilter === 'teacher') {
            $teachers = Teacher::query()
                ->when($search, fn($q) => $q->where('name', 'like', "%{$search}%"))
                ->whereNotNull('plan_type')
                ->where('plan_type', '!=', '')
                ->where('plan_type', '!=', 'none')
                ->orderBy('id')
                ->get();

            foreach ($teachers as $teacher) {
                $planType = $teacher->plan_type;
                $subscriptionStatus = $this->getTeacherSubscriptionStatus($teacher);

                // Filter by status if specified
                if ($statusFilter && $subscriptionStatus !== $statusFilter) {
                    continue;
                }

                $items->push([
                    'id' => $teacher->id,
                    'name' => $teacher->name,
                    'type' => 'teacher',
                    'status' => $subscriptionStatus,
                    'plan' => $planType ?: 'none',
                    'expires_at' => $teacher->plan_expires_at?->toISOString(),
                ]);

                // Update stats
                $stats['total']++;
                if ($subscriptionStatus === 'active') $stats['active']++;
                if ($subscriptionStatus === 'trial') $stats['trial']++;
                if ($subscriptionStatus === 'expired') $stats['expired']++;
            }
        }

        // Get academies if type filter allows
        if (!$typeFilter || $typeFilter === 'academy') {
            $academies = Academy::query()
                ->when($search, fn($q) => $q->where('name', 'like', "%{$search}%"))
                ->whereNotNull('plan_type')
                ->where('plan_type', '!=', '')
                ->where('plan_type', '!=', 'none')
                ->orderBy('id')
                ->get();

            foreach ($academies as $academy) {
                $planType = $academy->plan_type;
                $subscriptionStatus = $this->getAcademySubscriptionStatus($academy);

                // Filter by status if specified
                if ($statusFilter && $subscriptionStatus !== $statusFilter) {
                    continue;
                }

                $items->push([
                    'id' => $academy->id,
                    'name' => $academy->name,
                    'type' => 'academy',
                    'status' => $subscriptionStatus,
                    'plan' => $planType ?? 'none',
                    'expires_at' => $academy->plan_expires_at?->toISOString(),
                ]);

                // Update stats
                $stats['total']++;
                if ($subscriptionStatus === 'active') $stats['active']++;
                if ($subscriptionStatus === 'trial') $stats['trial']++;
                if ($subscriptionStatus === 'expired') $stats['expired']++;
            }
        }

        // Manual pagination
        $currentPage = $filters['page'] ?? 1;
        $total = $items->count();
        $lastPage = (int) ceil($total / $perPage);
        $paginatedItems = $items->forPage($currentPage, $perPage)->values();

        return [
            'data' => $paginatedItems,
            'meta' => [
                'current_page' => (int) $currentPage,
                'last_page' => $lastPage,
                'per_page' => $perPage,
                'total' => $total,
            ],
            'stats' => $stats,
        ];
    }

    /**
     * Get subscription status for a teacher
     */
    private function getTeacherSubscriptionStatus(Teacher $teacher): string
    {
        $planType = $teacher->plan_type;
        $planExpiresAt = $teacher->plan_expires_at;

        if ($planType === 'trial') {
            return 'trial';
        }

        if ($planExpiresAt && $planExpiresAt->isFuture()) {
            return 'active';
        }

        if ($planExpiresAt && $planExpiresAt->isPast()) {
            return 'expired';
        }

        return 'trial';
    }

    /**
     * Get subscription status for an academy
     */
    private function getAcademySubscriptionStatus(Academy $academy): string
    {
        $planType = $academy->plan_type;
        $planExpiresAt = $academy->plan_expires_at;

        if ($planType === 'trial') {
            return 'trial';
        }

        if ($planExpiresAt && $planExpiresAt->isFuture()) {
            return 'active';
        }

        if ($planExpiresAt && $planExpiresAt->isPast()) {
            return 'expired';
        }

        return 'trial';
    }
}