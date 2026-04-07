<?php

declare(strict_types=1);

namespace App\Filament\Resources\GamificationLevelResource\Pages;

use App\Filament\Resources\GamificationLevelResource;
use Filament\Resources\Pages\ListRecords;

class ListGamificationLevels extends ListRecords
{
    protected static string $resource = GamificationLevelResource::class;

    protected function getHeaderActions(): array
    {
        return [
            \Filament\Actions\CreateAction::make()
                ->label('إضافة مستوى'),
        ];
    }

    public function getTitle(): string
    {
        return 'مستويات الإنجازات';
    }
}
