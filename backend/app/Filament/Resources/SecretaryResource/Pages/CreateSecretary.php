<?php

declare(strict_types=1);

namespace App\Filament\Resources\SecretaryResource\Pages;

use App\Filament\Resources\SecretaryResource;
use Filament\Resources\Pages\CreateRecord;

class CreateSecretary extends CreateRecord
{
    protected static string $resource = SecretaryResource::class;

    public function getTitle(): string
    {
        return 'إنشاء سكرتير جديد';
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }

    protected function getCreatedNotificationTitle(): ?string
    {
        return 'تم إنشاء السكرتير بنجاح';
    }
}
