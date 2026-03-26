<?php

declare(strict_types=1);

namespace App\Filament\Resources\TeacherResource\Pages;

use App\Filament\Resources\TeacherResource;
use Filament\Actions;
use Filament\Schemas\Components\Section;
use Filament\Infolists\Components\TextEntry;
use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\ImageEntry;
use Filament\Schemas\Schema;
use Filament\Resources\Pages\ViewRecord;
use App\Domains\Subscriptions\Services\StorageQuotaService;

class ViewTeacher extends ViewRecord
{
    protected static string $resource = TeacherResource::class;

    public function infolist(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('المعلومات الأساسية')
                    ->schema([
                        ImageEntry::make('avatar_key')
                            ->label('الصورة الشخصية')
                            ->circular()
                            ->defaultImageUrl(url('/images/default-avatar.png')),

                        TextEntry::make('name')
                            ->label('الاسم')
                            ->icon('heroicon-m-user'),

                        TextEntry::make('phone')
                            ->label('رقم الهاتف')
                            ->icon('heroicon-m-phone'),
                    ])
                    ->columns(3),

                Section::make('المعلومات الأكاديمية')
                    ->schema([
                        TextEntry::make('subject')
                            ->label('التخصص / المادة')
                            ->placeholder('غير محدد'),
                    ])
                    ->columns(2),

                Section::make('حالة المعلم')
                    ->schema([
                        TextEntry::make('status')
                            ->label('الحالة')
                            ->badge()
                            ->color(fn ($state): string => match (is_string($state) ? $state : $state->value) {
                                'active' => 'success',
                                'suspended' => 'danger',
                                'pending' => 'warning',
                                default => 'gray',
                            })
                            ->formatStateUsing(fn ($state): string => match (is_string($state) ? $state : $state->value) {
                                'active' => 'نشط',
                                'suspended' => 'موقوف',
                                'pending' => 'قيد الانتظار',
                                default => is_string($state) ? $state : $state->value,
                            }),

                        IconEntry::make('is_independent_active')
                            ->label('نشط كمعلم مستقل')
                            ->boolean(),
                    ])
                    ->columns(2),

                Section::make('الأكاديميات')
                    ->schema([
                        TextEntry::make('academies.name')
                            ->label('الأكاديميات المنتسب إليها')
                            ->badge()
                            ->separator(',')
                            ->placeholder('لا ينتمي إلى أي أكاديمية'),
                    ]),

                Section::make('الإحصائيات')
                    ->schema([
                        TextEntry::make('enrollments_count')
                            ->label('إجمالي التسجيلات')
                            ->state(fn ($record) => $record->enrollments()->count())
                            ->icon('heroicon-m-users'),

                        TextEntry::make('active_enrollments_count')
                            ->label('التسجيلات النشطة')
                            ->state(fn ($record) => $record->activeEnrollments()->count())
                            ->icon('heroicon-m-user-group'),

                        TextEntry::make('grades_count')
                            ->label('عدد الصفوف')
                            ->state(fn ($record) => $record->grades()->count())
                            ->icon('heroicon-m-academic-cap'),

                        TextEntry::make('groups_count')
                            ->label('عدد المجموعات')
                            ->state(fn ($record) => $record->groups()->count())
                            ->icon('heroicon-m-users'),

                        TextEntry::make('lectures_count')
                            ->label('عدد المحاضرات')
                            ->state(fn ($record) => $record->lectures()->count())
                            ->icon('heroicon-m-calendar'),
                    ])
                    ->columns(3),

                Section::make('معلومات الاشتراك')
                    ->schema([
                        TextEntry::make('plan_type')
                            ->label('نوع الخطة')
                            ->state(fn ($record): string => TeacherResource::resolvePlanTypeForDisplay($record))
                            ->badge()
                            ->color(fn (string $state): string => match ($state) {
                                'trial' => 'gray',
                                'term' => 'info',
                                'custom' => 'warning',
                                'free' => 'gray',
                                default => 'gray',
                            })
                            ->formatStateUsing(fn (string $state): string => match ($state) {
                                'trial' => 'تجريبي',
                                'term' => 'مدة محددة',
                                'custom' => 'مخصص',
                                'free' => 'مجاني',
                                default => 'غير محدد',
                            }),

                        TextEntry::make('plan_expires_at')
                            ->label('تاريخ انتهاء الاشتراك')
                            ->date('Y-m-d')
                            ->placeholder('غير محدد'),

                        IconEntry::make('is_unlimited_students')
                            ->label('طلاب غير محدودين')
                            ->boolean(),

                        TextEntry::make('plan_max_students')
                            ->label('الحد الأقصى للطلاب')
                            ->numeric()
                            ->placeholder('غير محدد')
                            ->visible(fn ($record) => ! $record->is_unlimited_students),

                        TextEntry::make('subscription_fee')
                            ->label('رسوم الاشتراك')
                            ->money('EGP'),

                        TextEntry::make('paid_amount')
                            ->label('المبلغ المدفوع')
                            ->money('EGP'),
                    ])
                    ->columns(3),

                Section::make('التخزين')
                    ->schema([
                        TextEntry::make('storage_limit_gb')
                            ->label('حد التخزين')
                            ->state(fn ($record) => $record->storage_limit_gb !== null
                                ? $record->storage_limit_gb . ' GB'
                                : 'غير محدود')
                            ->icon('heroicon-m-server'),

                        TextEntry::make('storage_used_bytes')
                            ->label('المساحة المستخدمة')
                            ->state(fn ($record) => round($record->storage_used_bytes / 1_073_741_824, 3) . ' GB'
                                . ' (' . number_format($record->storage_used_bytes) . ' bytes)')
                            ->icon('heroicon-m-circle-stack'),

                        TextEntry::make('storage_percentage')
                            ->label('نسبة الاستخدام')
                            ->state(function ($record) {
                                $snapshot = app(StorageQuotaService::class)->getStorageSnapshot($record);
                                return $snapshot['is_unlimited']
                                    ? 'غير محدود'
                                    : $snapshot['percentage'] . '%';
                            })
                            ->icon('heroicon-m-chart-bar'),

                        TextEntry::make('storage_remaining')
                            ->label('المتبقي')
                            ->state(function ($record) {
                                $snapshot = app(StorageQuotaService::class)->getStorageSnapshot($record);
                                return $snapshot['is_unlimited']
                                    ? 'غير محدود'
                                    : round($snapshot['remaining_gb'], 3) . ' GB';
                            })
                            ->icon('heroicon-m-archive-box'),
                    ])
                    ->columns(4),

                Section::make('معلومات النظام')
                    ->schema([
                        TextEntry::make('created_at')
                            ->label('تاريخ الإنشاء')
                            ->dateTime('Y-m-d H:i:s')
                            ->icon('heroicon-m-calendar'),

                        TextEntry::make('updated_at')
                            ->label('آخر تحديث')
                            ->dateTime('Y-m-d H:i:s')
                            ->icon('heroicon-m-arrow-path'),
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

    public function getTitle(): string
    {
        return 'عرض المعلم: ' . $this->record->name;
    }
}
