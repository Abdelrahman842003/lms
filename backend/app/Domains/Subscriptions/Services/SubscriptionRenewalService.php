<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Services;

use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Notifications\Events\NewNotificationEvent;
use App\Domains\Subscriptions\Enums\SubscriptionStatus;
use App\Domains\Subscriptions\Enums\SubscriptionType;
use App\Domains\Subscriptions\Models\Subscription;
use App\Domains\Support\Services\HelperService;
use Filament\Notifications\Notification;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class SubscriptionRenewalService
{
    public const PLAN_TRIAL = 'trial';
    public const PLAN_MONTHLY = 'monthly';
    public const PLAN_QUARTERLY = 'quarterly';
    public const PLAN_SEMI_ANNUAL = 'semi_annual';
    public const PLAN_ANNUAL = 'annual';
    public const PLAN_CUSTOM = 'custom';

    /**
     * @return array<int, array<string, mixed>>
     */
    public function planOptions(): array
    {
        $trialDays = HelperService::getTrialPeriodDays();

        return [
            ['value' => self::PLAN_TRIAL, 'label' => "تجريبي ({$trialDays} يوم)", 'trial_days' => $trialDays],
            ['value' => self::PLAN_MONTHLY, 'label' => 'شهري (1 شهر)', 'months' => 1],
            ['value' => self::PLAN_QUARTERLY, 'label' => 'ربع سنوي (3 شهور)', 'months' => 3],
            ['value' => self::PLAN_SEMI_ANNUAL, 'label' => 'نصف سنوي (6 شهور)', 'months' => 6],
            ['value' => self::PLAN_ANNUAL, 'label' => 'سنوي (1 سنة)', 'months' => 12],
            ['value' => self::PLAN_CUSTOM, 'label' => 'مخصص (Custom)', 'months' => null],
        ];
    }

    public function createRenewalRequest(Model $subscriber, string $planSelection, ?int $customMonths = null): Subscription
    {
        $meta = $this->resolvePlanMeta($planSelection, $customMonths);
        $seatsUsed = $this->getSeatsUsed($subscriber);
        $quotaLimit = $this->getQuotaLimit($subscriber);
        $pricePerSeat = $this->getPricePerSeat($subscriber);

        $billableSeats = $quotaLimit ?? $seatsUsed;
        if ($billableSeats <= 0) {
            $billableSeats = $seatsUsed;
        }

        $amountDue = $meta['months'] > 0
            ? $billableSeats * $pricePerSeat * $meta['months']
            : 0.0;

        $amountDue = round($amountDue, 2);

        $startDate = $this->resolveNextStartDate($subscriber);
        $month = $startDate->copy()->startOfMonth();

        $notes = $this->buildNotes($meta['label'], $meta['months'], $customMonths);

        $subscription = Subscription::updateOrCreate(
            [
                'subscriber_id' => $subscriber->getKey(),
                'subscriber_type' => get_class($subscriber),
                'month' => $month->toDateString(),
            ],
            [
                'type' => $this->getSubscriptionType($subscriber)->value,
                'seats_count' => $seatsUsed,
                'quota_limit' => $quotaLimit,
                'cost_per_seat' => $pricePerSeat,
                'amount_due' => $amountDue,
                'amount_paid' => 0,
                'status' => SubscriptionStatus::PENDING->value,
                'notes' => $notes,
            ]
        );

        $this->notifyAdminsOfRenewal($subscription, $meta['label']);

        return $subscription;
    }

    public function approveRenewal(Subscription $subscription, ?int $customMonths = null): void
    {
        $subscriber = $subscription->subscriber;
        if (! $subscriber) {
            return;
        }

        $planLabel = $this->extractPlanLabelFromNotes((string) $subscription->notes);
        $planSelection = $this->inferPlanSelectionFromLabel($planLabel ?? '');
        $customMonths = $customMonths ?? $this->extractCustomMonthsFromNotes((string) $subscription->notes);
        $meta = $this->resolvePlanMeta($planSelection ?? self::PLAN_MONTHLY, $customMonths);

        $baseDate = $this->resolvePlanBaseDate($subscriber);
        $expiresAt = $this->calculateExpiryDate($baseDate, $meta);

        $subscriber->forceFill([
            'plan_type' => $meta['plan_type'],
            'subscription_period' => $meta['subscription_period'],
            'plan_expires_at' => $expiresAt,
            'subscription_fee' => (float) $subscription->amount_due,
            'paid_amount' => (float) $subscription->amount_due,
        ])->save();

        $subscription->forceFill([
            'status' => SubscriptionStatus::PAID->value,
            'amount_paid' => $subscription->amount_due,
            'paid_at' => now(),
        ])->save();
    }

    /**
     * @return array<string, mixed>
     */
    public function getSubscriptionSnapshot(Model $subscriber): array
    {
        $seatsUsed = $this->getSeatsUsed($subscriber);
        $quotaLimit = $this->getQuotaLimit($subscriber);
        $pricePerSeat = $this->getPricePerSeat($subscriber);

        $planType = (string) data_get($subscriber, 'plan_type', '');
        $subscriptionPeriod = (string) data_get($subscriber, 'subscription_period', '');
        $planLabel = $this->resolvePlanLabel($planType, $subscriptionPeriod);

        $planExpiresAt = $subscriber->plan_expires_at ? Carbon::parse($subscriber->plan_expires_at)->startOfDay() : null;
        $planStartsAt = $this->inferPlanStartDate($planExpiresAt, $planType, $subscriptionPeriod);
        $daysRemaining = $planExpiresAt ? now()->startOfDay()->diffInDays($planExpiresAt, false) : null;

        $status = 'inactive';
        if ($planType === 'trial') {
            $status = 'trial';
        } elseif ($planExpiresAt) {
            $status = $daysRemaining !== null && $daysRemaining >= 0 ? 'active' : 'expired';
        }

        return [
            'status' => $status,
            'plan_type' => $planType,
            'subscription_period' => $subscriptionPeriod,
            'plan_label' => $planLabel,
            'starts_at' => $planStartsAt?->format('Y-m-d'),
            'ends_at' => $planExpiresAt?->format('Y-m-d'),
            'days_remaining' => $daysRemaining,
            'is_trial' => $planType === 'trial',
            'seats_used' => $seatsUsed,
            'seats_limit' => $quotaLimit,
            'is_unlimited' => data_get($subscriber, 'is_unlimited_students', false) || $quotaLimit === null,
            'price_per_seat' => $pricePerSeat,
            'amount_due' => (float) (data_get($subscriber, 'subscription_fee') ?? 0),
            'amount_paid' => (float) (data_get($subscriber, 'paid_amount') ?? 0),
        ];
    }

    public function getPendingRenewal(Model $subscriber): ?Subscription
    {
        return Subscription::query()
            ->where('subscriber_id', $subscriber->getKey())
            ->where('subscriber_type', get_class($subscriber))
            ->where('status', SubscriptionStatus::PENDING->value)
            ->orderByDesc('created_at')
            ->first();
    }

    private function resolvePlanMeta(string $planSelection, ?int $customMonths): array
    {
        $trialDays = HelperService::getTrialPeriodDays();

        return match ($planSelection) {
            self::PLAN_TRIAL => [
                'label' => "تجريبي ({$trialDays} يوم)",
                'months' => 0,
                'days' => $trialDays,
                'plan_type' => 'trial',
                'subscription_period' => null,
            ],
            self::PLAN_QUARTERLY => [
                'label' => 'ربع سنوي (3 شهور)',
                'months' => 3,
                'days' => 0,
                'plan_type' => 'term',
                'subscription_period' => 'quarterly',
            ],
            self::PLAN_SEMI_ANNUAL => [
                'label' => 'نصف سنوي (6 شهور)',
                'months' => 6,
                'days' => 0,
                'plan_type' => 'term',
                'subscription_period' => 'semi_annual',
            ],
            self::PLAN_ANNUAL => [
                'label' => 'سنوي (1 سنة)',
                'months' => 12,
                'days' => 0,
                'plan_type' => 'term',
                'subscription_period' => 'annual',
            ],
            self::PLAN_CUSTOM => [
                'label' => 'مخصص (Custom)',
                'months' => max(1, (int) ($customMonths ?? 1)),
                'days' => 0,
                'plan_type' => 'custom',
                'subscription_period' => null,
            ],
            default => [
                'label' => 'شهري (1 شهر)',
                'months' => 1,
                'days' => 0,
                'plan_type' => 'term',
                'subscription_period' => 'monthly',
            ],
        };
    }

    private function getSubscriptionType(Model $subscriber): SubscriptionType
    {
        return $subscriber instanceof Academy
            ? SubscriptionType::ACADEMY
            : SubscriptionType::TEACHER;
    }

    private function getSeatsUsed(Model $subscriber): int
    {
        if ($subscriber instanceof Academy) {
            return (int) ($subscriber->total_students_count ?? 0);
        }

        if ($subscriber instanceof Teacher) {
            return (int) $subscriber->activeEnrollments()->count();
        }

        return 0;
    }

    private function getQuotaLimit(Model $subscriber): ?int
    {
        if ((bool) data_get($subscriber, 'is_unlimited_students', false)) {
            return null;
        }

        $limit = data_get($subscriber, 'plan_max_students');
        return $limit !== null ? (int) $limit : null;
    }

    private function getPricePerSeat(Model $subscriber): float
    {
        return $subscriber instanceof Academy
            ? HelperService::getAcademyPricePerStudent()
            : HelperService::getTeacherPricePerStudent();
    }

    private function resolveNextStartDate(Model $subscriber): Carbon
    {
        $expiresAt = data_get($subscriber, 'plan_expires_at');
        if ($expiresAt) {
            $date = Carbon::parse($expiresAt)->startOfDay()->addDay();
            if ($date->greaterThan(now())) {
                return $date;
            }
        }

        return now()->startOfDay();
    }

    private function resolvePlanBaseDate(Model $subscriber): Carbon
    {
        $expiresAt = data_get($subscriber, 'plan_expires_at');
        if ($expiresAt) {
            $date = Carbon::parse($expiresAt)->startOfDay();
            if ($date->greaterThan(now())) {
                return $date;
            }
        }

        return now()->startOfDay();
    }

    private function calculateExpiryDate(Carbon $baseDate, array $meta): Carbon
    {
        if (($meta['days'] ?? 0) > 0) {
            return $baseDate->copy()->addDays((int) $meta['days']);
        }

        return $baseDate->copy()->addMonths((int) ($meta['months'] ?? 1));
    }

    private function buildNotes(string $label, int $months, ?int $customMonths): string
    {
        $notes = ["نوع الاشتراك: {$label}"];

        if ($customMonths !== null) {
            $notes[] = "عدد الشهور: {$customMonths}";
        } elseif ($months > 0) {
            $notes[] = "عدد الشهور: {$months}";
        }

        return implode("\n", $notes);
    }

    private function notifyAdminsOfRenewal(Subscription $subscription, string $label): void
    {
        $subscriberName = (string) ($subscription->subscriber?->name ?? 'مشترك');
        $typeLabel = $subscription->type?->label() ?? 'اشتراك';

        $title = 'طلب تجديد اشتراك جديد';
        $body = "طلب {$typeLabel} من {$subscriberName} ({$label}) بانتظار الموافقة.";

        Admin::query()->get()->each(function (Admin $admin) use ($title, $body, $subscription): void {
            // Save to Filament DB notifications (bell icon in admin panel)
            Notification::make()
                ->title($title)
                ->body($body)
                ->sendToDatabase($admin);

            // Get the latest stored notification ID for broadcasting
            $dbNotification = $admin->notifications()->latest()->first();

            // Broadcast real-time via Reverb
            event(new NewNotificationEvent(
                userId: (string) $admin->id,
                userType: 'admin',
                notificationId: $dbNotification?->id ?? (string) \Illuminate\Support\Str::uuid(),
                title: $title,
                message: $body,
                data: ['subscription_id' => $subscription->id],
                type: 'subscription_renewal',
            ));
        });
    }

    private function extractPlanLabelFromNotes(?string $notes): ?string
    {
        if (! $notes) {
            return null;
        }

        if (preg_match('/نوع الاشتراك\\s*:\\s*([^\\n\\r]+)/u', $notes, $matches) === 1) {
            $label = trim((string) ($matches[1] ?? ''));
            return $label !== '' ? $label : null;
        }

        return null;
    }

    private function extractCustomMonthsFromNotes(?string $notes): ?int
    {
        if (! $notes) {
            return null;
        }

        if (preg_match('/عدد الشهور\\s*:\\s*(\\d+)/u', $notes, $matches) === 1) {
            return (int) ($matches[1] ?? 0) ?: null;
        }

        return null;
    }

    private function inferPlanSelectionFromLabel(string $label): ?string
    {
        return match ($label) {
            'تجريبي' => self::PLAN_TRIAL,
            default => match (true) {
                str_contains($label, 'تجريبي') => self::PLAN_TRIAL,
                str_contains($label, 'ربع') => self::PLAN_QUARTERLY,
                str_contains($label, 'نصف') => self::PLAN_SEMI_ANNUAL,
                str_contains($label, 'سنوي') => self::PLAN_ANNUAL,
                str_contains($label, 'مخصص') => self::PLAN_CUSTOM,
                default => self::PLAN_MONTHLY,
            },
        };
    }

    private function resolvePlanLabel(string $planType, string $subscriptionPeriod): string
    {
        if ($planType === 'trial') {
            return 'تجريبي';
        }

        if ($planType === 'custom') {
            return 'مخصص (Custom)';
        }

        if ($planType === 'term') {
            return match ($subscriptionPeriod) {
                'monthly' => 'شهري (1 شهر)',
                'quarterly' => 'ربع سنوي (3 شهور)',
                'semi_annual' => 'نصف سنوي (6 شهور)',
                'annual' => 'سنوي (1 سنة)',
                default => 'دوري',
            };
        }

        return 'غير محدد';
    }

    private function inferPlanStartDate(?Carbon $expiresAt, string $planType, string $subscriptionPeriod): ?Carbon
    {
        if (! $expiresAt) {
            return null;
        }

        if ($planType === 'trial') {
            $trialDays = HelperService::getTrialPeriodDays();
            return $expiresAt->copy()->subDays($trialDays);
        }

        if ($planType === 'term') {
            $months = match ($subscriptionPeriod) {
                'monthly' => 1,
                'quarterly' => 3,
                'semi_annual' => 6,
                'annual' => 12,
                default => null,
            };

            if ($months) {
                return $expiresAt->copy()->subMonths($months);
            }
        }

        return null;
    }
}
