<?php

declare(strict_types=1);

namespace App\Filament\Resources\SubscriptionResource\Pages;

use App\Domains\Application\Models\Setting;
use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Subscriptions\Enums\SubscriptionType;
use App\Domains\Subscriptions\Services\UnifiedSubscriptionSyncService;
use App\Filament\Resources\SubscriptionResource;
use Carbon\Carbon;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditSubscription extends EditRecord
{
    protected static string $resource = SubscriptionResource::class;

    public function getTitle(): string
    {
        return 'تعديل الاشتراك';
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }

    protected function getSavedNotificationTitle(): ?string
    {
        return 'تم تحديث الاشتراك بنجاح';
    }

    protected function mutateFormDataBeforeSave(array $data): array
    {
        $subscriber = $this->record->subscriber;

        if (! $subscriber instanceof Teacher && ! $subscriber instanceof Academy) {
            return $this->sanitizeAuxiliaryFields($data);
        }

        $subscriberPayload = $this->buildSubscriberPayload($data, $subscriber);

        $subscriber->fill($subscriberPayload);
        $subscriber->save();

        $this->syncSubscriber($subscriber);

        $pricePerStudent = $this->resolvePricePerStudent($subscriber);

        $data['quota_limit'] = (int) ($subscriberPayload['plan_max_students'] ?? $data['quota_limit'] ?? 0);
        $data['cost_per_seat'] = $data['quota_limit'] > 0 ? $pricePerStudent : 0;
        $data['amount_due'] = (float) ($subscriberPayload['subscription_fee'] ?? $data['amount_due'] ?? 0);
        $data['amount_paid'] = (float) ($subscriberPayload['paid_amount'] ?? $data['amount_paid'] ?? 0);

        return $this->sanitizeAuxiliaryFields($data);
    }

    private function buildSubscriberPayload(array $data, Teacher|Academy $subscriber): array
    {
        $effectivePaid = $this->resolveEffectivePaidAmount($data, $subscriber);

        $planMaxStudents = is_numeric($data['quota_limit'] ?? null)
            ? max(0, (int) $data['quota_limit'])
            : (int) ($subscriber->plan_max_students ?? 0);

        $storageMinutesLimit = is_numeric($data['storage_minutes_limit'] ?? null)
            ? max(0, (int) $data['storage_minutes_limit'])
            : (int) ($subscriber->storage_minutes_limit ?? 0);

        $deliveryMinutesLimit = is_numeric($data['delivery_minutes_limit'] ?? null)
            ? max(0, (int) $data['delivery_minutes_limit'])
            : (int) ($subscriber->delivery_minutes_limit ?? 0);

        $payload = [
            'plan_max_students' => $planMaxStudents,
            'storage_minutes_limit' => $storageMinutesLimit,
            'delivery_minutes_limit' => $deliveryMinutesLimit,
            'paid_amount' => $effectivePaid,
        ];

        if ($this->shouldUpdateDuration($data)) {
            [$planType, $subscriptionPeriod, $months, $expiresAt] = $this->resolveDurationState($data);

            $payload['plan_type'] = $planType;
            $payload['subscription_period'] = $subscriptionPeriod;
            $payload['plan_expires_at'] = $expiresAt;
            $computedFee = $planType === 'trial'
                ? 0.0
                : $this->calculateFeeForMonths($subscriber, [
                    'plan_max_students' => $planMaxStudents,
                    'storage_minutes_limit' => $storageMinutesLimit,
                    'delivery_minutes_limit' => $deliveryMinutesLimit,
                    'discount_percent' => $subscriber->discount_percent,
                    'discount_type' => $subscriber->discount_type,
                    'discount_scope' => $subscriber->discount_scope,
                ], $months);

            $payload['subscription_fee'] = max($effectivePaid, $computedFee);

            return $payload;
        }

        $remainingMonths = $this->resolveRemainingMonths($subscriber->plan_expires_at);

        $oldFeeForRemaining = $this->calculateFeeForMonths($subscriber, [
            'plan_max_students' => $subscriber->plan_max_students,
            'storage_minutes_limit' => $subscriber->storage_minutes_limit,
            'delivery_minutes_limit' => $subscriber->delivery_minutes_limit,
            'discount_percent' => $subscriber->discount_percent,
            'discount_type' => $subscriber->discount_type,
            'discount_scope' => $subscriber->discount_scope,
        ], $remainingMonths);

        $newFeeForRemaining = $this->calculateFeeForMonths($subscriber, [
            'plan_max_students' => $planMaxStudents,
            'storage_minutes_limit' => $storageMinutesLimit,
            'delivery_minutes_limit' => $deliveryMinutesLimit,
            'discount_percent' => $subscriber->discount_percent,
            'discount_type' => $subscriber->discount_type,
            'discount_scope' => $subscriber->discount_scope,
        ], $remainingMonths);

        $difference = round($newFeeForRemaining - $oldFeeForRemaining, 2);

        [$normalizedPlanType, $normalizedSubscriptionPeriod] = $this->resolveNormalizedDurationState($subscriber);

        $payload['plan_type'] = $normalizedPlanType;
        $payload['subscription_period'] = $normalizedSubscriptionPeriod;
        $payload['plan_expires_at'] = $this->normalizeDateString($subscriber->plan_expires_at);
    $payload['subscription_fee'] = max($effectivePaid, round((float) ($subscriber->subscription_fee ?? 0) + $difference, 2));

        if ($difference !== 0.0) {
            $line = sprintf('تسوية تعديل الباقة على المدة المتبقية (%d شهر): %+0.2f ج.م', $remainingMonths, $difference);
            $existing = trim((string) ($subscriber->billing_notes ?? ''));
            $payload['billing_notes'] = $existing !== ''
                ? $existing . "\n" . $line
                : $line;
        }

        return $payload;
    }

    private function resolveNormalizedDurationState(Teacher|Academy $subscriber): array
    {
        $planType = (string) ($subscriber->plan_type ?? '');
        $subscriptionPeriod = (string) ($subscriber->subscription_period ?? '');

        if ($subscriptionPeriod !== '' || $planType !== 'trial') {
            return [$planType, $subscriptionPeriod !== '' ? $subscriptionPeriod : null];
        }

        $inferredPeriod = $this->inferSubscriptionPeriodFromSnapshot(
            $subscriber->plan_expires_at,
            (float) ($subscriber->subscription_fee ?? 0),
            (float) ($subscriber->paid_amount ?? 0)
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

    private function resolveEffectivePaidAmount(array $data, Teacher|Academy $subscriber): float
    {
        $subscriberPaid = (float) ($subscriber->paid_amount ?? 0);
        $subscriptionPaid = (float) ($this->record->amount_paid ?? 0);
        $formPaid = is_numeric($data['amount_paid'] ?? null) ? (float) $data['amount_paid'] : 0.0;

        return max(0, round(max($subscriberPaid, $subscriptionPaid, $formPaid), 2));
    }

    private function shouldUpdateDuration(array $data): bool
    {
        return (bool) ($data['update_subscription_duration'] ?? false) === true;
    }

    private function resolveDurationState(array $data): array
    {
        $selection = (string) ($data['plan_selection'] ?? 'monthly');

        if ($selection === 'trial') {
            $trialDays = (int) ((int) (Setting::where('key', 'trial_period_days')->value('value') ?: 14));

            return ['trial', null, 0, now()->addDays($trialDays)->toDateString()];
        }

        if ($selection === 'custom') {
            $months = max(1, (int) ($data['custom_period_months'] ?? 1));

            return ['custom', null, $months, now()->addMonths($months)->toDateString()];
        }

        $months = match ($selection) {
            'monthly' => 1,
            'quarterly' => 3,
            'semi_annual' => 6,
            'annual' => 12,
            default => 1,
        };

        return ['term', $selection, $months, now()->addMonths($months)->toDateString()];
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

    private function normalizeDateString(mixed $value): ?string
    {
        if (empty($value)) {
            return null;
        }

        return Carbon::parse($value)->toDateString();
    }

    private function calculateFeeForMonths(Teacher|Academy $subscriber, array $payload, int $months): float
    {
        [$pricePerStudent, $storagePriceMin, $deliveryPriceMin] = $this->resolvePricing($subscriber);

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

    private function resolvePricing(Teacher|Academy $subscriber): array
    {
        $isTeacher = $subscriber instanceof Teacher;
        
        try {
            if ($isTeacher) {
                $pricePerStudent = \App\Domains\Application\Services\HelperService::getTeacherPricePerStudent();
                $storagePriceMin = \App\Domains\Application\Services\HelperService::getTeacherStoragePricePerMinute();
                $deliveryPriceMin = \App\Domains\Application\Services\HelperService::getTeacherDeliveryPricePerMinute();
            } else {
                $pricePerStudent = \App\Domains\Application\Services\HelperService::getAcademyPricePerStudent();
                $storagePriceMin = \App\Domains\Application\Services\HelperService::getAcademyStoragePricePerMinute();
                $deliveryPriceMin = \App\Domains\Application\Services\HelperService::getAcademyDeliveryPricePerMinute();
            }
        } catch (\Throwable $exception) {
            $pricePerStudent = $isTeacher ? 60 : 40;
            $storagePriceMin = 0.5;
            $deliveryPriceMin = 0.1;
        }

        return [$pricePerStudent, $storagePriceMin, $deliveryPriceMin];
    }

    private function resolvePricePerStudent(Teacher|Academy $subscriber): float
    {
        $subscriptionType = $subscriber instanceof Teacher
            ? SubscriptionType::TEACHER->value
            : SubscriptionType::ACADEMY->value;

        $settingKey = $subscriptionType === SubscriptionType::ACADEMY->value
            ? 'academy_price_per_student'
            : 'teacher_price_per_student';

        $defaultValue = $subscriptionType === SubscriptionType::ACADEMY->value ? 40.0 : 60.0;

        $configured = (float) (Setting::where('key', $settingKey)->value('value') ?? 0);

        return $configured > 0 ? round($configured, 2) : $defaultValue;
    }

    private function syncSubscriber(Teacher|Academy $subscriber): void
    {
        $service = app(UnifiedSubscriptionSyncService::class);

        if ($subscriber instanceof Teacher) {
            $service->syncTeacher($subscriber);

            return;
        }

        $service->syncAcademy($subscriber);
    }

    private function sanitizeAuxiliaryFields(array $data): array
    {
        unset(
            $data['update_subscription_duration'],
            $data['storage_minutes_limit'],
            $data['delivery_minutes_limit'],
            $data['custom_period_months'],
            $data['plan_selection']
        );

        return $data;
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
}