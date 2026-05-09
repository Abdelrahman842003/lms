<?php

declare(strict_types=1);

namespace App\Providers\Filament;

use App\Filament\Auth\Login;
use App\Filament\Pages\Dashboard;
use App\Filament\Widgets\StatsOverviewWidget;
use App\Filament\Widgets\RecentAcademiesWidget;
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
use ShuvroRoy\FilamentSpatieLaravelBackup\FilamentSpatieLaravelBackupPlugin;
use ShuvroRoy\FilamentSpatieLaravelHealth\FilamentSpatieLaravelHealthPlugin;
use AlizHarb\ActivityLog\ActivityLogPlugin;
use CharrafiMed\GlobalSearchModal\GlobalSearchModalPlugin;
use Openplain\FilamentShadcnTheme\Color as ShadcnColor;

class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        $plugins = [
            FilamentSpatieLaravelBackupPlugin::make(),
            FilamentSpatieLaravelHealthPlugin::make()
                ->navigationLabel('صحة النظام')
                ->navigationGroup('الإعدادات'),
            ActivityLogPlugin::make()
                ->label('سجل النشاط')
                ->pluralLabel('سجلات الأنشطة')
                ->navigationGroup('الإعدادات'),
            GlobalSearchModalPlugin::make(),
        ];

        return $panel
            ->id('admin')
            ->path('admin')
            ->authGuard('admin')
            ->login(Login::class)
            ->profile()
            ->colors([
                'primary' => Color::Blue,
                'danger' => Color::Rose,
                'warning' => Color::Amber,
                'success' => Color::Emerald,
                'gray' => Color::Slate,
            ])
            ->plugins($plugins)
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
            ->resources([
                \App\Filament\Resources\PricingPackageResource::class,
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
                'panels::global-search.after',
                fn (): string => '
                    <button type="button" onclick="window.print()" class="filament-icon-button flex items-center justify-center rounded-full w-9 h-9 text-gray-500 hover:bg-gray-500/10 focus:outline-none transition-all dark:text-gray-400 dark:hover:bg-gray-400/10" title="طباعة الصفحة">
                        <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.821V21h10.56v-7.179m-10.56 0a2.381 2.381 0 01-2.38-2.38V6.621c0-1.314 1.066-2.38 2.38-2.38h10.56c1.314 0 2.38 1.066 2.38 2.38v4.82c0 1.314-1.066 2.38-2.38 2.38m-10.56 0h10.56M9 10.125h3M9 8.25h6m-3 9.75h3" />
                        </svg>
                    </button>
                ',
            )
            ->renderHook(
                'panels::head.start',
                fn (): string => '
                    <meta name="direction" content="rtl">
                    <style>
                        @media print {
                            * {
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                            }
                            .fi-sidebar, .fi-topbar-item:has(button[onclick="window.print()"]), .fi-topbar-item:has(.fi-icon-btn) {
                                /* We might want to keep the topbar but hide action buttons */
                            }
                            /* Hide navigation and buttons during print in admin */
                            .fi-sidebar, .fi-topbar, .fi-btn, .fi-icon-btn {
                                /* display: none !important; */ /* User said "whole screen", so maybe keep layout but hide buttons */
                            }
                            
                            /* Better approach: only hide specific UI controls */
                            button[onclick="window.print()"], .fi-topbar-search-container, .fi-user-menu {
                                display: none !important;
                            }
                        }
                    </style>
                ',
            )
            ->renderHook(
                'panels::body.end',
                fn (): string => '<script>document.documentElement.setAttribute("dir", "rtl"); document.documentElement.setAttribute("lang", "ar");</script>',
            )
            ->bootUsing(function (): void {
                app()->setLocale('ar');
            })
            // Custom theme settings
            ->font('Tajawal')
            ->darkMode()
            ->defaultThemeMode(\Filament\Enums\ThemeMode::System);
    }
}
