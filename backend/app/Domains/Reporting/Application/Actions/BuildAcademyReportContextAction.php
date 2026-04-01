<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Actions;

use App\Domains\Reporting\Domain\ValueObjects\AcademyReportFilters;
use App\Domains\Reporting\Infrastructure\Filters\ReportFilterNormalizer;
use DateTimeZone;

final readonly class BuildAcademyReportContextAction
{
    public function __construct(
        private ReportFilterNormalizer $normalizer,
    ) {}

    public function execute(array $input, DateTimeZone|string $timezone = 'UTC'): AcademyReportFilters
    {
        $baseFilters = $this->normalizer->normalize($input, $timezone);

        return new AcademyReportFilters(
            base: $baseFilters,
            teacherId: $input['teacher_id'] ?? null,
            gradeId: $input['grade_id'] ?? null,
            groupId: $input['group_id'] ?? null,
            studentStatus: $input['student_status'] ?? null,
            sessionStatus: $input['session_status'] ?? null,
        );
    }
}
