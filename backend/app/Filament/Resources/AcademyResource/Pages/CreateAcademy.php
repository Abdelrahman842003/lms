<?php

declare(strict_types=1);

namespace App\Filament\Resources\AcademyResource\Pages;

use App\Domains\Subscriptions\Services\UnifiedSubscriptionSyncService;
use App\Domains\Application\Services\HelperService;
use App\Filament\Resources\AcademyResource;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Support\Carbon;

class CreateAcademy extends CreateRecord
{
    protected static string $resource = AcademyResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
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

    protected function afterCreate(): void
    {
        app(UnifiedSubscriptionSyncService::class)->syncAcademy($this->record);
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
        return 'إنشاء أكاديمية جديدة';
    }
}
