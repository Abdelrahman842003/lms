<?php

declare(strict_types=1);

namespace App\Filament\Resources\SubscriptionResource\Pages;

use App\Domains\Subscriptions\Enums\SubscriptionStatus;
use App\Domains\Subscriptions\Services\SubscriptionRenewalService;
use App\Filament\Resources\SubscriptionResource;
use Filament\Actions;
use Filament\Forms\Components\Textarea;
use Filament\Infolists\Components\TextEntry;
use Filament\Resources\Pages\ViewRecord;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class ReviewUpgradeRequest extends ViewRecord
{
    protected static string $resource = SubscriptionResource::class;

    public function mount(string | int $record): void
    {
        parent::mount($record);

        $current = $this->getRecord();
        if ($current->request_type !== SubscriptionRenewalService::REQUEST_TYPE_UPGRADE) {
            $this->redirect(SubscriptionResource::getUrl('view', ['record' => $current]));
        }
    }

    public function getTitle(): string
    {
        return 'مراجعة طلب ترقية';
    }

    public function infolist(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('بيانات الطلب')
                    ->schema([
                        TextEntry::make('subscriber.name')->label('اسم المشترك'),
                        TextEntry::make('request_type')
                            ->label('نوع الطلب')
                            ->state(fn (): string => 'طلب ترقية')
                            ->badge()
                            ->color('warning'),
                        TextEntry::make('amount_due')->label('إجمالي المبلغ بعد الترقية')->money('EGP'),
                        TextEntry::make('upgrade_price_difference')->label('فرق سعر الترقية')->money('EGP'),
                        TextEntry::make('status')
                            ->label('الحالة')
                            ->badge()
                            ->formatStateUsing(fn ($state): string => match (is_string($state) ? $state : $state->value) {
                                'pending' => 'قيد المراجعة',
                                'paid' => 'مقبول',
                                'cancelled' => 'مرفوض',
                                default => is_string($state) ? $state : $state->value,
                            }),
                    ])
                    ->columns(2),

                Section::make('تفاصيل الترقية')
                    ->schema([
                        TextEntry::make('upgrade_seats_from')
                            ->label('المقاعد الحالية')
                            ->placeholder('بدون ترقية مقاعد'),
                        TextEntry::make('upgrade_seats_to')
                            ->label('المقاعد المطلوبة')
                            ->placeholder('بدون ترقية مقاعد'),
                        TextEntry::make('upgrade_storage_from_gb')
                            ->label('التخزين الحالي (GB)')
                            ->placeholder('بدون ترقية تخزين'),
                        TextEntry::make('upgrade_storage_to_gb')
                            ->label('التخزين المطلوب (GB)')
                            ->placeholder('بدون ترقية تخزين'),
                    ])
                    ->columns(2),

                Section::make('ملاحظات')
                    ->schema([
                        TextEntry::make('notes')
                            ->label('ملاحظات الطلب')
                            ->columnSpanFull(),
                        TextEntry::make('upgrade_rejection_reason')
                            ->label('سبب الرفض')
                            ->placeholder('غير مرفوض')
                            ->columnSpanFull(),
                    ]),
            ]);
    }

    protected function getHeaderActions(): array
    {
        return [
            Actions\Action::make('approveUpgrade')
                ->label('موافقة على الترقية')
                ->icon('heroicon-m-check-circle')
                ->color('success')
                ->requiresConfirmation()
                ->visible(fn (): bool => $this->getRecord()->status === SubscriptionStatus::PENDING)
                ->action(function (): void {
                    app(SubscriptionRenewalService::class)->approveRenewal($this->getRecord());
                    $this->redirect(SubscriptionResource::getUrl('index'));
                }),

            Actions\Action::make('rejectUpgrade')
                ->label('رفض الطلب')
                ->icon('heroicon-m-x-circle')
                ->color('danger')
                ->form([
                    Textarea::make('reason')
                        ->label('سبب الرفض')
                        ->rows(3)
                        ->required(),
                ])
                ->visible(fn (): bool => $this->getRecord()->status === SubscriptionStatus::PENDING)
                ->action(function (array $data): void {
                    app(SubscriptionRenewalService::class)->rejectRenewal($this->getRecord(), (string) ($data['reason'] ?? ''));
                    $this->redirect(SubscriptionResource::getUrl('index'));
                }),

            Actions\Action::make('back')
                ->label('رجوع')
                ->icon('heroicon-m-arrow-left')
                ->url(SubscriptionResource::getUrl('index')),
        ];
    }
}
