<?php

declare(strict_types=1);

namespace App\Filament\Resources\GuardianResource\Pages;

use App\Filament\Resources\GuardianResource;
use Filament\Resources\Pages\EditRecord;

class EditGuardian extends EditRecord
{
    protected static string $resource = GuardianResource::class;

    public function getTitle(): string
    {
        return 'تعديل ولي أمر';
    }

    protected function getSavedNotificationTitle(): ?string
    {
        return 'تم تحديث بيانات ولي الأمر بنجاح';
    }
}
