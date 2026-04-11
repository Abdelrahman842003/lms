<?php

declare(strict_types=1);

namespace App\Filament\Resources\AppPermissionResource\Pages;

use App\Filament\Resources\AppPermissionResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditAppPermission extends EditRecord
{
    protected static string $resource = AppPermissionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
