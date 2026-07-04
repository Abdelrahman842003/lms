<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Services;

use App\Domains\Subscriptions\Models\Subscription;
use App\Domains\Subscriptions\Enums\SubscriptionStatus;
use App\Domains\Application\Models\Setting;
use Illuminate\Support\Carbon;
use Illuminate\Database\Eloquent\Model;

class SubscriptionActivationService
{
    public function __construct(
        private readonly SubscriptionRenewalService $renewalService
    ) {}

    public function activate(Subscription $subscription, string $paymentMethod): void
    {
        $subscriber = $subscription->subscriber;
        if (!$subscriber) {
            return;
        }

        $trialDays = (int) Setting::getValue('trial_period_days', 14);

        // Get months from note/plan
        $planLabel = $this->extractPlanLabelFromNotes((string) $subscription->notes);
        $planSelection = $this->inferPlanSelectionFromLabel($planLabel ?? '');
        $customMonths = $this->extractCustomMonthsFromNotes((string) $subscription->notes);
        $meta = $this->resolvePlanMeta($planSelection ?? 'monthly', $customMonths);

        $baseDate = $this->resolvePlanBaseDate($subscriber);
        $expiresAt = $this->calculateExpiryDate($baseDate, $meta);

        // If this is the subscriber's first paid subscription, add free trial days to the expiry date!
        $isFirstSubscription = $subscriber->subscriptions()
            ->where('status', SubscriptionStatus::PAID->value)
            ->where('id', '!=', $subscription->id)
            ->doesntExist();

        if ($isFirstSubscription) {
            $expiresAt->addDays($trialDays);
            
            // Log/append note about free trial bonus
            $subscription->notes = (string) $subscription->notes . "\nتمت إضافة فترة تجريبية مجانية {$trialDays} يوم.";
        }

        $subscriberData = [
            'plan_type' => $meta['plan_type'],
            'subscription_period' => $meta['subscription_period'],
            'plan_expires_at' => $expiresAt,
            'subscription_fee' => (float) $subscription->amount_due,
            'paid_amount' => (float) $subscription->amount_due,
        ];

        if ($subscription->request_type === 'upgrade') {
            if ($subscription->upgrade_seats_to !== null) {
                $subscriberData['plan_max_students'] = (int) $subscription->upgrade_seats_to;
                $subscriberData['is_unlimited_students'] = false;
            }

            if ($subscription->upgrade_storage_to_gb !== null) {
                $subscriberData['storage_minutes_limit'] = (int) $subscription->upgrade_storage_to_gb;
            }
        }

        $subscriber->forceFill($subscriberData)->save();

        $subscription->forceFill([
            'status' => SubscriptionStatus::PAID->value,
            'amount_paid' => $subscription->amount_due,
            'paid_at' => now(),
            'payment_method' => $paymentMethod,
            'request_type' => 'renewal', // reset request type to renewal after payment
            'quota_limit' => $subscription->upgrade_seats_to !== null
                ? (int) $subscription->upgrade_seats_to
                : $subscription->quota_limit,
            'upgrade_reviewed_at' => now(),
            'upgrade_reviewed_by' => auth()->id(),
        ])->save();

        $this->renewalService->clearSubscriptionCache($subscriber);
    }

    private function extractPlanLabelFromNotes(?string $notes): ?string
    {
        if (! $notes) return null;
        if (preg_match('/نوع الاشتراك\\s*:\\s*([^\\n\\r]+)/u', $notes, $matches) === 1) {
            return trim((string) ($matches[1] ?? ''));
        }
        return null;
    }

    private function extractCustomMonthsFromNotes(?string $notes): ?int
    {
        if (! $notes) return null;
        if (preg_match('/عدد الشهور\\s*:\\s*(\\d+)/u', $notes, $matches) === 1) {
            return (int) ($matches[1] ?? 0) ?: null;
        }
        return null;
    }

    private function inferPlanSelectionFromLabel(string $label): ?string
    {
        if (str_contains($label, 'تجريبي')) return 'trial';
        if (str_contains($label, 'ربع')) return 'quarterly';
        if (str_contains($label, 'نصف')) return 'semi_annual';
        if (str_contains($label, 'سنوي')) return 'annual';
        if (str_contains($label, 'مخصص')) return 'custom';
        return 'monthly';
    }

    private function resolvePlanMeta(string $planSelection, ?int $customMonths): array
    {
        $trialDays = (int) Setting::getValue('trial_period_days', 14);

        return match ($planSelection) {
            'trial' => [
                'months' => 0,
                'days' => $trialDays,
                'plan_type' => 'trial',
                'subscription_period' => null,
            ],
            'quarterly' => [
                'months' => 3,
                'days' => 0,
                'plan_type' => 'term',
                'subscription_period' => 'quarterly',
            ],
            'semi_annual' => [
                'months' => 6,
                'days' => 0,
                'plan_type' => 'term',
                'subscription_period' => 'semi_annual',
            ],
            'annual' => [
                'months' => 12,
                'days' => 0,
                'plan_type' => 'term',
                'subscription_period' => 'annual',
            ],
            'custom' => [
                'months' => max(1, (int) ($customMonths ?? 1)),
                'days' => 0,
                'plan_type' => 'custom',
                'subscription_period' => null,
            ],
            default => [
                'months' => 1,
                'days' => 0,
                'plan_type' => 'term',
                'subscription_period' => 'monthly',
            ],
        };
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
}
