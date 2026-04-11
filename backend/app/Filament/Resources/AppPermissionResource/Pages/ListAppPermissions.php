<?php

declare(strict_types=1);

namespace App\Filament\Resources\AppPermissionResource\Pages;

use App\Filament\Resources\AppPermissionResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListAppPermissions extends ListRecords
{
    protected static string $resource = AppPermissionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make()
                ->label('إضافة صلاحية جديدة'),
        ];
    }
}
