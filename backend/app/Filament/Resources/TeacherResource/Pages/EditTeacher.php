<?php

declare(strict_types=1);

namespace App\Filament\Resources\TeacherResource\Pages;

use App\Domains\Subscriptions\Services\UnifiedSubscriptionSyncService;
use App\Filament\Resources\TeacherResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditTeacher extends EditRecord
{
    protected static string $resource = TeacherResource::class;

    protected function mutateFormDataBeforeSave(array $data): array
    {
        $this->record->_original_status = $this->record->status?->value ?? ($this->record->status ?? null);
        return $data;
    }

    protected function afterSave(): void
    {
        /** @var \App\Domains\Auth\Models\Teacher $teacher */
        $teacher = $this->record;
        
        app(UnifiedSubscriptionSyncService::class)->syncTeacher($teacher);

        $newStatus = $teacher->status?->value ?? ($teacher->status ?? null);

        // Check if status changed from pending to active
        if (isset($this->record->_original_status) && $this->record->_original_status === 'pending' && $newStatus === 'active') {
            foreach ($teacher->academies as $academy) {
                $academy->notify(new \App\Domains\Auth\Notifications\AcademySystemNotification(
                    'تم تفعيل المدرس',
                    "تم تفعيل حساب المدرس {$teacher->name} بنجاح وأصبح نشطاً الآن.",
                    ['teacher_id' => $teacher->id]
                ));
            }
        }
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

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }

    public function getTitle(): string
    {
        return 'تعديل المعلم: ' . $this->record->name;
    }
}
