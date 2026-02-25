<?php

declare(strict_types=1);

namespace App\Filament\Resources\SecretaryResource\Pages;

use App\Filament\Resources\SecretaryResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditSecretary extends EditRecord
{
    protected static string $resource = SecretaryResource::class;

    public function getTitle(): string
    {
        return 'تعديل السكرتير';
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }

    protected function getSavedNotificationTitle(): ?string
    {
        return 'تم تحديث السكرتير بنجاح';
    }

    protected function getHeaderActions(): array
    {
        return [
            Actions\ViewAction::make()
                ->label('عرض'),
            Actions\DeleteAction::make()
                ->label('حذف'),
        ];
    }
}
