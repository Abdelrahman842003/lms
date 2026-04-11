<?php

declare(strict_types=1);

namespace App\Filament\Resources\AppPermissionResource\Pages;

use App\Filament\Resources\AppPermissionResource;
use Filament\Resources\Pages\CreateRecord;

class CreateAppPermission extends CreateRecord
{
    protected static string $resource = AppPermissionResource::class;

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
