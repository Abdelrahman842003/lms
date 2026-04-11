<?php

declare(strict_types=1);

namespace App\Filament\Resources\AcademyResource\Widgets;

use App\Domains\Auth\Models\Academy;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class AcademyStatsWidget extends BaseWidget
{
    protected function getStats(): array
    {
        $totalAcademies = Academy::count();
        $activeAcademies = Academy::where('is_active', true)->count();
        $inactiveAcademies = Academy::where('is_active', false)->count();
        $expiredSubscriptions = Academy::whereHas('tenantPlan', function ($query) {
            $query->where('plan_expires_at', '<', now());
        })->count();

        return [
            Stat::make('إجمالي الأكاديميات', $totalAcademies)
                ->description('جميع الأكاديميات المسجلة')
                ->descriptionIcon('heroicon-m-building-library')
                ->color('primary'),

            Stat::make('الأكاديميات النشطة', $activeAcademies)
                ->description($totalAcademies > 0 ? number_format(($activeAcademies / $totalAcademies) * 100, 1) . '% من الإجمالي' : '0%')
                ->descriptionIcon('heroicon-m-check-circle')
                ->color('success'),

            Stat::make('الأكاديميات الغير نشطة', $inactiveAcademies)
                ->description($totalAcademies > 0 ? number_format(($inactiveAcademies / $totalAcademies) * 100, 1) . '% من الإجمالي' : '0%')
                ->descriptionIcon('heroicon-m-x-circle')
                ->color('danger'),

            Stat::make('اشتراكات منتهية', $expiredSubscriptions)
                ->description('تحتاج إلى تجديد')
                ->descriptionIcon('heroicon-m-clock')
                ->color('warning'),
        ];
    }
}
