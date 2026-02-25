<?php

declare(strict_types=1);

namespace App\Filament\Resources\SubscriptionResource\Pages;

use App\Filament\Resources\SubscriptionResource;
use Filament\Actions;
use Filament\Infolists\Components\Section;
use Filament\Infolists\Components\TextEntry;
use Filament\Infolists\Components\IconEntry;
use Filament\Schemas\Schema;
use Filament\Resources\Pages\ViewRecord;

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
                Section::make('المشترك')
                    ->schema([
                        TextEntry::make('subscriber.name')
                            ->label('الاسم')
                            ->icon('heroicon-m-user'),

                        TextEntry::make('subscriber_type')
                            ->label('النوع')
                            ->formatStateUsing(fn (string $state): string => match ($state) {
                                'App\Models\Academy' => 'أكاديمية',
                                'App\Models\Teacher' => 'مدرس',
                                default => $state,
                            })
                            ->badge(),
                    ])
                    ->columns(2),

                Section::make('معلومات الاشتراك')
                    ->schema([
                        TextEntry::make('type')
                            ->label('نوع الاشتراك')
                            ->formatStateUsing(fn (string $state): string => match ($state) {
                                'teacher' => 'مدرس',
                                'academy' => 'أكاديمية',
                                default => $state,
                            })
                            ->badge(),

                        TextEntry::make('month')
                            ->label('الشهر')
                            ->date('Y-m'),

                        TextEntry::make('seats_count')
                            ->label('عدد المقاعد'),

                        TextEntry::make('quota_limit')
                            ->label('الحد الأقصى')
                            ->placeholder('غير محدود'),

                        TextEntry::make('cost_per_seat')
                            ->label('التكلفة لكل مقعد')
                            ->money('EGP'),

                        TextEntry::make('amount_due')
                            ->label('المبلغ المستحق')
                            ->money('EGP'),

                        TextEntry::make('amount_paid')
                            ->label('المبلغ المدفوع')
                            ->money('EGP'),
                    ])
                    ->columns(2),

                Section::make('حالة الاشتراك')
                    ->schema([
                        TextEntry::make('status')
                            ->label('حالة الدفع')
                            ->badge()
                            ->formatStateUsing(fn (string $state): string => match ($state) {
                                'pending' => 'غير مدفوع',
                                'partial' => 'مدفوع جزئياً',
                                'paid' => 'مدفوع',
                                'cancelled' => 'ملغي',
                                default => $state,
                            })
                            ->color(fn (string $state): string => match ($state) {
                                'pending' => 'warning',
                                'partial' => 'info',
                                'paid' => 'success',
                                'cancelled' => 'danger',
                                default => 'gray',
                            }),

                        IconEntry::make('is_active')
                            ->label('نشط')
                            ->boolean()
                            ->trueColor('success')
                            ->falseColor('danger')
                            ->trueIcon('heroicon-m-check-circle')
                            ->falseIcon('heroicon-m-x-circle'),

                        TextEntry::make('paid_at')
                            ->label('تاريخ الدفع')
                            ->date('Y-m-d')
                            ->placeholder('غير مدفوع'),

                        TextEntry::make('payment_method')
                            ->label('طريقة الدفع')
                            ->formatStateUsing(fn (?string $state): string => match ($state) {
                                'cash' => 'نقدي',
                                'vodafone_cash' => 'فودافون كاش',
                                'bank_transfer' => 'تحويل بنكي',
                                'online' => 'دفع إلكتروني',
                                default => 'غير محدد',
                            })
                            ->placeholder('غير محدد'),
                    ])
                    ->columns(2),

                Section::make('ملاحظات')
                    ->schema([
                        TextEntry::make('notes')
                            ->label('الملاحظات')
                            ->placeholder('لا توجد ملاحظات')
                            ->columnSpanFull(),
                    ]),

                Section::make('معلومات النظام')
                    ->schema([
                        TextEntry::make('created_at')
                            ->label('تاريخ الإنشاء')
                            ->dateTime('Y-m-d H:i'),

                        TextEntry::make('updated_at')
                            ->label('آخر تحديث')
                            ->dateTime('Y-m-d H:i'),
                    ])
                    ->columns(2),
            ]);
    }

    protected function getHeaderActions(): array
    {
        return [
            Actions\EditAction::make()
                ->label('تعديل'),
        ];
    }
}