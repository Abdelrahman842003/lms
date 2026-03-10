<?php

declare(strict_types=1);

namespace App\Filament\Resources\VideoResource\Pages;

use App\Filament\Resources\VideoResource;
use Filament\Resources\Pages\ListRecords;

class ListVideos extends ListRecords
{
    protected static string $resource = VideoResource::class;

    public function getTitle(): string
    {
        return 'إدارة الفيديوهات التعليمية';
    }
}
