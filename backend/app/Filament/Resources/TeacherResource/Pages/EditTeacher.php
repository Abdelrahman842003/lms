<?php

declare(strict_types=1);

namespace App\Filament\Resources\TeacherResource\Pages;

use App\Domains\Subscriptions\Services\UnifiedSubscriptionSyncService;
use App\Filament\Resources\TeacherResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditTeacher extends EditRecord
{
    protected static string $resource = TeacherResource::class;

    protected function afterSave(): void
    {
        app(UnifiedSubscriptionSyncService::class)->syncTeacher($this->record);
    }

    protected function getHeaderActions(): array
    {
        return [
            Actions\ViewAction::make()
                ->label('عرض'),
            Actions\DeleteAction::make()
                ->label('حذف'),
        ];
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }

    public function getTitle(): string
    {
        return 'تعديل المعلم: ' . $this->record->name;
    }
}
