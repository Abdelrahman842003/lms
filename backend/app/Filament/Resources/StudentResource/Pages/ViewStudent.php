<?php

declare(strict_types=1);

namespace App\Filament\Resources\StudentResource\Pages;

use App\Filament\Resources\StudentResource;
use Filament\Actions;
use Filament\Schemas\Components\Section;
use Filament\Infolists\Components\TextEntry;
use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\ImageEntry;
use Filament\Schemas\Schema;
use Filament\Resources\Pages\ViewRecord;

class ViewStudent extends ViewRecord
{
    protected static string $resource = StudentResource::class;

    public function getTitle(): string
    {
        return 'عرض الطالب';
    }

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
                            ->icon('heroicon-m-phone')
                            ->placeholder('غير محدد'),
                    ])
                    ->columns(3),

                Section::make('معلومات ولي الأمر')
                    ->schema([
                        TextEntry::make('parent_phone')
                            ->label('هاتف ولي الأمر')
                            ->icon('heroicon-m-phone')
                            ->placeholder('غير محدد'),

                        TextEntry::make('guardian.name')
                            ->label('ولي الأمر')
                            ->icon('heroicon-m-user')
                            ->placeholder('غير محدد'),
                    ])
                    ->columns(2),

                Section::make('المعلومات الأكاديمية')
                    ->schema([
                        TextEntry::make('grades.name')
                            ->label('الصف الدراسي')
                            ->badge()
                            ->separator(','),

                        TextEntry::make('groups.name')
                            ->label('المجموعة')
                            ->badge()
                            ->separator(','),

                        TextEntry::make('academies.name')
                            ->label('الأكاديميات')
                            ->badge()
                            ->separator(',')
                            ->placeholder('غير محدد'),

                        TextEntry::make('teachers.name')
                            ->label('المعلمون')
                            ->badge()
                            ->separator(',')
                            ->placeholder('غير محدد'),
                    ])
                    ->columns(2),

                Section::make('المعلومات الشخصية')
                    ->schema([
                        TextEntry::make('gender')
                            ->label('الجنس')
                            ->formatStateUsing(fn ($state): string => match (is_string($state) ? $state : $state->value) {
                                'male' => 'ذكر',
                                'female' => 'أنثى',
                                default => 'غير محدد',
                            }),

                        TextEntry::make('education_type')
                            ->label('نوع التعليم')
                            ->formatStateUsing(fn ($state): string => match (is_string($state) ? $state : $state->value) {
                                'regular' => 'عادي',
                                'private' => 'خاص',
                                'homeschool' => 'تعليم منزلي',
                                default => 'غير محدد',
                            }),

                        TextEntry::make('location')
                            ->label('الموقع')
                            ->placeholder('غير محدد')
                            ->columnSpanFull(),
                    ])
                    ->columns(2),

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
