<?php

declare(strict_types=1);

namespace App\Providers\Filament;

use App\Filament\Auth\Login;
use App\Filament\Pages\Dashboard;
use App\Filament\Widgets\StatsOverviewWidget;
use App\Filament\Widgets\RecentAcademiesWidget;
use App\Filament\Widgets\SubscriptionExpiryWidget;
use App\Filament\Widgets\AcademyDistributionChart;
use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use Filament\Widgets;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;

class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->id('admin')
            ->path('admin')
            ->authGuard('admin')
            ->login(Login::class)
            ->profile()
            ->colors([
                'primary' => Color::Indigo,
                'danger' => Color::Rose,
                'warning' => Color::Amber,
                'success' => Color::Emerald,
                'gray' => Color::Slate,
            ])
            ->brandName('إدارة المنصة')
            ->brandLogo(null)
            ->favicon(null)
            ->darkMode(false)
            ->sidebarCollapsibleOnDesktop()
            ->sidebarWidth('18rem')
            ->maxContentWidth('full')
            ->topNavigation(false)
            ->databaseNotifications()
            ->databaseNotificationsPolling('30s')
            ->globalSearch(true)
            ->globalSearchDebounce('400ms')
            ->spa()
            // Resource Discovery
            ->discoverResources(in: app_path('Filament/Resources'), for: 'App\Filament\Resources')
            // Page Discovery
            ->discoverPages(in: app_path('Filament/Pages'), for: 'App\Filament\Pages')
            // Custom Pages
            ->pages([
                Dashboard::class,
            ])
            // Widget Discovery
            ->discoverWidgets(in: app_path('Filament/Widgets'), for: 'App\Filament\Widgets')
            // Registered Widgets with proper columns/span
            ->widgets([
                // Row 1: Stats Overview - Full width
                StatsOverviewWidget::class,
                // Row 2: Left column - Recent Academies (2/3 width)
                //         Right column - Subscription Expiry (1/3 width)
                RecentAcademiesWidget::class,
                SubscriptionExpiryWidget::class,
                // Row 3: Academy Distribution Chart
                AcademyDistributionChart::class,
                // Default widgets
                Widgets\AccountWidget::class,
            ])
            // Middleware stack
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                VerifyCsrfToken::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
            ])
            // Authentication middleware
            ->authMiddleware([
                Authenticate::class,
            ])
            // RTL support for Arabic
            ->renderHook(
                'panels::head.start',
                fn (): string => '<meta name="direction" content="rtl">',
            )
            ->renderHook(
                'panels::body.end',
                fn (): string => '<script>document.documentElement.setAttribute("dir", "rtl"); document.documentElement.setAttribute("lang", "ar");</script>',
            )
            // Custom theme settings
            ->font('Tajawal');
    }
}
