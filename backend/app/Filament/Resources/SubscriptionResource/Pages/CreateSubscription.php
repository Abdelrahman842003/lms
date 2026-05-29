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

    protected array $subscriberUpdates = [];

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        unset($data['payment_method']);
        
        $this->subscriberUpdates = [
            'storage_minutes_limit' => $data['storage_minutes_limit'] ?? null,
            'delivery_minutes_limit' => $data['delivery_minutes_limit'] ?? null,
            'has_videos_addon' => $data['has_videos_addon'] ?? null,
        ];
        
        unset(
            $data['storage_minutes_limit'],
            $data['delivery_minutes_limit'],
            $data['has_videos_addon'],
            $data['update_subscription_duration'],
            $data['plan_selection'],
            $data['custom_period_months']
        );

        if (blank($data['notes'] ?? null)) {
            $data['notes'] = $this->buildDefaultNotes($data);
        }

        return $data;
    }

    protected function afterCreate(): void
    {
        $subscriber = $this->record->subscriber;
        if ($subscriber && !empty($this->subscriberUpdates)) {
            $dirty = false;
            if (isset($this->subscriberUpdates['storage_minutes_limit'])) {
                $subscriber->storage_minutes_limit = $this->subscriberUpdates['storage_minutes_limit'];
                $dirty = true;
            }
            if (isset($this->subscriberUpdates['delivery_minutes_limit'])) {
                $subscriber->delivery_minutes_limit = $this->subscriberUpdates['delivery_minutes_limit'];
                $dirty = true;
            }
            if (isset($this->subscriberUpdates['has_videos_addon'])) {
                $subscriber->has_videos_addon = $this->subscriberUpdates['has_videos_addon'];
                $dirty = true;
            }
            if ($dirty) {
                $subscriber->save();
            }
        }
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
