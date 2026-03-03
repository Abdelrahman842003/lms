<?php

declare(strict_types=1);

namespace App\Filament\Resources\GuardianResource\Pages;

use App\Filament\Resources\GuardianResource;
use Filament\Resources\Pages\ViewRecord;

class ViewGuardian extends ViewRecord
{
    protected static string $resource = GuardianResource::class;

    public function getTitle(): string
    {
        return 'عرض ولي أمر';
    }
}
