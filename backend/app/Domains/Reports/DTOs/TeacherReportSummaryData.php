<?php

declare(strict_types=1);

namespace App\Domains\Reports\DTOs;

/**
 * DTO for teacher report summary data
 */
final readonly class TeacherReportSummaryData
{
    /**
     * @param int $totalStudents Total number of students
     * @param int $activeStudents Number of active students
     * @param int $newEnrollments New enrollments in period
     * @param int $totalSecretaries Total secretaries
     * @param float $confirmedPayments Total confirmed payments
     * @param int $payingStudentsCount Students who paid in period
     * @param float $pricePerStudent Price per student (60 EGP for teachers)
     * @param float $subscriptionFee Subscription fee for platform
     */
    public function __construct(
        public int $totalStudents,
        public int $activeStudents,
        public int $newEnrollments,
        public int $totalSecretaries,
        public float $confirmedPayments,
        public int $payingStudentsCount,
        public float $pricePerStudent,
        public float $subscriptionFee = 0,
    ) {}

    /**
     * Convert to array for API response
     */
    public function toArray(): array
    {
        return [
            'total_students' => $this->totalStudents,
            'active_students' => $this->activeStudents,
            'new_enrollments' => $this->newEnrollments,
            'total_secretaries' => $this->totalSecretaries,
            'confirmed_payments' => $this->confirmedPayments,
            'paying_students_count' => $this->payingStudentsCount,
            'price_per_student' => $this->pricePerStudent,
            'subscription_fee' => $this->subscriptionFee,
        ];
    }
}
