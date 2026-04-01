<?php

declare(strict_types=1);

namespace App\Providers;

use App\Domains\Reporting\Domain\Contracts\ReportAccessPolicy;
use App\Domains\Reporting\Domain\Services\AlertEngine;
use App\Domains\Reporting\Domain\Services\DrilldownRegistry;
use App\Domains\Reporting\Domain\Services\KpiCardFactory;
use App\Domains\Reporting\Domain\Services\TeacherAlertEngine;
use App\Domains\Reporting\Domain\Services\TrendCalculationService;
use App\Domains\Reporting\Infrastructure\Filters\ReportFilterNormalizer;
use App\Domains\Reporting\Infrastructure\Policies\AdminReportAccessPolicy;
use App\Domains\Reporting\Infrastructure\Policies\DefaultReportAccessPolicy;
use App\Domains\Reporting\Infrastructure\Queries\SharedDateScope;
use App\Domains\Reporting\Application\Builders\BreakdownBuilder;
use App\Domains\Reporting\Application\Export\ExportPayloadBuilder;
use Illuminate\Support\ServiceProvider;

final class ReportingServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(AlertEngine::class, fn () => AlertEngine::withDefaultRules());
        $this->app->singleton(TeacherAlertEngine::class, fn () => TeacherAlertEngine::withDefaultRules());
        $this->app->singleton(DrilldownRegistry::class, fn () => DrilldownRegistry::withDefaultDescriptors());

        $this->app->singleton(ReportAccessPolicy::class, AdminReportAccessPolicy::class);

        $this->app->singleton(SharedDateScope::class);
        $this->app->singleton(TrendCalculationService::class);
        $this->app->singleton(KpiCardFactory::class);
        $this->app->singleton(BreakdownBuilder::class);
        $this->app->singleton(ExportPayloadBuilder::class);
        $this->app->singleton(ReportFilterNormalizer::class);
    }

    public function boot(): void {}
}
