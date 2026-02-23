<?php

declare(strict_types=1);

namespace App\DTO\Reports;

/**
 * DTO for teacher report data
 */
final readonly class TeacherReportData
{
    /**
     * @param array<string, mixed> $teacher Teacher information
     * @param ReportPeriodData $period Report period
     * @param TeacherReportSummaryData $summary Summary statistics
     * @param array<string, mixed> $financialDetails Financial breakdown
     * @param array<int, array<string, mixed>> $monthlyBreakdown Monthly data
     * @param array<int, array<string, mixed>> $subscriptionBreakdown Subscription details by month
     * @param string $generatedAt Report generation timestamp
     */
    public function __construct(
        public array $teacher,
        public ReportPeriodData $period,
        public TeacherReportSummaryData $summary,
        public array $financialDetails,
        public array $monthlyBreakdown,
        public array $subscriptionBreakdown,
        public string $generatedAt,
    ) {}

    /**
     * Convert to array for API response
     */
    public function toArray(): array
    {
        return [
            'teacher' => $this->teacher,
            'period' => $this->period->toArray(),
            'summary' => $this->summary->toArray(),
            'financial_details' => $this->financialDetails,
            'monthly_breakdown' => $this->monthlyBreakdown,
            'subscription_breakdown' => $this->subscriptionBreakdown,
            'generated_at' => $this->generatedAt,
        ];
    }
}
