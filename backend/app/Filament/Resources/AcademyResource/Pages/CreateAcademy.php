<?php

declare(strict_types=1);

namespace App\Filament\Resources\AcademyResource\Pages;

use App\Domains\Subscriptions\Services\UnifiedSubscriptionSyncService;
use App\Filament\Resources\AcademyResource;
use Filament\Resources\Pages\CreateRecord;

class CreateAcademy extends CreateRecord
{
    protected static string $resource = AcademyResource::class;

    protected function afterCreate(): void
    {
        app(UnifiedSubscriptionSyncService::class)->syncAcademy($this->record);
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }

    public function getTitle(): string
    {
        return 'إنشاء أكاديمية جديدة';
    }
}
