<?php

declare(strict_types=1);

namespace App\Filament\Resources\PermissionResource\Pages;

use App\Filament\Resources\PermissionResource;
use Filament\Resources\Pages\ListRecords;

class ListPermissions extends ListRecords
{
    protected static string $resource = PermissionResource::class;

    public function getTitle(): string
    {
        return 'قائمة الصلاحيات';
    }

    protected function getHeaderActions(): array
    {
        // Read-only resource - no create action
        return [];
    }
}