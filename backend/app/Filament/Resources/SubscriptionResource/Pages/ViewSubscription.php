<?php

declare(strict_types=1);

namespace App\Filament\Resources\SubscriptionResource\Pages;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Filament\Resources\SubscriptionResource;
use Filament\Actions;
use Filament\Schemas\Components\Section;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;
use Filament\Resources\Pages\ViewRecord;
use Illuminate\Support\Carbon;

class ViewSubscription extends ViewRecord
{
    protected static string $resource = SubscriptionResource::class;

    public function getTitle(): string
    {
        return 'عرض الاشتراك';
    }

    public function infolist(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('ملخص الاشتراك')
                    ->schema([
                        TextEntry::make('subscriber.name')
                            ->label('الاسم')
                            ->icon('heroicon-m-user'),

                        TextEntry::make('subscriber_type')
                            ->label('نوع المشترك')
                            ->formatStateUsing(fn ($state): string => match (is_string($state) ? $state : $state->value) {
                                'App\Domains\Auth\Models\Academy' => 'أكاديمية',
                                'App\Domains\Auth\Models\Teacher' => 'مدرس',
                                default => is_string($state) ? $state : $state->value,
                            })
                            ->badge(),

                        TextEntry::make('type')
                            ->label('نوع الاشتراك')
                            ->state(fn (): string => $this->getSubscriptionPlanLabel())
                            ->badge(),

                        TextEntry::make('month')
                            ->label('الشهر')
                            ->date('Y-m'),
                    ])
                    ->columns(4)
                    ->columnSpanFull(),

                Section::make('السعة والاستهلاك')
                    ->schema([
                        TextEntry::make('current_students_count')
                            ->label('الطلاب الحاليون')
                            ->state(fn (): int => $this->getCurrentStudentsCount()),

                        TextEntry::make('quota_limit')
                            ->label('الحد الأقصى')
                            ->placeholder('غير محدود'),

                        TextEntry::make('quota_usage_percentage')
                            ->label('نسبة استهلاك الباقة')
                            ->state(fn (): string => $this->getQuotaUsageLabel())
                            ->badge()
                            ->color(fn (): string => $this->getQuotaUsageColor()),

                        TextEntry::make('remaining_quota')
                            ->label('المقاعد المتبقية')
                            ->state(fn (): string => $this->getRemainingQuotaLabel()),

                        TextEntry::make('purchased_storage_limit')
                            ->label('المساحة المشتراة')
                            ->state(fn (): string => $this->getPurchasedStorageLabel()),

                        TextEntry::make('used_storage')
                            ->label('المساحة المستخدمة')
                            ->state(fn (): string => $this->getUsedStorageLabel()),

                        TextEntry::make('remaining_storage')
                            ->label('المساحة المتبقية')
                            ->state(fn (): string => $this->getRemainingStorageLabel()),

                        TextEntry::make('plan_expires_at')
                            ->label('تاريخ انتهاء الاشتراك')
                            ->state(fn (): string => $this->getPlanExpiryLabel()),

                        TextEntry::make('time_to_expiry')
                            ->label('المتبقي حتى الانتهاء')
                            ->state(fn (): string => $this->getRemainingDurationLabel()),
                    ])
                    ->columns(3)
                    ->columnSpanFull(),

                Section::make('البيانات المالية')
                    ->schema([
                        TextEntry::make('cost_per_seat')
                            ->label('التكلفة لكل مقعد')
                            ->money('EGP'),

                        TextEntry::make('amount_due')
                            ->label('المبلغ المستحق')
                            ->money('EGP'),

                        TextEntry::make('amount_paid')
                            ->label('المبلغ المدفوع')
                            ->money('EGP'),

                        TextEntry::make('remaining_amount')
                            ->label('المبلغ المتبقي')
                            ->state(fn (): float => $this->getRemainingAmount())
                            ->money('EGP'),
                    ])
                    ->columns(2)
                    ->columnSpanFull(),

                Section::make('حالة الاشتراك')
                    ->schema([
                        TextEntry::make('status')
                            ->label('حالة الدفع')
                            ->badge()
                            ->formatStateUsing(fn ($state): string => match (is_string($state) ? $state : $state->value) {
                                'pending' => 'غير مدفوع',
                                'partial' => 'مدفوع جزئياً',
                                'paid' => 'مدفوع',
                                'cancelled' => 'ملغي',
                                default => is_string($state) ? $state : $state->value,
                            })
                            ->color(fn ($state): string => match (is_string($state) ? $state : $state->value) {
                                'pending' => 'warning',
                                'partial' => 'info',
                                'paid' => 'success',
                                'cancelled' => 'danger',
                                default => 'gray',
                            }),

                        TextEntry::make('paid_at')
                            ->label('تاريخ الدفع')
                            ->date('Y-m-d')
                            ->placeholder('غير مدفوع'),
                    ])
                    ->columns(2)
                    ->columnSpanFull(),

                Section::make('ملاحظات')
                    ->schema([
                        TextEntry::make('notes')
                            ->label('الملاحظات')
                            ->state(fn (): string => $this->getNotesLabel())
                            ->columnSpanFull(),
                    ])
                    ->columnSpanFull(),

                Section::make('معلومات النظام')
                    ->schema([
                        TextEntry::make('created_at')
                            ->label('تاريخ الإنشاء')
                            ->dateTime('Y-m-d H:i'),

                        TextEntry::make('updated_at')
                            ->label('آخر تحديث')
                            ->dateTime('Y-m-d H:i'),
                    ])
                    ->columns(2)
                    ->columnSpanFull(),
            ]);
    }

    protected function getHeaderActions(): array
    {
        return [
            Actions\EditAction::make()
                ->label('تعديل'),
        ];
    }

    private function getSubscriberPlanExpiryDate(): ?Carbon
    {
        $planExpiresAt = $this->getRecord()?->subscriber?->plan_expires_at;

        if (! $planExpiresAt) {
            return null;
        }

        return Carbon::parse($planExpiresAt)->startOfDay();
    }

    private function getCurrentStudentsCount(): int
    {
        $record = $this->getRecord();
        $subscriber = $record->subscriber;

        if ($subscriber instanceof Academy) {
            return (int) ($subscriber->total_students_count ?? 0);
        }

        if ($subscriber instanceof Teacher) {
            return (int) $subscriber->activeEnrollments()->count();
        }

        return (int) ($record->seats_count ?? 0);
    }

    private function getQuotaUsageLabel(): string
    {
        $record = $this->getRecord();
        $quotaLimit = $record->quota_limit;

        if ($quotaLimit === null || (int) $quotaLimit <= 0) {
            return 'غير محدود';
        }

        $used = $this->getCurrentStudentsCount();
        $percentage = round(min(100, ($used / (int) $quotaLimit) * 100), 2);

        return "{$percentage}%";
    }

    private function getQuotaUsageColor(): string
    {
        $record = $this->getRecord();
        $quotaLimit = $record->quota_limit;

        if ($quotaLimit === null || (int) $quotaLimit <= 0) {
            return 'gray';
        }

        $used = $this->getCurrentStudentsCount();
        $percentage = ($used / (int) $quotaLimit) * 100;

        if ($percentage >= 90) {
            return 'danger';
        }

        if ($percentage >= 70) {
            return 'warning';
        }

        return 'success';
    }

    private function getRemainingQuotaLabel(): string
    {
        $record = $this->getRecord();
        $quotaLimit = $record->quota_limit;

        if ($quotaLimit === null || (int) $quotaLimit <= 0) {
            return 'غير محدود';
        }

        $remaining = max((int) $quotaLimit - $this->getCurrentStudentsCount(), 0);

        return (string) $remaining;
    }

    private function getPlanExpiryLabel(): string
    {
        $expiresAt = $this->getSubscriberPlanExpiryDate();

        if (! $expiresAt) {
            return 'غير محدد';
        }

        return $expiresAt->format('Y-m-d');
    }

    private function getRemainingDurationLabel(): string
    {
        $expiresAt = $this->getSubscriberPlanExpiryDate();

        if (! $expiresAt) {
            return 'غير محدد';
        }

        $today = now()->startOfDay();

        if ($expiresAt->lt($today)) {
            $daysSinceExpiry = $expiresAt->diffInDays($today);
            return "منتهي منذ {$daysSinceExpiry} يوم";
        }

        $interval = $today->diff($expiresAt);
        $months = ($interval->y * 12) + $interval->m;
        $days = $interval->d;

        return "{$months} شهر و {$days} يوم";
    }

    private function getRemainingAmount(): float
    {
        $record = $this->getRecord();

        return max(
            0,
            (float) ($record->amount_due ?? 0) - (float) ($record->amount_paid ?? 0)
        );
    }

    private function getPurchasedStorageLabel(): string
    {
        $subscriber = $this->getRecord()?->subscriber;
        $limitGb = data_get($subscriber, 'storage_limit_gb');

        if (! is_numeric($limitGb) || (float) $limitGb <= 0) {
            return 'غير محدود';
        }

        return rtrim(rtrim(number_format((float) $limitGb, 2, '.', ''), '0'), '.') . ' GB';
    }

    private function getUsedStorageLabel(): string
    {
        $subscriber = $this->getRecord()?->subscriber;
        $usedBytes = (int) data_get($subscriber, 'storage_used_bytes', 0);
        $usedGb = $usedBytes / 1_073_741_824;

        return rtrim(rtrim(number_format($usedGb, 2, '.', ''), '0'), '.') . ' GB';
    }

    private function getRemainingStorageLabel(): string
    {
        $subscriber = $this->getRecord()?->subscriber;
        $limitGb = data_get($subscriber, 'storage_limit_gb');

        if (! is_numeric($limitGb) || (float) $limitGb <= 0) {
            return 'غير محدود';
        }

        $usedBytes = (int) data_get($subscriber, 'storage_used_bytes', 0);
        $usedGb = $usedBytes / 1_073_741_824;
        $remainingGb = max(0, (float) $limitGb - $usedGb);

        return rtrim(rtrim(number_format($remainingGb, 2, '.', ''), '0'), '.') . ' GB';
    }

    private function getSubscriptionPlanLabel(): string
    {
        return SubscriptionResource::resolvePlanLabel($this->getRecord());
    }

    private function getNotesLabel(): string
    {
        $record = $this->getRecord();

        if (filled($record->notes)) {
            return (string) $record->notes;
        }

        $subscriberName = (string) ($record->subscriber?->name ?? 'مشترك');
        $typeLabel = match ((string) ($record->type?->value ?? $record->type)) {
            'academy' => 'أكاديمية',
            'teacher' => 'مدرس',
            default => 'اشتراك',
        };
        $monthLabel = $record->month?->format('Y-m') ?? now()->format('Y-m');

        return "تم إنشاء اشتراك {$typeLabel} للمشترك {$subscriberName} - شهر {$monthLabel}";
    }
}
