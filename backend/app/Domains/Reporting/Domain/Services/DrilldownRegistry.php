<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\Services;

use App\Domains\Reporting\Domain\DTO\DrilldownDescriptor;

final readonly class DrilldownRegistry
{
    /** @param array<string, DrilldownDescriptor> $descriptors */
    public function __construct(
        private array $descriptors = [],
    ) {}

    public function register(DrilldownDescriptor $descriptor): self
    {
        return new self([...$this->descriptors, $descriptor->drilldownKey => $descriptor]);
    }

    public function get(string $drilldownKey): ?DrilldownDescriptor
    {
        return $this->descriptors[$drilldownKey] ?? null;
    }

    public function has(string $drilldownKey): bool
    {
        return isset($this->descriptors[$drilldownKey]);
    }

    /**
     * @return array<string, DrilldownDescriptor>
     */
    public function all(): array
    {
        return $this->descriptors;
    }

    public static function withDefaultDescriptors(): self
    {
        $registry = new self;

        $registry = $registry->register(new DrilldownDescriptor(
            drilldownKey: 'academies_drilldown',
            title: 'Academies Summary',
            supportedFilters: ['plan', 'status'],
            tableSchema: ['name' => 'string', 'linked_student_count' => 'number', 'teacher_count' => 'number', 'plan_type' => 'string', 'is_unlimited_students' => 'boolean', 'created_at' => 'date'],
            defaultSort: ['column' => 'name', 'direction' => 'asc'],
        ));

        $registry = $registry->register(new DrilldownDescriptor(
            drilldownKey: 'teachers_drilldown',
            title: 'Teachers Summary',
            supportedFilters: ['plan', 'status'],
            tableSchema: ['name' => 'string', 'active_student_count' => 'number', 'plan_type' => 'string', 'is_unlimited_students' => 'boolean', 'created_at' => 'date'],
            defaultSort: ['column' => 'name', 'direction' => 'asc'],
        ));

        $registry = $registry->register(new DrilldownDescriptor(
            drilldownKey: 'total_students_drilldown',
            title: 'Students Breakdown',
            supportedFilters: ['academy', 'teacher', 'group'],
            tableSchema: ['name' => 'string', 'academy' => 'string', 'teacher' => 'string', 'enrolled_at' => 'date'],
            defaultSort: ['column' => 'name', 'direction' => 'asc'],
        ));

        $registry = $registry->register(new DrilldownDescriptor(
            drilldownKey: 'active_students_drilldown',
            title: 'Active Students Breakdown',
            supportedFilters: ['teacher', 'group'],
            tableSchema: ['student_name' => 'string', 'group' => 'string', 'last_activity' => 'date', 'status' => 'string'],
            defaultSort: ['column' => 'student_name', 'direction' => 'asc'],
        ));

        $registry = $registry->register(new DrilldownDescriptor(
            drilldownKey: 'active_groups_drilldown',
            title: 'Active Groups Breakdown',
            supportedFilters: ['teacher'],
            tableSchema: ['group_name' => 'string', 'students_count' => 'number', 'active_students' => 'number', 'trend' => 'string'],
            defaultSort: ['column' => 'group_name', 'direction' => 'asc'],
        ));

        $registry = $registry->register(new DrilldownDescriptor(
            drilldownKey: 'attendance_rate_drilldown',
            title: 'Attendance Breakdown',
            supportedFilters: ['teacher', 'course', 'group'],
            tableSchema: ['group_name' => 'string', 'students_count' => 'number', 'attendance_rate' => 'number', 'sessions_count' => 'number', 'trend' => 'string'],
            defaultSort: ['column' => 'attendance_rate', 'direction' => 'desc'],
        ));

        $registry = $registry->register(new DrilldownDescriptor(
            drilldownKey: 'income_this_month_drilldown',
            title: 'Monthly Income Breakdown',
            supportedFilters: ['teacher'],
            tableSchema: ['month' => 'string', 'amount' => 'number', 'previous_amount' => 'number', 'change_pct' => 'number', 'direction' => 'string'],
            defaultSort: ['column' => 'month', 'direction' => 'desc'],
        ));

        $registry = $registry->register(new DrilldownDescriptor(
            drilldownKey: 'income_last_month_drilldown',
            title: 'Previous Month Income Breakdown',
            supportedFilters: ['teacher'],
            tableSchema: ['month' => 'string', 'amount' => 'number', 'previous_amount' => 'number', 'change_pct' => 'number', 'direction' => 'string'],
            defaultSort: ['column' => 'month', 'direction' => 'desc'],
        ));

        $registry = $registry->register(new DrilldownDescriptor(
            drilldownKey: 'ytd_income_drilldown',
            title: 'Year-to-Date Income Breakdown',
            supportedFilters: ['teacher'],
            tableSchema: ['month' => 'string', 'amount' => 'number', 'cumulative' => 'number'],
            defaultSort: ['column' => 'month', 'direction' => 'asc'],
        ));

        $registry = $registry->register(new DrilldownDescriptor(
            drilldownKey: 'plan_usage_drilldown',
            title: 'Plan Usage Breakdown',
            supportedFilters: ['teacher'],
            tableSchema: ['plan_name' => 'string', 'student_limit' => 'number', 'used_slots' => 'number', 'remaining_capacity' => 'number', 'usage_percentage' => 'number', 'status' => 'string'],
            defaultSort: ['column' => 'usage_percentage', 'direction' => 'desc'],
        ));

        $registry = $registry->register(new DrilldownDescriptor(
            drilldownKey: 'revenue_drilldown',
            title: 'Revenue Breakdown',
            supportedFilters: ['month', 'source', 'teacher', 'academy'],
            tableSchema: ['period' => 'string', 'source' => 'string', 'amount' => 'number', 'entity' => 'string'],
            defaultSort: ['column' => 'period', 'direction' => 'desc'],
        ));

        $registry = $registry->register(new DrilldownDescriptor(
            drilldownKey: 'subscription_usage_drilldown',
            title: 'Subscription Usage Breakdown',
            supportedFilters: ['entity', 'plan'],
            tableSchema: ['entity' => 'string', 'plan' => 'string', 'used' => 'number', 'limit' => 'number', 'usage_pct' => 'number'],
            defaultSort: ['column' => 'usage_pct', 'direction' => 'desc'],
        ));

        return $registry;
    }
}
