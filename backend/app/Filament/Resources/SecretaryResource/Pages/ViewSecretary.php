<?php

declare(strict_types=1);

namespace App\Filament\Resources\SecretaryResource\Pages;

use App\Filament\Resources\SecretaryResource;
use Filament\Actions;
use Filament\Infolists\Components\Section;
use Filament\Infolists\Components\TextEntry;
use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\ImageEntry;
use Filament\Schemas\Schema;
use Filament\Resources\Pages\ViewRecord;

class ViewSecretary extends ViewRecord
{
    protected static string $resource = SecretaryResource::class;

    public function getTitle(): string
    {
        return 'عرض السكرتير';
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

                        TextEntry::make('email')
                            ->label('البريد الإلكتروني')
                            ->icon('heroicon-m-envelope')
                            ->placeholder('غير محدد'),

                        TextEntry::make('phone')
                            ->label('رقم الهاتف')
                            ->icon('heroicon-m-phone'),
                    ])
                    ->columns(4),

                Section::make('الأكاديميات والمعلمون')
                    ->schema([
                        TextEntry::make('academies.name')
                            ->label('الأكاديميات')
                            ->badge()
                            ->separator(',')
                            ->placeholder('غير محدد'),

                        TextEntry::make('teachers.name')
                            ->label('المعلمون المرتبطون')
                            ->badge()
                            ->separator(',')
                            ->placeholder('غير محدد'),
                    ])
                    ->columns(2),

                Section::make('الحالة')
                    ->schema([
                        IconEntry::make('is_active')
                            ->label('الحالة')
                            ->boolean()
                            ->trueColor('success')
                            ->falseColor('danger')
                            ->trueIcon('heroicon-m-check-circle')
                            ->falseIcon('heroicon-m-x-circle'),

                        TextEntry::make('created_at')
                            ->label('تاريخ الإنشاء')
                            ->dateTime('Y-m-d H:i'),

                        TextEntry::make('updated_at')
                            ->label('آخر تحديث')
                            ->dateTime('Y-m-d H:i'),
                    ])
                    ->columns(3),
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
