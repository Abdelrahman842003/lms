<?php

declare(strict_types=1);

namespace App\Filament\Pages;

use App\Filament\Widgets\StatsOverviewWidget;
use App\Filament\Widgets\RecentAcademiesWidget;
use App\Filament\Widgets\SubscriptionExpiryWidget;
use Filament\Pages\Page;

class Dashboard extends Page
{
    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-home';

    protected static ?string $navigationLabel = 'الرئيسية';

    protected static ?int $navigationSort = -2;

    protected string $view = 'filament.pages.dashboard';

    public function getTitle(): string
    {
        return 'لوحة التحكم';
    }

    /**
     * Register widgets for the dashboard
     */
    public function widgets(): array
    {
        return [
            StatsOverviewWidget::class,
            RecentAcademiesWidget::class,
            SubscriptionExpiryWidget::class,
        ];
    }

    /**
     * Get header widgets
     */
    protected function getHeaderWidgets(): array
    {
        return [
            StatsOverviewWidget::class,
        ];
    }

    /**
     * Get footer widgets
     */
    protected function getFooterWidgets(): array
    {
        return [
            RecentAcademiesWidget::class,
            SubscriptionExpiryWidget::class,
        ];
    }
}