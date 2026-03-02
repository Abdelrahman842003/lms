<?php

declare(strict_types=1);

namespace App\Filament\Resources\SubscriptionResource\Pages;

use App\Filament\Resources\SubscriptionResource;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Support\Carbon;

class CreateSubscription extends CreateRecord
{
    protected static string $resource = SubscriptionResource::class;

    public function getTitle(): string
    {
        return 'إنشاء اشتراك جديد';
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }

    protected function getCreatedNotificationTitle(): ?string
    {
        return 'تم إنشاء الاشتراك بنجاح';
    }

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        unset($data['payment_method']);

        if (blank($data['notes'] ?? null)) {
            $data['notes'] = $this->buildDefaultNotes($data);
        }

        return $data;
    }

    private function buildDefaultNotes(array $data): string
    {
        $subscriberName = 'مشترك';
        $subscriberType = (string) ($data['subscriber_type'] ?? '');
        $subscriberId = (string) ($data['subscriber_id'] ?? '');

        if ($subscriberType !== '' && $subscriberId !== '' && class_exists($subscriberType)) {
            $subscriber = $subscriberType::query()->find($subscriberId);
            $subscriberName = (string) ($subscriber?->name ?? $subscriberName);
        }

        $typeLabel = match ((string) ($data['type'] ?? '')) {
            'academy' => 'أكاديمية',
            'teacher' => 'مدرس',
            default => 'اشتراك',
        };

        $monthLabel = isset($data['month'])
            ? Carbon::parse((string) $data['month'])->format('Y-m')
            : now()->format('Y-m');

        return "تم إنشاء اشتراك {$typeLabel} للمشترك {$subscriberName} - شهر {$monthLabel}";
    }
}
