<?php

declare(strict_types=1);

namespace App\Filament\Resources\SettingResource\Pages;

use App\Filament\Resources\SettingResource;
use Filament\Resources\Pages\CreateRecord;

class CreateSetting extends CreateRecord
{
    protected static string $resource = SettingResource::class;

    public function getTitle(): string
    {
        return 'إنشاء إعداد جديد';
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }

    protected function getCreatedNotificationTitle(): ?string
    {
        return 'تم إنشاء الإعداد بنجاح';
    }

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        // Handle different value types
        $type = $data['type'] ?? 'text';
        $data['value'] = match ($type) {
            'number' => (string) ($data['value_number'] ?? '0'),
            'toggle' => ($data['value_toggle'] ?? false) ? '1' : '0',
            'json' => $data['value_json'] ?? '{}',
            default => $data['value'] ?? '',
        };

        // Remove temporary fields
        unset($data['value_number'], $data['value_toggle'], $data['value_json']);

        return $data;
    }
}