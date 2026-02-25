<?php

declare(strict_types=1);

namespace App\Filament\Resources\SecretaryResource\Pages;

use App\Filament\Resources\SecretaryResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListSecretaries extends ListRecords
{
    protected static string $resource = SecretaryResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make()
                ->label('سكرتير جديد')
                ->icon('heroicon-m-plus'),
        ];
    }

    public function getTitle(): string
    {
        return 'قائمة السكرتيريون';
    }
}
