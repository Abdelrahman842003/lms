<?php

declare(strict_types=1);

namespace App\Filament\Resources\AcademyResource\Pages;

use App\Filament\Resources\AcademyResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListAcademies extends ListRecords
{
    protected static string $resource = AcademyResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make()
                ->label('أكاديمية جديدة')
                ->icon('heroicon-m-plus'),
        ];
    }

    protected function getHeaderWidgets(): array
    {
        return [
            AcademyResource\Widgets\AcademyStatsWidget::class,
        ];
    }

    public function getTitle(): string
    {
        return 'قائمة الأكاديميات';
    }
}
