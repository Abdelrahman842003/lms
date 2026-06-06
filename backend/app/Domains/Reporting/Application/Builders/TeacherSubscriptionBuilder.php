<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Builders;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Reporting\Domain\ValueObjects\TeacherReportFilters;
use App\Domains\Reporting\Domain\ValueObjects\TeacherScope;
use App\Domains\Reporting\Infrastructure\Queries\TeacherSubscriptionQueryService;

final readonly class TeacherSubscriptionBuilder
{
    public function __construct(
        private TeacherSubscriptionQueryService $subscriptionQuery,
    ) {}

    public function build($teacher, TeacherScope $scope, TeacherReportFilters $filters): array
    {
        $details = $this->subscriptionQuery->planDetails($teacher, $filters);

        return [
            'plan_name' => $details['plan_name'],
            'student_limit' => $details['student_limit'],
            'used_slots' => $details['used_slots'],
            'remaining_capacity' => $details['remaining_capacity'],
            'usage_percentage' => $details['usage_percentage'],
            'renewal_date' => $details['renewal_date'],
            'status' => $details['status'],
        ];
    }
}
