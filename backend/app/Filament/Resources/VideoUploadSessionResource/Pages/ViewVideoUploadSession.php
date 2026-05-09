<?php

declare(strict_types=1);

namespace App\Filament\Resources\VideoUploadSessionResource\Pages;

use App\Domains\Videos\Enums\VideoUploadSessionStatus;
use App\Filament\Resources\VideoUploadSessionResource;
use Filament\Schemas\Components\Section;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;
use Filament\Resources\Pages\ViewRecord;

class ViewVideoUploadSession extends ViewRecord
{
    protected static string $resource = VideoUploadSessionResource::class;

    public function getTitle(): string
    {
        return 'عرض جلسة الرفع';
    }

    public function infolist(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('معلومات الجلسة')
                ->columns(2)
                ->schema([
                    TextEntry::make('id')
                        ->label('Session ID')
                        ->copyable(),

                    TextEntry::make('status')
                        ->label('الحالة')
                        ->badge()
                        ->color(fn (VideoUploadSessionStatus $state): string => match ($state) {
                            VideoUploadSessionStatus::DRAFT          => 'gray',
                            VideoUploadSessionStatus::INITIATING     => 'info',
                            VideoUploadSessionStatus::PENDING_UPLOAD => 'info',
                            VideoUploadSessionStatus::UPLOADING      => 'info',
                            VideoUploadSessionStatus::PAUSED         => 'warning',
                            VideoUploadSessionStatus::INTERRUPTED    => 'danger',
                            VideoUploadSessionStatus::COMPLETING     => 'warning',
                            VideoUploadSessionStatus::COMPLETED      => 'success',
                            VideoUploadSessionStatus::ABORTED        => 'gray',
                            VideoUploadSessionStatus::FAILED         => 'danger',
                        })
                        ->formatStateUsing(fn (VideoUploadSessionStatus $state): string => match ($state) {
                            VideoUploadSessionStatus::DRAFT          => 'مسودة',
                            VideoUploadSessionStatus::PENDING_UPLOAD => 'في الانتظار',
                            VideoUploadSessionStatus::INITIATING     => 'جاري التهيئة',
                            VideoUploadSessionStatus::UPLOADING      => 'جاري الرفع',
                            VideoUploadSessionStatus::PAUSED         => 'متوقف مؤقتاً',
                            VideoUploadSessionStatus::INTERRUPTED    => 'منقطع',
                            VideoUploadSessionStatus::COMPLETING     => 'جاري الإكمال',
                            VideoUploadSessionStatus::COMPLETED      => 'مكتملة',
                            VideoUploadSessionStatus::ABORTED        => 'ملغاة',
                            VideoUploadSessionStatus::FAILED         => 'فاشلة',
                        }),

                    TextEntry::make('video.title')
                        ->label('الفيديو المرتبط'),

                    TextEntry::make('video_id')
                        ->label('Video ID')
                        ->copyable(),
                ]),

            Section::make('بيانات الملف')
                ->columns(2)
                ->schema([
                    TextEntry::make('declared_filename')
                        ->label('اسم الملف'),

                    TextEntry::make('declared_mime')
                        ->label('نوع الملف (MIME)'),

                    TextEntry::make('declared_size_bytes')
                        ->label('الحجم المُعلن')
                        ->formatStateUsing(fn ($state) => $state
                            ? number_format((int) $state / 1048576, 2) . ' MB'
                            : '-'),

                    TextEntry::make('total_parts')
                        ->label('عدد الأجزاء'),
                ]),

            Section::make('بيانات R2')
                ->columns(1)
                ->schema([
                    TextEntry::make('object_key')
                        ->label('Object Key')
                        ->copyable(),

                    TextEntry::make('r2_upload_id')
                        ->label('R2 Upload ID')
                        ->copyable(),
                ]),

            Section::make('بيانات الرافع والتوقيت')
                ->columns(2)
                ->schema([
                    TextEntry::make('uploader_type')
                        ->label('نوع الرافع')
                        ->formatStateUsing(fn ($state) => match (true) {
                            str_contains((string) $state, 'Teacher') => 'معلم',
                            str_contains((string) $state, 'Academy') => 'أكاديمية',
                            default => $state,
                        }),

                    TextEntry::make('uploader_id')
                        ->label('معرّف الرافع'),

                    TextEntry::make('initiator_ip')
                        ->label('عنوان IP'),

                    TextEntry::make('initiated_at')
                        ->label('وقت البدء')
                        ->dateTime('Y-m-d H:i:s'),

                    TextEntry::make('completed_at')
                        ->label('وقت الاكتمال')
                        ->dateTime('Y-m-d H:i:s')
                        ->placeholder('-'),

                    TextEntry::make('aborted_at')
                        ->label('وقت الإلغاء')
                        ->dateTime('Y-m-d H:i:s')
                        ->placeholder('-'),

                    TextEntry::make('abort_reason')
                        ->label('سبب الإلغاء')
                        ->placeholder('—')
                        ->columnSpanFull(),
                ]),
        ]);
    }
}
