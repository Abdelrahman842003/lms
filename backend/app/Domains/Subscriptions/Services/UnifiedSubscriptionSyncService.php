<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Services;

use App\Domains\Application\Models\Setting;
use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Subscriptions\Enums\SubscriptionType;
use App\Domains\Subscriptions\Models\Subscription;
use Carbon\Carbon;

class UnifiedSubscriptionSyncService
{
    public function syncAcademy(Academy $academy): ?Subscription
    {
        if (! $this->shouldSync(
            (string) ($academy->plan_type ?? ''),
            $academy->plan_expires_at,
            (float) ($academy->subscription_fee ?? 0),
            (float) ($academy->paid_amount ?? 0)
        )) {
            return null;
        }

        $month = $this->resolveMonth($academy->plan_expires_at);
        $quotaLimit = $academy->is_unlimited_students ? null : (int) ($academy->plan_max_students ?? 0);
        $amountDue = (float) ($academy->subscription_fee ?? 0);
        $amountPaid = (float) ($academy->paid_amount ?? 0);
        $costPerSeat = $quotaLimit && $quotaLimit > 0
            ? $this->resolvePricePerStudent(SubscriptionType::ACADEMY->value)
            : 0.0;
        $seatsCount = (int) ($academy->total_enrollments_count ?? 0);

        return Subscription::updateOrCreate(
            [
                'subscriber_id' => $academy->id,
                'subscriber_type' => Academy::class,
                'month' => $month->toDateString(),
            ],
            [
                'type' => SubscriptionType::ACADEMY->value,
                'seats_count' => $seatsCount,
                'quota_limit' => $quotaLimit,
                'cost_per_seat' => $costPerSeat,
                'amount_due' => $amountDue,
                'amount_paid' => $amountPaid,
                'status' => $this->resolveStatus($amountDue, $amountPaid),
                'paid_at' => $amountPaid > 0 ? now()->toDateString() : null,
                'notes' => $this->buildNotes((string) ($academy->plan_type ?? '')),
            ]
        );
    }

    public function syncTeacher(Teacher $teacher): ?Subscription
    {
        if (! $this->shouldSync(
            (string) ($teacher->plan_type ?? ''),
            $teacher->plan_expires_at,
            (float) ($teacher->subscription_fee ?? 0),
            (float) ($teacher->paid_amount ?? 0)
        )) {
            return null;
        }

        $month = $this->resolveMonth($teacher->plan_expires_at);
        $quotaLimit = $teacher->is_unlimited_students ? null : (int) ($teacher->plan_max_students ?? 0);
        $amountDue = (float) ($teacher->subscription_fee ?? 0);
        $amountPaid = (float) ($teacher->paid_amount ?? 0);
        $costPerSeat = $quotaLimit && $quotaLimit > 0
            ? $this->resolvePricePerStudent(SubscriptionType::TEACHER->value)
            : 0.0;
        $seatsCount = $teacher->activeEnrollments()->count();

        return Subscription::updateOrCreate(
            [
                'subscriber_id' => $teacher->id,
                'subscriber_type' => Teacher::class,
                'month' => $month->toDateString(),
            ],
            [
                'type' => SubscriptionType::TEACHER->value,
                'seats_count' => $seatsCount,
                'quota_limit' => $quotaLimit,
                'cost_per_seat' => $costPerSeat,
                'amount_due' => $amountDue,
                'amount_paid' => $amountPaid,
                'status' => $this->resolveStatus($amountDue, $amountPaid),
                'paid_at' => $amountPaid > 0 ? now()->toDateString() : null,
                'notes' => $this->buildNotes((string) ($teacher->plan_type ?? '')),
            ]
        );
    }

    private function shouldSync(string $planType, mixed $planExpiresAt, float $amountDue, float $amountPaid): bool
    {
        return $planType !== '' || ! is_null($planExpiresAt) || $amountDue > 0 || $amountPaid > 0;
    }

    private function resolveMonth(mixed $planExpiresAt): Carbon
    {
        if ($planExpiresAt) {
            return Carbon::parse($planExpiresAt)->startOfMonth();
        }

        return now()->startOfMonth();
    }

    /**
     * تحديد حالة الاشتراك بناءً على المبلغ المستحق والمُدفع
     */
    private function resolveStatus(float $amountDue, float $amountPaid): string
    {
        // اشتراك مجاني أو تجريبي (لا يوجد مبلغ مستحق)
        if ($amountDue <= 0) {
            return 'paid'; // الاشتراكات المجانية تُعتبر مدفوعة
        }

        // لا يوجد أي دفعة بعد
        if ($amountPaid <= 0) {
            return 'pending';
        }

        // دفعة جزئية (لم يتم سداد المبلغ كاملاً)
        if ($amountPaid < $amountDue) {
            return 'partial';
        }

        // تم سداد المبلغ كاملاً أو أكثر
        return 'paid';
    }

    private function buildNotes(string $planType): string
    {
        $planLabel = match ($planType) {
            'trial' => 'تجريبي',
            'term' => 'فصلي',
            'custom' => 'مخصص',
            'basic' => 'أساسي',
            'pro' => 'احترافي',
            'enterprise' => 'مؤسسي',
            default => $planType,
        };

        if ($planLabel !== '') {
            return "مزامنة تلقائية للاشتراك - الخطة: {$planLabel}";
        }

        return 'مزامنة تلقائية للاشتراك';
    }

    private function resolvePricePerStudent(string $subscriptionType): float
    {
        $settingKey = $subscriptionType === SubscriptionType::ACADEMY->value
            ? 'academy_price_per_student'
            : 'teacher_price_per_student';

        $defaultValue = $subscriptionType === SubscriptionType::ACADEMY->value ? 40.0 : 60.0;

        $configured = (float) (Setting::where('key', $settingKey)->value('value') ?? 0);

        return $configured > 0 ? round($configured, 2) : $defaultValue;
    }

}
