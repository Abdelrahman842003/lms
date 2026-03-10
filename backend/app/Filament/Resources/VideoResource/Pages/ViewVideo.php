<?php

declare(strict_types=1);

namespace App\Filament\Resources\VideoResource\Pages;

use App\Filament\Resources\VideoResource;
use Filament\Resources\Pages\ViewRecord;

class ViewVideo extends ViewRecord
{
    protected static string $resource = VideoResource::class;

    public function getTitle(): string
    {
        return 'تفاصيل الفيديو';
    }
}
