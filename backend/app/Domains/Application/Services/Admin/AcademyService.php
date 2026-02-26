<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Admin;

use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Auth\Models\Academy;
use App\Domains\Subscriptions\Models\AcademySubscription;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Support\Services\HelperService;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class AcademyService
{
    /**
     * Get paginated academies
     */
    public function getAcademies(int $perPage, array $filters): LengthAwarePaginator
    {
        return Academy::filter($filters)
            ->withCount(['teachers', 'secretaries'])
            ->with(['subscriptions' => function ($query) {
                $query->latest('created_at')->limit(1);
            }])
            ->paginate($perPage)
            ->through(function ($academy) {
                $academy->subscription_status = $this->getSubscriptionStatus($academy);
                return $academy;
            });
    }

    /**
     * Get subscription status for academy
     */
    private function getSubscriptionStatus(Academy $academy): ?string
    {
        // Check if there's an active subscription
        if ($academy->subscriptions && $academy->subscriptions->isNotEmpty()) {
            $subscription = $academy->subscriptions->first();
            return $subscription->status->value ?? null;
        }

        // Fall back to plan_type-based logic
        $planType = $academy->plan_type;
        $planExpiresAt = $academy->plan_expires_at;

        // If no plan is set, return null (not set)
        if (empty($planType) || $planType === 'none') {
            return null;
        }

        if ($planType === 'trial') {
            return 'pending';
        }

        if ($planExpiresAt && $planExpiresAt->isFuture()) {
            return 'active';
        }

        if ($planExpiresAt && $planExpiresAt->isPast()) {
            return 'expired';
        }

        return null;
    }

    /**
     * Create new academy
     */
    public function create(array $data): Academy
    {
        return Academy::create($data);
    }

    /**
     * Update academy
     */
    public function update(Academy $academy, array $data): Academy
    {
        $academy->update($data);
        return $academy->fresh();
    }

    /**
     * Toggle academy status
     */
    public function toggleStatus(Academy $academy): bool
    {
        $academy->is_active = !$academy->is_active;
        $academy->save();
        
        return $academy->is_active;
    }

    /**
     * Delete academy
     */
    public function delete(Academy $academy): void
    {
        $academy->delete();
    }

    /**
     * Add secretary to academy
     */
    public function addSecretary(Academy $academy, string $secretaryId, array $permissions = []): Secretary
    {
        // Check if already exists
        if ($academy->secretaries()->where('secretary_id', $secretaryId)->exists()) {
            throw new \Exception('السكرتير موجود بالفعل في الأكاديمية');
        }

        $academy->secretaries()->attach($secretaryId, [
            'permissions' => $permissions,
            'is_active' => true,
        ]);

        return Secretary::findOrFail($secretaryId);
    }

    /**
     * Remove secretary from academy
     */
    public function removeSecretary(Academy $academy, string $secretaryId): void
    {
        $academy->secretaries()->detach($secretaryId);
    }

    /**
     * Regenerate QR codes
     */
    public function regenerateQrCodes(Academy $academy): Academy
    {
        $academy->checkin_qr_code = Str::random(32);
        $academy->checkout_qr_code = Str::random(32);
        $academy->save();

        return $academy->fresh();
    }

    /**
     * Set subscription plan for academy (similar to teacher's setSubscriptionPlan)
     */
    public function setSubscriptionPlan(string $academyId, array $data): Academy
    {
        $academy = Academy::findOrFail($academyId);

        $type = $data['type']; // 'trial', 'term', 'custom'
        $academy->plan_type = $type;
        
        // Calculate duration in months
        $durationMonths = 1;
        if ($type === 'trial' || $type === 'custom') {
            $days = (int) ($data['days'] ?? 0);
            $academy->plan_expires_at = now()->addDays($days);
            $durationMonths = max(1, ceil($days / 30));
        } elseif ($type === 'term') {
            $months = (int) ($data['months'] ?? 6);
            $academy->plan_expires_at = now()->addMonths($months);
            $durationMonths = $months;
        }

        // Student Limits
        if (!empty($data['is_unlimited_students'])) {
            $academy->plan_max_students = null;
            $academy->is_unlimited_students = true;
        } else {
            $academy->plan_max_students = (int) ($data['max_students'] ?? 0);
            $academy->is_unlimited_students = false;
        }

        // Calculate total subscription fee (package price) - 0 for trial plans
        if ($type === 'trial') {
            $academy->subscription_fee = 0;
            $academy->paid_amount = 0;
        } else {
            $pricePerStudent = HelperService::getAcademyStudentPrice();
            if ($pricePerStudent <= 0) $pricePerStudent = 20; // Fallback

            $maxStudents = $academy->plan_max_students ?? 0;
            $academy->subscription_fee = $maxStudents * $durationMonths * $pricePerStudent;
            // Reset paid_amount when a new plan is set (fresh plan starts unpaid)
            $academy->paid_amount = 0;
        }

        // If admin marks as paid, set paid_amount = subscription_fee
        if (!empty($data['is_paid']) && $type !== 'trial') {
            $academy->paid_amount = $academy->subscription_fee;
        }

        $academy->save();

        return $academy;
    }

    /**
     * Get or create subscription for academy for a specific month
     * Same logic as TeacherService::getSubscriptionForMonth
     */
    public function getSubscriptionForMonth(string $academyId, string $month): AcademySubscription
    {
        $academy = Academy::findOrFail($academyId);
        // Ensure month is YYYY-MM-01
        $date = Carbon::parse($month)->startOfMonth();
        $monthDate = $date->format('Y-m-d');
        $pricePerSeat = HelperService::getAcademyStudentPrice();

        $subscription = $academy->academySubscriptions()->firstOrCreate(
            ['month' => $monthDate],
            [
                'student_count' => $this->calculateBillableMonths($academyId, $date),
                'price_per_seat' => $pricePerSeat,
                'amount_due' => $this->calculateAmountDue($academy, $monthDate),
                'amount_paid' => 0,
                'status' => 'pending'
            ]
        );

        // If pending, refresh the calculation to ensure it's up to date
        if ($subscription->status === 'pending') {
            $startOfMonth = Carbon::parse($monthDate)->startOfMonth();
            $endOfMonth = Carbon::parse($monthDate)->endOfMonth();
            
            $billableMonths = $this->calculateBillableMonths($academyId, $startOfMonth, $endOfMonth);
            $currentDue = $billableMonths * $pricePerSeat;
            
            if ($subscription->student_count !== $billableMonths || $subscription->amount_due !== $currentDue || $subscription->price_per_seat !== $pricePerSeat) {
                $subscription->student_count = $billableMonths;
                $subscription->price_per_seat = $pricePerSeat;
                $subscription->amount_due = $currentDue;
                $subscription->save();
            }
        }

        return $subscription;
    }

    /**
     * Pay subscription for academy
     * Same logic as TeacherService::paySubscription
     */
    public function paySubscription(string $academyId, string $month, float $amount): AcademySubscription
    {
        $subscription = $this->getSubscriptionForMonth($academyId, $month);

        if ($amount > 0) {
            $subscription->amount_paid += $amount;
            
            if ($subscription->amount_paid >= $subscription->amount_due) {
                $subscription->status = 'paid';
            } else {
                $subscription->status = 'partial';
            }

            // Generate payment key if not exists (for manual payments tracking)
            if (!$subscription->payment_key) {
                $subscription->payment_key = AcademySubscription::generatePaymentKey();
                $subscription->payment_initiated_at = now();
                $subscription->payment_method = 'manual';
            }
            
            $subscription->save();

            // Sync paid_amount on the academy model (sum of all subscriptions paid)
            $totalPaid = \App\Domains\Auth\Models\AcademySubscription::where('academy_id', $academyId)
                ->sum('amount_paid');
            Academy::where('id', $academyId)->update(['paid_amount' => $totalPaid]);
        }

        return $subscription;
    }

    /**
     * Calculate billable months for academy
     * Same logic as teacher - counts enrollments with payment logs
     */
    private function calculateBillableMonths(string $academyId, Carbon $startOfMonth, ?Carbon $endOfMonth = null): int
    {
        $endOfMonth = $endOfMonth ?? $startOfMonth->copy()->endOfMonth();
        
        // Get active teacher IDs in this academy
        $teacherIds = Academy::findOrFail($academyId)
            ->activeTeachers()
            ->pluck('teachers.id')
            ->toArray();
        
        if (empty($teacherIds)) {
            return 0;
        }
        
        // Sum months from PaymentLog for all teachers in this academy
        return \App\Domains\Subscriptions\Models\PaymentLog::whereIn('teacher_id', $teacherIds)
            ->where('status', 'confirmed')
            ->whereBetween('confirmed_at', [$startOfMonth, $endOfMonth])
            ->sum('months');
    }

    /**
     * Calculate amount due for academy
     * Same logic as teacher - based on active enrollments count
     */
    private function calculateAmountDue(Academy $academy, ?string $month = null): float
    {
        // Get active teacher IDs
        $teacherIds = $academy->activeTeachers()->pluck('teachers.id')->toArray();
        
        if (empty($teacherIds)) {
            return 0;
        }
        
        $query = Enrollment::whereIn('teacher_id', $teacherIds);

        if ($month) {
            $startOfMonth = Carbon::parse($month)->startOfMonth();
            $endOfMonth = Carbon::parse($month)->endOfMonth();
            
            // Consider an enrollment valid for this month if:
            // 1. Created before or during this month
            // 2. Not deleted, OR deleted after the start of this month
            $query->where('created_at', '<=', $endOfMonth)
                  ->where(function($q) use ($startOfMonth) {
                      $q->whereNull('deleted_at')
                        ->orWhere('deleted_at', '>=', $startOfMonth);
                  });
            $query->withTrashed();
        } else {
             // If no month specified, use current active ones
             $query->whereNull('deleted_at');
        }

        $totalSeats = $query->count();
        $price = HelperService::getAcademyStudentPrice();
        
        return (float) ($totalSeats * $price);
    }

    /**
     * Get all academy subscriptions with pagination
     */
    public function getAcademySubscriptions(string $academyId, int $perPage = 12): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $academy = Academy::findOrFail($academyId);
        
        return $academy->academySubscriptions()
            ->orderBy('month', 'desc')
            ->paginate($perPage);
    }
}
