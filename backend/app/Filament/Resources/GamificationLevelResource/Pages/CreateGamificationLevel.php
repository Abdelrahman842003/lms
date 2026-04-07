<?php

declare(strict_types=1);

namespace App\Filament\Resources\GamificationLevelResource\Pages;

use App\Filament\Resources\GamificationLevelResource;
use Filament\Resources\Pages\CreateRecord;

class CreateGamificationLevel extends CreateRecord
{
    protected static string $resource = GamificationLevelResource::class;

    public function getTitle(): string
    {
        return 'إضافة مستوى جديد';
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
