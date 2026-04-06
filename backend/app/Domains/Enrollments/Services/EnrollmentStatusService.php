<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\Services;

use App\Domains\Application\Models\Setting;
use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Models\Enrollment;

class EnrollmentStatusService
{
    /**
     * Get the trial period days for an enrollment.
     * Checks academy-specific setting first, then teacher-specific setting.
     */
    public function getTrialPeriodDays(Enrollment $enrollment): int
    {
        // Enrollment in academy context: use academy-specific setting first.
        if ($enrollment->academy_id) {
            if ($enrollment->relationLoaded('academy') && $enrollment->academy) {
                $academyTrial = (int) ($enrollment->academy->trial_period_days ?? 0);
                if ($academyTrial > 0) {
                    return $academyTrial;
                }
            } else {
                $academyTrial = (int) (Academy::query()->whereKey($enrollment->academy_id)->value('trial_period_days') ?? 0);
                if ($academyTrial > 0) {
                    return $academyTrial;
                }
            }
        }

        // Independent context: use teacher-specific setting.
        if ($enrollment->teacher_id) {
            if ($enrollment->relationLoaded('teacher') && $enrollment->teacher) {
                $teacherTrial = (int) ($enrollment->teacher->trial_period_days ?? 0);
                if ($teacherTrial > 0) {
                    return $teacherTrial;
                }
            } else {
                $teacherTrial = (int) (Teacher::query()->whereKey($enrollment->teacher_id)->value('trial_period_days') ?? 0);
                if ($teacherTrial > 0) {
                    return $teacherTrial;
                }
            }
        }

        // Fallback to global setting when no academy/teacher-specific value exists.
        // Use direct query here to avoid hard dependency on Redis-backed cache in status calculation path.
        $globalTrial = (int) (Setting::query()->where('key', 'trial_period_days')->value('value') ?? 0);
        if ($globalTrial > 0) {
            return $globalTrial;
        }

        // Default to 0 if no trial period is configured
        return 0;
    }

    /**
     * Get the enrollment status.
     */
    public function getStatus(Enrollment $enrollment): string
    {
        $today = now()->startOfDay();
        $trialPeriodDays = $this->getTrialPeriodDays($enrollment);

        // Check trial period for new enrollments (not yet activated)
        if (!$enrollment->is_active && !$enrollment->subscription_end) {
            $trialEndDate = $enrollment->created_at->copy()->addDays($trialPeriodDays)->startOfDay();

            if ($today <= $trialEndDate) {
                return 'trial';
            }

            return 'inactive'; // Trial expired, not activated
        }

        // Manually deactivated by teacher
        if (!$enrollment->is_active) {
            return 'inactive';
        }

        // Active but no subscription yet - check trial period
        if (!$enrollment->subscription_end) {
            $trialEndDate = $enrollment->created_at->copy()->addDays($trialPeriodDays)->startOfDay();

            if ($today <= $trialEndDate) {
                return 'trial';
            }

            return 'inactive'; // Trial expired, no subscription
        }

        $end = $enrollment->subscription_end->startOfDay();

        // Active: Subscription not expired yet
        if ($end >= $today) {
            return 'active';
        }

        // Subscription expired - check post-subscription trial period
        $postSubscriptionTrialEnd = $end->copy()->addDays($trialPeriodDays);
        if ($today <= $postSubscriptionTrialEnd) {
            return 'trial';
        }

        // Grace Period: Trial expired but within 3 days
        $gracePeriodEnd = $postSubscriptionTrialEnd->copy()->addDays(3);
        if ($today <= $gracePeriodEnd) {
            return 'grace_period';
        }

        // Expired: Past all grace periods
        return 'expired';
    }

    /**
     * Get the number of days left in the subscription.
     */
    public function getDaysLeft(Enrollment $enrollment): int
    {
        if (!$enrollment->subscription_end) {
            return 0;
        }

        $today = now()->startOfDay();
        $end = $enrollment->subscription_end->startOfDay();

        return (int) $today->diffInDays($end, false);
    }

    /**
     * Get the trial end date for the enrollment.
     * يشمل فترة التجربة فقط
     */
    public function getTrialEndsAt(Enrollment $enrollment): ?\Illuminate\Support\Carbon
    {
        $trialPeriodDays = $this->getTrialPeriodDays($enrollment);

        // Trial from creation (new enrollment, not activated OR active but no subscription)
        if (!$enrollment->subscription_end) {
            return $enrollment->created_at->copy()
                ->addDays($trialPeriodDays);
        }

        // Trial after subscription ends
        if ($enrollment->subscription_end && now()->gt($enrollment->subscription_end)) {
            return $enrollment->subscription_end->copy()
                ->addDays($trialPeriodDays);
        }

        return null;
    }

    /**
     * Get the grace period end date for the enrollment.
     * Returns the date when the grace period ends (trial + 3 days).
     */
    public function getGracePeriodEndsAt(Enrollment $enrollment): ?\Illuminate\Support\Carbon
    {
        $trialEnd = $this->getTrialEndsAt($enrollment);

        if (!$trialEnd) {
            return null;
        }

        return $trialEnd->copy()->addDays(3);
    }
}
