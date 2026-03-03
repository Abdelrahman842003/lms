<?php

declare(strict_types=1);

namespace App\Filament\Pages;

use App\Filament\Widgets\StatsOverviewWidget;
use App\Filament\Widgets\RecentAcademiesWidget;
use Filament\Pages\Dashboard as BaseDashboard;

class Dashboard extends BaseDashboard
{
    protected static string $routePath = 'dashboard';

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-home';

    protected static ?string $navigationLabel = 'الرئيسية';

    protected static ?int $navigationSort = -2;

    public function getTitle(): string
    {
        return 'لوحة التحكم';
    }

    public function getWidgets(): array
    {
        return [
            StatsOverviewWidget::class,
            RecentAcademiesWidget::class,
        ];
    }
}
