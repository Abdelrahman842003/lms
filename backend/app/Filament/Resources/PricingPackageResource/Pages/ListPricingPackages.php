<?php

declare(strict_types=1);

namespace App\Filament\Resources\PricingPackageResource\Pages;

use App\Filament\Resources\PricingPackageResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListPricingPackages extends ListRecords
{
    protected static string $resource = PricingPackageResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make()->label('إنشاء باقة جديدة'),
        ];
    }
}
