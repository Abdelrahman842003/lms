<?php

declare(strict_types=1);

namespace App\Filament\Resources\TeacherResource\Pages;

use App\Domains\Subscriptions\Services\UnifiedSubscriptionSyncService;
use App\Filament\Resources\TeacherResource;
use Filament\Resources\Pages\CreateRecord;

class CreateTeacher extends CreateRecord
{
    protected static string $resource = TeacherResource::class;

    protected function afterCreate(): void
    {
        app(UnifiedSubscriptionSyncService::class)->syncTeacher($this->record);
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }

    public function getTitle(): string
    {
        return 'إنشاء معلم جديد';
    }
}
