<?php

declare(strict_types=1);

namespace App\DTO\Reports;

/**
 * DTO for admin report summary data
 * Shows platform-wide metrics with subscription_fee calculations
 */
final readonly class AdminReportSummaryData
{
    /**
     * @param int $totalAcademies Total number of academies
     * @param int $independentTeachersCount Independent teachers count
     * @param int $totalTeachers Total teachers
     * @param int $activeTeachers Active teachers
     * @param int $suspendedTeachers Suspended teachers
     * @param int $newTeachers New teachers in period
     * @param int $totalStudents Total students
     * @param int $newStudents New students in period
     * @param int $totalSecretaries Total secretaries
     * @param int $totalEnrollments Total enrollments
     * @param int $activeEnrollments Active enrollments
     * @param int $newEnrollments New enrollments in period
     * @param int $totalSubscriptions Total subscription months
     * @param int $academySubscriptions Academy subscriptions
     * @param int $independentSubscriptions Independent teacher subscriptions
     * @param float $totalSubscriptionFees Total subscription fees from all sources
     * @param float $confirmedPayments Total confirmed payments
     * @param float $independentCommission Commission from independent teachers
     * @param float $academyPlatformShare Platform share from academies
     * @param float $netPlatformProfit Net platform profit
     * @param float $pricePerStudent Teacher price (60 EGP)
     * @param float $academyStudentPrice Academy price (40 EGP)
     */
    public function __construct(
        public int $totalAcademies,
        public int $independentTeachersCount,
        public int $totalTeachers,
        public int $activeTeachers,
        public int $suspendedTeachers,
        public int $newTeachers,
        public int $totalStudents,
        public int $newStudents,
        public int $totalSecretaries,
        public int $totalEnrollments,
        public int $activeEnrollments,
        public int $newEnrollments,
        public int $totalSubscriptions,
        public int $academySubscriptions,
        public int $independentSubscriptions,
        public float $totalSubscriptionFees,
        public float $confirmedPayments,
        public float $independentCommission,
        public float $academyPlatformShare,
        public float $netPlatformProfit,
        public float $pricePerStudent,
        public float $academyStudentPrice,
    ) {}

    /**
     * Convert to array for API response
     */
    public function toArray(): array
    {
        return [
            // Counts
            'total_academies' => $this->totalAcademies,
            'independent_teachers_count' => $this->independentTeachersCount,
            'total_teachers' => $this->totalTeachers,
            'active_teachers' => $this->activeTeachers,
            'suspended_teachers' => $this->suspendedTeachers,
            'new_teachers' => $this->newTeachers,
            'total_students' => $this->totalStudents,
            'new_students' => $this->newStudents,
            'total_secretaries' => $this->totalSecretaries,
            'total_enrollments' => $this->totalEnrollments,
            'active_enrollments' => $this->activeEnrollments,
            'new_enrollments' => $this->newEnrollments,

            // Subscriptions
            'total_subscriptions' => $this->totalSubscriptions,
            'academy_subscriptions' => $this->academySubscriptions,
            'independent_subscriptions' => $this->independentSubscriptions,

            // Financials - using subscription_fee terminology
            'total_subscription_fees' => $this->totalSubscriptionFees,
            'confirmed_payments' => $this->confirmedPayments,
            'independent_commission' => $this->independentCommission,
            'academy_platform_share' => $this->academyPlatformShare,
            'net_platform_profit' => $this->netPlatformProfit,

            // Pricing info
            'price_per_student' => $this->pricePerStudent,
            'academy_student_price' => $this->academyStudentPrice,
        ];
    }
}
