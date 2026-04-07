<?php

declare(strict_types=1);

namespace App\Filament\Resources\GamificationLevelResource\Pages;

use App\Filament\Resources\GamificationLevelResource;
use Filament\Resources\Pages\EditRecord;

class EditGamificationLevel extends EditRecord
{
    protected static string $resource = GamificationLevelResource::class;

    public function getTitle(): string
    {
        return 'تعديل المستوى';
    }

    protected function getHeaderActions(): array
    {
        return [
            \Filament\Actions\DeleteAction::make()
                ->label('حذف'),
        ];
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
