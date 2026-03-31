<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\Contracts;

use App\Domains\Reporting\Domain\DTO\AlertResult;

interface AlertRule
{
    public function evaluate(array $context): ?AlertResult;
}
