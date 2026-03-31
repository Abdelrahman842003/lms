<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Actions;

use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;
use App\Domains\Reporting\Infrastructure\Filters\ReportFilterNormalizer;
use DateTimeZone;

final readonly class BuildReportContextAction
{
    public function __construct(
        private ReportFilterNormalizer $normalizer,
    ) {}

    public function execute(array $input, DateTimeZone|string $timezone = 'UTC'): ReportFilters
    {
        return $this->normalizer->normalize($input, $timezone);
    }
}
