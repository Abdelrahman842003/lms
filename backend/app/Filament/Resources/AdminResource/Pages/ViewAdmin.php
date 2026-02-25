<?php

declare(strict_types=1);

namespace App\Filament\Resources\AdminResource\Pages;

use App\Filament\Resources\AdminResource;
use Filament\Actions;
use Filament\Infolists\Components\Section;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;
use Filament\Resources\Pages\ViewRecord;

class ViewAdmin extends ViewRecord
{
    protected static string $resource = AdminResource::class;

    public function infolist(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('المعلومات الأساسية')
                    ->schema([
                        TextEntry::make('name')
                            ->label('الاسم')
                            ->icon('heroicon-m-user'),

                        TextEntry::make('username')
                            ->label('اسم المستخدم')
                            ->icon('heroicon-m-identification'),

                        TextEntry::make('email')
                            ->label('البريد الإلكتروني')
                            ->icon('heroicon-m-envelope')
                            ->placeholder('غير محدد'),
                    ])
                    ->columns(3),

                Section::make('الأدوار والصلاحيات')
                    ->schema([
                        TextEntry::make('roles.name')
                            ->label('الأدوار')
                            ->badge()
                            ->separator(',')
                            ->placeholder('لا يوجد أدوار محددة'),

                        TextEntry::make('permissions.name')
                            ->label('الصلاحيات المباشرة')
                            ->badge()
                            ->color('success')
                            ->separator(',')
                            ->placeholder('لا يوجد صلاحيات مباشرة'),
                    ])
                    ->columns(2),

                Section::make('معلومات الحساب')
                    ->schema([
                        TextEntry::make('last_login_at')
                            ->label('آخر تسجيل دخول')
                            ->dateTime('Y-m-d H:i:s')
                            ->icon('heroicon-m-clock')
                            ->placeholder('لم يسجل الدخول بعد'),

                        TextEntry::make('created_at')
                            ->label('تاريخ الإنشاء')
                            ->dateTime('Y-m-d H:i:s')
                            ->icon('heroicon-m-calendar'),

                        TextEntry::make('updated_at')
                            ->label('آخر تحديث')
                            ->dateTime('Y-m-d H:i:s')
                            ->icon('heroicon-m-arrow-path'),
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

    public function getTitle(): string
    {
        return 'عرض المدير: ' . $this->record->name;
    }
}
