<?php

declare(strict_types=1);

namespace App\Filament\Resources\PricingPackageResource\Pages;

use App\Filament\Resources\PricingPackageResource;
use Filament\Resources\Pages\CreateRecord;

class CreatePricingPackage extends CreateRecord
{
    protected static string $resource = PricingPackageResource::class;

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
