<?php

declare(strict_types=1);

namespace App\Filament\Resources\PricingPackageResource\Pages;

use App\Filament\Resources\PricingPackageResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditPricingPackage extends EditRecord
{
    protected static string $resource = PricingPackageResource::class;

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
