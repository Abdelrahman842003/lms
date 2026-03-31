<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\Services;

use App\Domains\Reporting\Domain\Contracts\AlertRule;
use App\Domains\Reporting\Domain\DTO\AlertResult;
use App\Domains\Reporting\Domain\Services\AlertRules\TeacherAttendanceDropRule;
use App\Domains\Reporting\Domain\Services\AlertRules\TeacherIncomeConcentrationRule;
use App\Domains\Reporting\Domain\Services\AlertRules\TeacherIncomeDropRule;
use App\Domains\Reporting\Domain\Services\AlertRules\TeacherNearPlanLimitRule;
use App\Domains\Reporting\Domain\Services\AlertRules\TeacherRenewalApproachingRule;
use App\Domains\Reporting\Domain\Services\AlertRules\TeacherStudentInactivityRule;

final class TeacherAlertEngine
{
    /**
     * @param  array<int, AlertRule>  $rules
     */
    public function __construct(
        private readonly array $rules = [],
    ) {}

    /**
     * @return array<int, AlertResult>
     */
    public function evaluate(array $context): array
    {
        $alerts = [];

        foreach ($this->rules as $rule) {
            $result = $rule->evaluate($context);
            if ($result !== null) {
                $alerts[] = $result;
            }
        }

        usort($alerts, fn(AlertResult $a, AlertResult $b): int => $a->severity->priority() <=> $b->severity->priority());

        return $alerts;
    }

    public static function withDefaultRules(): self
    {
        return new self([
            new TeacherIncomeDropRule,
            new TeacherAttendanceDropRule,
            new TeacherStudentInactivityRule,
            new TeacherNearPlanLimitRule,
            new TeacherRenewalApproachingRule,
            new TeacherIncomeConcentrationRule,
        ]);
    }
}
