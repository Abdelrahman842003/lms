<?php

namespace App\Services;

use App\Models\Setting;
use App\Services\Infrastructure\CacheService;
use Illuminate\Pagination\LengthAwarePaginator;

class HelperService
{
    /**
     * Get Arabic month name
     */
    public static function getArabicMonthName(int $month): string
    {
        $months = [
            1 => 'يناير',
            2 => 'فبراير',
            3 => 'مارس',
            4 => 'أبريل',
            5 => 'مايو',
            6 => 'يونيو',
            7 => 'يوليو',
            8 => 'أغسطس',
            9 => 'سبتمبر',
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
            'paid' => 'مدفوع',
            'partial' => 'مدفوع جزئياً',
            'pending' => 'غير مدفوع',
            'confirmed' => 'مؤكد',
            'rejected' => 'مرفوض',
            default => $status,
        };
    }

    /**
     * Get price per student from settings (Cached)
     */
    public static function getPricePerStudent(): float
    {
        // Use CacheService to get the setting, fallback to DB
        return (float) Setting::getValue('pricePerStudent', 0);
    }

    /**
     * Calculate rank for paginated results
     */
    public static function calculatePaginationRank(int $index, LengthAwarePaginator $paginator): int
    {
        return ($paginator->currentPage() - 1) * $paginator->perPage() + $index + 1;
    }
}
