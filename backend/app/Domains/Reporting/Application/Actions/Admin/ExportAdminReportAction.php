<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Actions\Admin;

use App\Domains\Reporting\Application\Actions\BuildReportContextAction;
use App\Domains\Reporting\Application\Builders\Admin\AdminExportBuilder;
use App\Domains\Reporting\Domain\Contracts\ReportAccessPolicy;
use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;
use Illuminate\Support\Facades\Auth;

final class ExportAdminReportAction
{
    public function __construct(
        private readonly BuildReportContextAction $buildContext,
        private readonly ReportAccessPolicy $accessPolicy,
        private readonly AdminExportBuilder $exportBuilder,
    ) {}

    public function execute(array $input): array
    {
        $filters = $this->buildContext->execute($input);

        $userId = (int) Auth::guard('admin')->id();

        if (!$this->accessPolicy->canExport($userId, $filters)) {
            throw new \Illuminate\Auth\Access\AuthorizationException('You do not have permission to export admin reports.');
        }

        return $this->exportBuilder->build($filters);
    }
}
