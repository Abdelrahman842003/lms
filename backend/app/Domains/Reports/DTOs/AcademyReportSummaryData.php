<?php

declare(strict_types=1);

namespace App\Domains\Reports\DTOs;

/**
 * DTO for academy report summary data
 * Focuses on subscription_fee as the primary metric per SUBSCRIPTION_SYSTEM_CHANGES.md
 */
final readonly class AcademyReportSummaryData
{
    /**
     * @param int $totalTeachers Total number of teachers
     * @param int $activeTeachers Number of active teachers
     * @param int $totalAcademyStudents Total unique students
     * @param int $totalEnrollments Total enrollments
     * @param int $activeEnrollments Active enrollments
     * @param int $totalSubscriptions Total subscription months paid
     * @param int $totalPaymentTransactions Number of payment transactions
     * @param float $subscriptionFee السعر المدفوع للمنصة (Primary metric)
     * @param float $confirmedPayments Total confirmed payments
     * @param float $remainingBalance Remaining balance to pay
     * @param string $paymentStatus paid|partial|unpaid
     * @param float $pricePerStudent Price per student (40 EGP for academies)
     */
    public function __construct(
        public int $totalTeachers,
        public int $activeTeachers,
        public int $totalAcademyStudents,
        public int $totalEnrollments,
        public int $activeEnrollments,
        public int $totalSubscriptions,
        public int $totalPaymentTransactions,
        public float $subscriptionFee,
        public float $confirmedPayments,
        public float $remainingBalance,
        public string $paymentStatus,
        public float $pricePerStudent,
    ) {}

    /**
     * Convert to array for API response
     */
    public function toArray(): array
    {
        return [
            'total_teachers' => $this->totalTeachers,
            'active_teachers' => $this->activeTeachers,
            'total_academy_students' => $this->totalAcademyStudents,
            'total_enrollments' => $this->totalEnrollments,
            'active_enrollments' => $this->activeEnrollments,
            'total_subscriptions' => $this->totalSubscriptions,
            'total_payment_transactions' => $this->totalPaymentTransactions,
            'subscription_fee' => $this->subscriptionFee,
            'confirmed_payments' => $this->confirmedPayments,
            'remaining_balance' => $this->remainingBalance,
            'payment_status' => $this->paymentStatus,
            'price_per_student' => $this->pricePerStudent,
        ];
    }
}
