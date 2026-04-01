<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Application\Builders\Academy;

use App\Domains\Auth\Models\Academy;
use App\Domains\Reporting\Infrastructure\Queries\Academy\AcademySubscriptionQueries;

final readonly class SubscriptionUsageBuilder
{
    public function __construct(
        private AcademySubscriptionQueries $subscriptionQueries,
    ) {}

    public function build(Academy $academy): array
    {
        return $this->subscriptionQueries->getFullSubscriptionUsage($academy);
    }
}
