<?php

declare(strict_types=1);

namespace App\Filament\Resources\VideoUploadSessionResource\Pages;

use App\Filament\Resources\VideoUploadSessionResource;
use Filament\Resources\Pages\ListRecords;

class ListVideoUploadSessions extends ListRecords
{
    protected static string $resource = VideoUploadSessionResource::class;

    protected function getHeaderActions(): array
    {
        return [];
    }

    public function getTitle(): string
    {
        return 'جلسات رفع الفيديوهات';
    }
}
