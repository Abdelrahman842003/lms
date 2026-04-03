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
use App\Domains\Application\Services\HelperService;
use Filament\Notifications\Notification;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use InvalidArgumentException;

class SubscriptionRenewalService
{
    public function __construct(
        private readonly StorageQuotaService $storageQuota,
    ) {}
    public const PLAN_TRIAL = 'trial';
    public const PLAN_MONTHLY = 'monthly';
    public const PLAN_QUARTERLY = 'quarterly';
    public const PLAN_SEMI_ANNUAL = 'semi_annual';
    public const PLAN_ANNUAL = 'annual';
    public const PLAN_CUSTOM = 'custom';

    public const REQUEST_TYPE_RENEWAL = 'renewal';
    public const REQUEST_TYPE_UPGRADE = 'upgrade';

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

    public function createRenewalRequest(Model $subscriber, string $planSelection, ?int $customMonths = null, array $upgradePayload = []): Subscription
    {
        $meta = $this->resolvePlanMeta($planSelection, $customMonths);
        $seatsUsed = $this->getSeatsUsed($subscriber);
        $quotaLimit = $this->getQuotaLimit($subscriber);
        $pricePerSeat = $this->getPricePerSeat($subscriber);
        $storagePricePerGb = $this->getStoragePricePerGb($subscriber);
        $currentStorageLimitGb = $this->getStorageLimitGb($subscriber);

        $upgrade = $this->resolveUpgradePayload($subscriber, $upgradePayload, $quotaLimit, $currentStorageLimitGb);
        $targetQuotaLimit = $upgrade['target_quota_limit'];
        $targetStorageLimitGb = $upgrade['target_storage_limit_gb'];

        $baseFinancials = $this->calculateFinancials($seatsUsed, $quotaLimit, $currentStorageLimitGb, $pricePerSeat, $storagePricePerGb, (int) $meta['months']);
        $targetFinancials = $this->calculateFinancials($seatsUsed, $targetQuotaLimit, $targetStorageLimitGb, $pricePerSeat, $storagePricePerGb, (int) $meta['months']);

        $amountDue = $targetFinancials['total'];
        $priceDifference = round(max(0, $targetFinancials['total'] - $baseFinancials['total']), 2);
        $requestType = ($upgrade['upgrade_seats'] || $upgrade['upgrade_storage'])
            ? self::REQUEST_TYPE_UPGRADE
            : self::REQUEST_TYPE_RENEWAL;

        $startDate = $this->resolveNextStartDate($subscriber);
        $month = $startDate->copy()->startOfMonth();

        $notes = $this->buildNotes(
            $meta['label'],
            (int) $meta['months'],
            $customMonths,
            $targetStorageLimitGb,
            $targetFinancials['storage_amount'],
            $requestType,
            [
                'upgrade_seats' => $upgrade['upgrade_seats'],
                'upgrade_storage' => $upgrade['upgrade_storage'],
                'current_quota_limit' => $quotaLimit,
                'target_quota_limit' => $targetQuotaLimit,
                'current_storage_limit_gb' => $currentStorageLimitGb,
                'target_storage_limit_gb' => $targetStorageLimitGb,
                'price_difference' => $priceDifference,
            ]
        );

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
                'request_type' => $requestType,
                'upgrade_seats_from' => $upgrade['upgrade_seats'] ? $quotaLimit : null,
                'upgrade_seats_to' => $upgrade['upgrade_seats'] ? $targetQuotaLimit : null,
                'upgrade_storage_from_gb' => $upgrade['upgrade_storage'] ? $currentStorageLimitGb : null,
                'upgrade_storage_to_gb' => $upgrade['upgrade_storage'] ? $targetStorageLimitGb : null,
                'upgrade_price_difference' => $priceDifference,
                'upgrade_reviewed_at' => null,
                'upgrade_reviewed_by' => null,
                'upgrade_rejection_reason' => null,
            ]
        );

        $this->notifyAdminsOfRenewal($subscription, $meta['label'], $requestType);

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

        $subscriberData = [
            'plan_type' => $meta['plan_type'],
            'subscription_period' => $meta['subscription_period'],
            'plan_expires_at' => $expiresAt,
            'subscription_fee' => (float) $subscription->amount_due,
            'paid_amount' => (float) $subscription->amount_due,
        ];

        if ($subscription->request_type === self::REQUEST_TYPE_UPGRADE) {
            if ($subscription->upgrade_seats_to !== null) {
                $subscriberData['plan_max_students'] = (int) $subscription->upgrade_seats_to;
                $subscriberData['is_unlimited_students'] = false;
            }

            if ($subscription->upgrade_storage_to_gb !== null) {
                $subscriberData['storage_limit_gb'] = (int) $subscription->upgrade_storage_to_gb;
            }
        }

        $subscriber->forceFill($subscriberData)->save();

        $subscription->forceFill([
            'status' => SubscriptionStatus::PAID->value,
            'amount_paid' => $subscription->amount_due,
            'paid_at' => now(),
            'request_type' => self::REQUEST_TYPE_RENEWAL,
            'quota_limit' => $subscription->upgrade_seats_to !== null
                ? (int) $subscription->upgrade_seats_to
                : $subscription->quota_limit,
            'upgrade_reviewed_at' => now(),
            'upgrade_reviewed_by' => auth()->id(),
        ])->save();

        $this->notifySubscriberOfDecision($subscription, $subscriber, true);
    }

    public function rejectRenewal(Subscription $subscription, ?string $reason = null): void
    {
        $subscription->forceFill([
            'status' => SubscriptionStatus::CANCELLED->value,
            'upgrade_reviewed_at' => now(),
            'upgrade_reviewed_by' => auth()->id(),
            'upgrade_rejection_reason' => $reason,
        ])->save();

        $subscriber = $subscription->subscriber;
        if ($subscriber) {
            $this->notifySubscriberOfDecision($subscription, $subscriber, false, $reason);
        }
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
            'price_per_storage_gb' => $this->getStoragePricePerGb($subscriber),
            'amount_due' => (float) (data_get($subscriber, 'subscription_fee') ?? 0),
            'amount_paid' => (float) (data_get($subscriber, 'paid_amount') ?? 0),
            'storage' => ($subscriber instanceof Teacher || $subscriber instanceof Academy)
                ? $this->storageQuota->getStorageSnapshot($subscriber)
                : null,
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

    private function getStoragePricePerGb(Model $subscriber): float
    {
        return $subscriber instanceof Academy
            ? HelperService::getAcademyStoragePricePerGb()
            : HelperService::getTeacherStoragePricePerGb();
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

        return Carbon::today();
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

        return Carbon::today();
    }

    private function calculateExpiryDate(Carbon $baseDate, array $meta): Carbon
    {
        if (($meta['days'] ?? 0) > 0) {
            return $baseDate->copy()->addDays((int) $meta['days']);
        }

        return $baseDate->copy()->addMonths((int) ($meta['months'] ?? 1));
    }

    private function buildNotes(
        string $label,
        int $months,
        ?int $customMonths,
        int $storageLimitGb = 0,
        float $storageAmount = 0.0,
        string $requestType = self::REQUEST_TYPE_RENEWAL,
        array $upgrade = []
    ): string
    {
        $notes = [
            "نوع الطلب: " . ($requestType === self::REQUEST_TYPE_UPGRADE ? 'طلب ترقية' : 'تجديد'),
            "نوع الاشتراك: {$label}",
        ];

        if ($customMonths !== null) {
            $notes[] = "عدد الشهور: {$customMonths}";
        } elseif ($months > 0) {
            $notes[] = "عدد الشهور: {$months}";
        }

        if ($storageLimitGb > 0) {
            $notes[] = "تخزين: {$storageLimitGb} GB × {$months} شهر = " . number_format($storageAmount, 2) . ' ج.م';
        }

        if (($upgrade['upgrade_seats'] ?? false) === true) {
            $notes[] = 'ترقية المقاعد: ' . ($upgrade['current_quota_limit'] ?? 0) . ' → ' . ($upgrade['target_quota_limit'] ?? 0);
        }

        if (($upgrade['upgrade_storage'] ?? false) === true) {
            $notes[] = 'ترقية التخزين: ' . ($upgrade['current_storage_limit_gb'] ?? 0) . ' GB → ' . ($upgrade['target_storage_limit_gb'] ?? 0) . ' GB';
        }

        if (($upgrade['price_difference'] ?? 0) > 0) {
            $notes[] = 'فرق سعر الترقية: ' . number_format((float) $upgrade['price_difference'], 2) . ' ج.م';
        }

        return implode("\n", $notes);
    }

    private function notifyAdminsOfRenewal(Subscription $subscription, string $label, string $requestType = self::REQUEST_TYPE_RENEWAL): void
    {
        $subscriberName = (string) ($subscription->subscriber?->name ?? 'مشترك');
        $typeLabel = $subscription->type?->label() ?? 'اشتراك';

        $isUpgradeRequest = $requestType === self::REQUEST_TYPE_UPGRADE;
        $title = $isUpgradeRequest ? 'طلب ترقية اشتراك جديد' : 'طلب تجديد اشتراك جديد';
        $body = $isUpgradeRequest
            ? "طلب ترقية {$typeLabel} من {$subscriberName} ({$label}) بانتظار الموافقة."
            : "طلب {$typeLabel} من {$subscriberName} ({$label}) بانتظار الموافقة.";

        Admin::query()->get()->each(function (Admin $admin) use ($title, $body, $subscription): void {
            // Generate UUID once for this notification
            $notificationId = (string) \Illuminate\Support\Str::uuid();

            // Save to Filament DB notifications (bell icon in admin panel)
            Notification::make()
                ->title($title)
                ->body($body)
                ->sendToDatabase($admin);

            // Broadcast real-time via Reverb using the same UUID
            event(new NewNotificationEvent(
                userId: (string) $admin->id,
                userType: 'admin',
                notificationId: $notificationId,
                title: $title,
                message: $body,
                data: ['subscription_id' => $subscription->id],
                type: 'subscription_renewal',
            ));
        });
    }

    private function notifySubscriberOfDecision(
        Subscription $subscription,
        Model $subscriber,
        bool $approved,
        ?string $reason = null,
    ): void {
        $userType = strtolower(class_basename($subscriber));
        if (! in_array($userType, ['teacher', 'academy'], true)) {
            return;
        }

        $isUpgradeRequest = $subscription->request_type === self::REQUEST_TYPE_UPGRADE;
        $requestLabel = $isUpgradeRequest ? 'طلب الترقية' : 'طلب التجديد';

        $title = $approved
            ? "تمت الموافقة على {$requestLabel}"
            : "تم رفض {$requestLabel}";

        $message = $approved
            ? "تمت الموافقة على {$requestLabel} الخاص بك. يمكنك الآن متابعة تفاصيل الاشتراك من لوحة التحكم."
            : "تم رفض {$requestLabel} الخاص بك." . ($reason ? " سبب الرفض: {$reason}" : '');

        $data = [
            'title' => $title,
            'message' => $message,
            'subscription_id' => (string) $subscription->id,
            'request_type' => $subscription->request_type ?: self::REQUEST_TYPE_RENEWAL,
            'status' => $approved ? SubscriptionStatus::PAID->value : SubscriptionStatus::CANCELLED->value,
            'reason' => $reason,
            'type' => $approved ? 'subscription_request_approved' : 'subscription_request_rejected',
        ];

        try {
            $notificationId = Str::uuid()->toString();

            $subscriber->notifications()->create([
                'id' => $notificationId,
                'type' => 'App\\Notifications\\' . ucfirst($userType) . 'Notification',
                'data' => $data,
                'read_at' => null,
            ]);

            broadcast(new NewNotificationEvent(
                userId: (string) $subscriber->id,
                userType: $userType,
                notificationId: $notificationId,
                title: $title,
                message: $message,
                data: $data,
                type: (string) $data['type'],
            ));
        } catch (\Throwable $e) {
            Log::error('Failed to send subscription decision notification', [
                'subscription_id' => (string) $subscription->id,
                'subscriber_type' => get_class($subscriber),
                'subscriber_id' => (string) ($subscriber->id ?? ''),
                'error' => $e->getMessage(),
            ]);
        }
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

    private function getStorageLimitGb(Model $subscriber): int
    {
        $value = data_get($subscriber, 'storage_limit_gb');
        if (! is_numeric($value)) {
            return 0;
        }

        return max(0, (int) $value);
    }

    private function calculateFinancials(
        int $seatsUsed,
        ?int $quotaLimit,
        int $storageLimitGb,
        float $pricePerSeat,
        float $storagePricePerGb,
        int $months
    ): array {
        $billableSeats = $quotaLimit ?? $seatsUsed;
        if ($billableSeats <= 0) {
            $billableSeats = $seatsUsed;
        }

        $seatsAmount = $months > 0
            ? $billableSeats * $pricePerSeat * $months
            : 0.0;

        $storageAmount = ($months > 0 && $storageLimitGb > 0)
            ? $storageLimitGb * $storagePricePerGb * $months
            : 0.0;

        return [
            'seats_amount' => round($seatsAmount, 2),
            'storage_amount' => round($storageAmount, 2),
            'total' => round($seatsAmount + $storageAmount, 2),
        ];
    }

    private function resolveUpgradePayload(
        Model $subscriber,
        array $upgradePayload,
        ?int $currentQuotaLimit,
        int $currentStorageLimitGb
    ): array {
        $upgradeSeats = (bool) ($upgradePayload['upgrade_seats'] ?? false);
        $upgradeStorage = (bool) ($upgradePayload['upgrade_storage'] ?? false);

        $targetQuotaLimit = $currentQuotaLimit;
        $targetStorageLimitGb = $currentStorageLimitGb;

        if ($upgradeSeats) {
            if ($currentQuotaLimit === null) {
                throw new InvalidArgumentException('لا يمكن طلب ترقية المقاعد لأن الاشتراك الحالي غير محدود المقاعد.');
            }

            $newSeatsLimit = (int) ($upgradePayload['new_seats_limit'] ?? 0);
            if ($newSeatsLimit <= $currentQuotaLimit) {
                throw new InvalidArgumentException('عدد الكراسي الجديد يجب أن يكون أكبر من الحد الحالي.');
            }

            $targetQuotaLimit = $newSeatsLimit;
        }

        if ($upgradeStorage) {
            if ($currentStorageLimitGb <= 0) {
                throw new InvalidArgumentException('لا يمكن طلب ترقية التخزين لأن حد التخزين الحالي غير محدود.');
            }

            $newStorageLimitGb = (int) ($upgradePayload['new_storage_limit_gb'] ?? 0);
            if ($newStorageLimitGb <= $currentStorageLimitGb) {
                throw new InvalidArgumentException('حد التخزين الجديد يجب أن يكون أكبر من الحد الحالي.');
            }

            $targetStorageLimitGb = $newStorageLimitGb;
        }

        return [
            'upgrade_seats' => $upgradeSeats,
            'upgrade_storage' => $upgradeStorage,
            'target_quota_limit' => $targetQuotaLimit,
            'target_storage_limit_gb' => $targetStorageLimitGb,
        ];
    }
}
