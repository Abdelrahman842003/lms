<?php

declare(strict_types=1);

namespace App\Domains\Support\Services;

use App\Domains\Support\Models\Setting;
use Illuminate\Pagination\LengthAwarePaginator;

class HelperService
{
    /**
     * Get Arabic month name
     */
    public static function getArabicMonthName(int $month): string
    {
        $months = [
            1  => 'يناير',
            2  => 'فبراير',
            3  => 'مارس',
            4  => 'أبريل',
            5  => 'مايو',
            6  => 'يونيو',
            7  => 'يوليو',
            8  => 'أغسطس',
            9  => 'سبتمبر',
            10 => 'أكتوبر',
            11 => 'نوفمبر',
            12 => 'ديسمبر',
        ];

        return $months[$month] ?? '';
    }

    /**
     * Get Arabic status label
     */
    public static function getStatusLabel(string $status): string
    {
        return match($status) {
            'paid'      => 'مدفوع',
            'partial'   => 'مدفوع جزئياً',
            'pending'   => 'غير مدفوع',
            'confirmed' => 'مؤكد',
            'rejected'  => 'مرفوض',
            default     => $status,
        };
    }

    /**
     * Get price per student from settings (Cached)
     * @deprecated Use getTeacherPricePerStudent() or getAcademyPricePerStudent()
     */
    public static function getPricePerStudent(): float
    {
        return self::getTeacherPricePerStudent();
    }

    /**
     * Get academy student price from settings (Cached)
     * @deprecated Use getAcademyPricePerStudent()
     */
    public static function getAcademyStudentPrice(): float
    {
        return self::getAcademyPricePerStudent();
    }

    /**
     * Get price per student (Teacher)
     */
    public static function getTeacherPricePerStudent(): float
    {
        return (float) \App\Domains\Support\Models\Setting::where('key', 'teacher_price_per_student')->value('value') ?: 60;
    }

    /**
     * Get price per student (Academy)
     */
    public static function getAcademyPricePerStudent(): float
    {
        return (float) \App\Domains\Support\Models\Setting::where('key', 'academy_price_per_student')->value('value') ?: 40;
    }

    /**
     * Get storage price per GB per month (Teacher)
     */
    public static function getTeacherStoragePricePerGb(): float
    {
        return (float) \App\Domains\Support\Models\Setting::where('key', 'teacher_storage_price_per_gb')->value('value') ?: 0;
    }

    /**
     * Get storage price per GB per month (Academy)
     */
    public static function getAcademyStoragePricePerGb(): float
    {
        return (float) \App\Domains\Support\Models\Setting::where('key', 'academy_storage_price_per_gb')->value('value') ?: 0;
    }

    /**
     * Get trial period days (Default 14)
     */
    public static function getTrialPeriodDays(): int
    {
        return (int) \App\Domains\Support\Models\Setting::where('key', 'trial_period_days')->value('value') ?: 14;
    }

    /**
     * Calculate rank for paginated results
     */
    public static function calculatePaginationRank(int $index, LengthAwarePaginator $paginator): int
    {
        return ($paginator->currentPage() - 1) * $paginator->perPage() + $index + 1;
    }
}
