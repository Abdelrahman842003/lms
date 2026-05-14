<?php

declare(strict_types=1);

namespace App\Filament\Resources\AcademyResource\Pages;

use App\Domains\Application\Models\Setting;
use App\Domains\Subscriptions\Services\UnifiedSubscriptionSyncService;
use App\Filament\Resources\AcademyResource;
use Carbon\Carbon;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditAcademy extends EditRecord {
    
    protected function mutateFormDataBeforeFill(array $data): array
    {
        $planFields = [
            'trial_period_days', 'plan_type', 'subscription_period', 'plan_expires_at',
            'plan_max_students', 'is_unlimited_students', 'subscription_fee',
            'paid_amount', 'storage_minutes_limit', 'delivery_minutes_limit',
            'discount_percent', 'discount_type', 'discount_scope', 'billing_notes'
        ];

        foreach ($planFields as $field) {
            $value = $this->record->getAttribute($field); if ($value instanceof \Carbon\Carbon) { $value = $value->toDateString(); } $data[$field] = $value;
        }

        return $data;
    }
    protected static string $resource = AcademyResource::class;

    protected function mutateFormDataBeforeSave(array $data): array
    {
        $data = $this->normalizeDiscountFields($data);
        $data = $this->hydrateEffectivePaidAmount($data);
        $data = $this->applyPartialBillingWhenDurationUnchanged($data);

        return $data;
    }

    private function normalizeDiscountFields(array $data): array
    {
        $discountType = (string) ($data['discount_type'] ?? '');
        $discountScope = (string) ($data['discount_scope'] ?? '');

        if (! in_array($discountType, ['percent', 'fixed'], true)) {
            $data['discount_type'] = 'percent';
        }

        if (! in_array($discountScope, ['general', 'students', 'storage'], true)) {
            $data['discount_scope'] = 'general';
        }

        if (! isset($data['discount_percent']) || $data['discount_percent'] === '') {
            $data['discount_percent'] = 0;
        }

        return $data;
    }

    private function applyPartialBillingWhenDurationUnchanged(array $data): array
    {
        if ($this->hasDurationChange($data)) {
            return $data;
        }

        $remainingMonths = $this->resolveRemainingMonths($this->record->plan_expires_at);

        $oldFeeForRemaining = $this->calculateAcademyFeeForMonths([
            'plan_max_students' => $this->record->plan_max_students,
            'storage_minutes_limit' => $this->record->storage_minutes_limit,
            'delivery_minutes_limit' => $this->record->delivery_minutes_limit,
            'discount_percent' => $this->record->discount_percent,
            'discount_type' => $this->record->discount_type,
            'discount_scope' => $this->record->discount_scope,
        ], $remainingMonths);

        $newFeeForRemaining = $this->calculateAcademyFeeForMonths($data, $remainingMonths);
        $difference = round($newFeeForRemaining - $oldFeeForRemaining, 2);

        [$normalizedPlanType, $normalizedSubscriptionPeriod] = $this->resolveNormalizedDurationState();

        $data['plan_type'] = $normalizedPlanType;
        $data['subscription_period'] = $normalizedSubscriptionPeriod;
        $data['plan_expires_at'] = $this->normalizeDateString($this->record->plan_expires_at);
        $effectivePaid = max(0, round((float) ($data['paid_amount'] ?? $this->record->paid_amount ?? 0), 2));
        $data['subscription_fee'] = max(
            $effectivePaid,
            round((float) ($this->record->subscription_fee ?? 0) + $difference, 2)
        );

        if ($difference !== 0.0) {
            $line = sprintf('تسوية تعديل الباقة على المدة المتبقية (%d شهر): %+0.2f ج.م', $remainingMonths, $difference);
            $existing = trim((string) ($data['billing_notes'] ?? $this->record->billing_notes ?? ''));
            $data['billing_notes'] = $existing !== ''
                ? $existing . "\n" . $line
                : $line;
        }

        return $data;
    }

    private function resolveNormalizedDurationState(): array
    {
        $planType = (string) ($this->record->plan_type ?? '');
        $subscriptionPeriod = (string) ($this->record->subscription_period ?? '');

        if ($subscriptionPeriod !== '' || $planType !== 'trial') {
            return [$planType, $subscriptionPeriod !== '' ? $subscriptionPeriod : null];
        }

        $inferredPeriod = $this->inferSubscriptionPeriodFromSnapshot(
            $this->record->plan_expires_at,
            (float) ($this->record->subscription_fee ?? 0),
            (float) ($this->record->paid_amount ?? 0)
        );

        if ($inferredPeriod !== null) {
            return ['term', $inferredPeriod];
        }

        return [$planType, null];
    }

    private function inferSubscriptionPeriodFromSnapshot(mixed $planExpiresAt, float $amountDue, float $amountPaid): ?string
    {
        if (empty($planExpiresAt)) {
            return null;
        }

        $expiry = Carbon::parse($planExpiresAt)->startOfDay();
        $today = now()->startOfDay();
        $daysRemaining = (int) $today->diffInDays($expiry, false);

        if ($daysRemaining <= 0) {
            return null;
        }

        $trialDays = (int) \App\Domains\Application\Services\HelperService::getTrialPeriodDays();
        if ($amountDue <= 0.0 && $amountPaid <= 0.0 && $daysRemaining <= ($trialDays + 1)) {
            return null;
        }

        return match (true) {
            $daysRemaining <= 45 => 'monthly',
            $daysRemaining <= 135 => 'quarterly',
            $daysRemaining <= 225 => 'semi_annual',
            $daysRemaining <= 450 => 'annual',
            default => null,
        };
    }

    private function hasDurationChange(array $data): bool
    {
        $currentPlanType = (string) ($this->record->plan_type ?? '');
        $currentSubscriptionPeriod = (string) ($this->record->subscription_period ?? '');
        $currentExpiry = $this->normalizeDateString($this->record->plan_expires_at);

        $newPlanType = (string) ($data['plan_type'] ?? $currentPlanType);
        $newSubscriptionPeriod = (string) ($data['subscription_period'] ?? $currentSubscriptionPeriod);
        $newExpiry = $this->normalizeDateString($data['plan_expires_at'] ?? $currentExpiry);

        return $newPlanType !== $currentPlanType
            || $newSubscriptionPeriod !== $currentSubscriptionPeriod
            || $newExpiry !== $currentExpiry;
    }

    private function resolveRemainingMonths(mixed $planExpiresAt): int
    {
        if (empty($planExpiresAt)) {
            return 1;
        }

        $expiry = Carbon::parse($planExpiresAt)->startOfDay();
        $today = now()->startOfDay();
        $daysRemaining = (int) $today->diffInDays($expiry, false);

        if ($daysRemaining <= 0) {
            return 1;
        }

        return max(1, (int) ceil($daysRemaining / 30));
    }

    private function calculateAcademyFeeForMonths(array $payload, int $months): float
    {
        [$pricePerStudent, $storagePriceMin, $deliveryPriceMin] = $this->resolveAcademyPrices();

        $students = (int) ($payload['plan_max_students'] ?? 0);
        $storageMinutes = (int) ($payload['storage_minutes_limit'] ?? 0);
        $deliveryMinutes = (int) ($payload['delivery_minutes_limit'] ?? 0);
        
        $seatsAmount = $students * $months * $pricePerStudent;
        $streamAmount = ($storageMinutes * $storagePriceMin + $deliveryMinutes * $deliveryPriceMin) * $months;
        $gross = $seatsAmount + $streamAmount;

        $discountValue = (float) ($payload['discount_percent'] ?? 0);
        $discountType = (string) ($payload['discount_type'] ?? 'percent');
        $discountScope = (string) ($payload['discount_scope'] ?? 'general');

        $discountableAmount = match ($discountScope) {
            'students' => $seatsAmount,
            'storage' => $streamAmount,
            default => $gross,
        };

        $discountAmount = $discountType === 'fixed'
            ? min($discountableAmount, max(0, $discountValue))
            : ($discountableAmount * max(0, min(100, $discountValue)) / 100);

        return max(0, round($gross - $discountAmount, 2));
    }

    private function resolveAcademyPrices(): array
    {
        try {
            $pricePerStudent = \App\Domains\Application\Services\HelperService::getAcademyPricePerStudent();
            $storagePriceMin = \App\Domains\Application\Services\HelperService::getAcademyStoragePricePerMinute();
            $deliveryPriceMin = \App\Domains\Application\Services\HelperService::getAcademyDeliveryPricePerMinute();
        } catch (\Throwable $exception) {
            $pricePerStudent = 40;
            $storagePriceMin = 0.5;
            $deliveryPriceMin = 0.1;
        }

        return [$pricePerStudent, $storagePriceMin, $deliveryPriceMin];
    }

    private function normalizeDateString(mixed $value): ?string
    {
        if (empty($value)) {
            return null;
        }

        return Carbon::parse($value)->toDateString();
    }

    private function hydrateEffectivePaidAmount(array $data): array
    {
        $latestSubscriptionPaid = (float) ($this->record->latestSubscription?->amount_paid ?? 0);
        $recordPaid = (float) ($this->record->paid_amount ?? 0);
        $formPaid = isset($data['paid_amount']) ? (float) $data['paid_amount'] : 0.0;

        $data['paid_amount'] = max(0, round(max($latestSubscriptionPaid, $recordPaid, $formPaid), 2));

        return $data;
    }

    protected function afterSave(): void
    {
        app(UnifiedSubscriptionSyncService::class)->syncAcademy($this->record);
    }

    protected function getHeaderActions(): array
    {
        return [
            Actions\ViewAction::make()
                ->label('عرض'),
            Actions\DeleteAction::make()
                ->label('حذف'),
        ];
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }

    public function getTitle(): string
    {
        return 'تعديل الأكاديمية: ' . $this->record->name;
    }
}
