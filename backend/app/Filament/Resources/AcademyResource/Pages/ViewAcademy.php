<?php

declare(strict_types=1);

namespace App\Filament\Resources\AcademyResource\Pages;

use App\Filament\Resources\AcademyResource;
use Filament\Actions;
use Filament\Schemas\Components\Section;
use Filament\Infolists\Components\TextEntry;
use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\ImageEntry;
use Filament\Schemas\Schema;
use Filament\Resources\Pages\ViewRecord;

class ViewAcademy extends ViewRecord
{
    protected static string $resource = AcademyResource::class;

    public function infolist(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('المعلومات الأساسية')
                    ->schema([
                        ImageEntry::make('logo_key')
                            ->label('الشعار')
                            ->circular()
                            ->defaultImageUrl(url('/images/default-academy.png')),

                        TextEntry::make('name')
                            ->label('اسم الأكاديمية')
                            ->icon('heroicon-m-building-library'),

                        TextEntry::make('phone')
                            ->label('رقم الهاتف')
                            ->icon('heroicon-m-phone'),
                    ])
                    ->columns(3),

                Section::make('حالة الأكاديمية')
                    ->schema([
                        IconEntry::make('is_active')
                            ->label('نشط')
                            ->boolean(),
                    ])
                    ->columns(2),

                Section::make('معلومات الاشتراك')
                    ->schema([
                        TextEntry::make('plan_type')
                            ->label('نوع الخطة')
                            ->badge()
                            ->color(fn ($state): string => match (is_string($state) ? $state : $state->value) {
                                'trial' => 'gray',
                                'term' => 'info',
                                'custom' => 'warning',
                                'free' => 'gray',
                                default => 'gray',
                            })
                            ->formatStateUsing(fn ($state): string => match (is_string($state) ? $state : $state->value) {
                                'trial' => 'تجريبي',
                                'term' => 'مدة محددة',
                                'custom' => 'مخصص',
                                'free' => 'مجاني',
                                default => is_string($state) ? $state : $state->value,
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

                        TextEntry::make('remaining_amount')
                            ->label('المبلغ المتبقي')
                            ->state(fn ($record) => max(0, $record->subscription_fee - $record->paid_amount))
                            ->money('EGP'),
                    ])
                    ->columns(3),

                Section::make('الإحصائيات')
                    ->schema([
                        TextEntry::make('total_enrollments_count')
                            ->label('إجمالي التسجيلات')
                            ->icon('heroicon-m-clipboard-document-list'),

                        TextEntry::make('teachers_count')
                            ->label('عدد المعلمين')
                            ->state(fn ($record) => $record->teachers()->count())
                            ->icon('heroicon-m-academic-cap'),
                    ])
                    ->columns(2),

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
        return 'عرض الأكاديمية: ' . $this->record->name;
    }
}
