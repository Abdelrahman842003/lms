<?php

declare(strict_types=1);

namespace App\Filament\Resources\TeacherResource\Pages;

use App\Domains\Subscriptions\Services\UnifiedSubscriptionSyncService;
use App\Domains\Application\Services\HelperService;
use App\Domains\Auth\Models\Teacher;
use App\Filament\Resources\TeacherResource;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Support\Carbon;

class CreateTeacher extends CreateRecord
{
    protected static string $resource = TeacherResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $data = $this->normalizeDiscountFields($data);

        if (empty($data['plan_type'])) {
            $data['plan_type'] = $this->resolvePlanType($data);
        }

        if (($data['plan_type'] ?? null) === 'trial') {
            $data['subscription_period'] = null;
        }

        if (! empty($data['plan_expires_at'])) {
            return $data;
        }

        $data['plan_expires_at'] = $this->resolvePlanExpiryDate($data);

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

    protected function afterCreate(): void
    {
        if (! $this->record instanceof Teacher) {
            return;
        }

        /** @var Teacher $teacher */
        $teacher = $this->record;
        app(UnifiedSubscriptionSyncService::class)->syncTeacher($teacher);
    }

    private function resolvePlanExpiryDate(array $data): string
    {
        $now = Carbon::now();
        $planType = (string) ($data['plan_type'] ?? 'trial');

        if ($planType === 'trial') {
            return $now->addDays(HelperService::getTrialPeriodDays())->toDateString();
        }

        if ($planType === 'term') {
            $months = match ((string) ($data['subscription_period'] ?? '')) {
                'monthly' => 1,
                'quarterly' => 3,
                'semi_annual' => 6,
                'annual' => 12,
                default => 0,
            };

            if ($months > 0) {
                return $now->addMonths($months)->toDateString();
            }
        }

        return $now->toDateString();
    }

    private function resolvePlanType(array $data): string
    {
        $period = (string) ($data['subscription_period'] ?? '');

        return in_array($period, ['monthly', 'quarterly', 'semi_annual', 'annual'], true)
            ? 'term'
            : 'trial';
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }

    public function getTitle(): string
    {
        return 'إنشاء معلم جديد';
    }
}
