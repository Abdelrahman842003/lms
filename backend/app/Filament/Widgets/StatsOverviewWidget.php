<?php

namespace App\Filament\Widgets;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Student;
use App\Domains\Subscriptions\Models\Subscription;
use App\Domains\Auth\Models\Teacher;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Database\Eloquent\Builder;

class StatsOverviewWidget extends BaseWidget
{
    protected ?string $pollingInterval = '30s';

    protected function getStats(): array
    {
        $totalAcademies = Academy::count();
        $totalTeachers = Teacher::count();
        $totalStudents = Student::count();
        $activeSubscriptions = Subscription::paid()->count();

        // Get last month's data for trends
        $lastMonthStart = now()->subMonth()->startOfMonth();
        $lastMonthEnd = now()->subMonth()->endOfMonth();
        $thisMonthStart = now()->startOfMonth();

        // Academy trends
        $academiesLastMonth = Academy::whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])->count();
        $academiesThisMonth = Academy::where('created_at', '>=', $thisMonthStart)->count();
        $academyTrend = $this->calculateTrend($academiesThisMonth, $academiesLastMonth);

        // Teacher trends
        $teachersLastMonth = Teacher::whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])->count();
        $teachersThisMonth = Teacher::where('created_at', '>=', $thisMonthStart)->count();
        $teacherTrend = $this->calculateTrend($teachersThisMonth, $teachersLastMonth);

        // Student trends
        $studentsLastMonth = Student::whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])->count();
        $studentsThisMonth = Student::where('created_at', '>=', $thisMonthStart)->count();
        $studentTrend = $this->calculateTrend($studentsThisMonth, $studentsLastMonth);

        // Subscription trends
        $subscriptionsLastMonth = Subscription::whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])
            ->paid()
            ->count();
        $subscriptionsThisMonth = Subscription::where('created_at', '>=', $thisMonthStart)
            ->paid()
            ->count();
        $subscriptionTrend = $this->calculateTrend($subscriptionsThisMonth, $subscriptionsLastMonth);

        $pendingPaymentsCount = \App\Domains\Subscriptions\Models\PaymentTransaction::pending()->count();
        $thisMonthRevenue = \App\Domains\Subscriptions\Models\PaymentTransaction::confirmed()
            ->where('confirmed_at', '>=', $thisMonthStart)
            ->sum('amount');

        return [
            Stat::make(__('Total Academies'), $totalAcademies)
                ->description($academyTrend['description'])
                ->descriptionIcon($academyTrend['icon'])
                ->color($academyTrend['color'])
                ->icon('heroicon-o-building-office-2')
                ->chart($this->getTrendChart(Academy::class)),

            Stat::make(__('Total Teachers'), $totalTeachers)
                ->description($teacherTrend['description'])
                ->descriptionIcon($teacherTrend['icon'])
                ->color($teacherTrend['color'])
                ->icon('heroicon-o-academic-cap')
                ->chart($this->getTrendChart(Teacher::class)),

            Stat::make(__('Total Students'), $totalStudents)
                ->description($studentTrend['description'])
                ->descriptionIcon($studentTrend['icon'])
                ->color($studentTrend['color'])
                ->icon('heroicon-o-users')
                ->chart($this->getTrendChart(Student::class)),

            Stat::make(__('Active Subscriptions'), $activeSubscriptions)
                ->description($subscriptionTrend['description'])
                ->descriptionIcon($subscriptionTrend['icon'])
                ->color($subscriptionTrend['color'])
                ->icon('heroicon-o-credit-card')
                ->chart($this->getTrendChart(Subscription::class, fn ($q) => $q->paid())),

            Stat::make('المدفوعات المعلقة', $pendingPaymentsCount)
                ->description('عمليات دفع ذاتي معلقة بانتظار التأكيد')
                ->icon('heroicon-o-clock')
                ->color($pendingPaymentsCount > 0 ? 'warning' : 'gray'),

            Stat::make('إيرادات الدفع الذاتي (هذا الشهر)', number_format((float) $thisMonthRevenue, 2) . ' ج.م')
                ->description('إجمالي الاشتراكات المؤكدة ذاتياً هذا الشهر')
                ->icon('heroicon-o-banknotes')
                ->color('success'),
        ];
    }

    /**
     * Calculate trend data for stats
     */
    private function calculateTrend(int $current, int $previous): array
    {
        if ($previous === 0) {
            if ($current === 0) {
                return [
                    'description' => __('No change'),
                    'icon' => 'heroicon-m-minus',
                    'color' => 'gray',
                ];
            }

            return [
                'description' => __('New this month'),
                'icon' => 'heroicon-m-arrow-trending-up',
                'color' => 'success',
            ];
        }

        $change = (($current - $previous) / $previous) * 100;
        $formattedChange = number_format(abs($change), 1);

        if ($change > 0) {
            return [
                'description' => __('+:change% vs last month', ['change' => $formattedChange]),
                'icon' => 'heroicon-m-arrow-trending-up',
                'color' => 'success',
            ];
        } elseif ($change < 0) {
            return [
                'description' => __('-:change% vs last month', ['change' => $formattedChange]),
                'icon' => 'heroicon-m-arrow-trending-down',
                'color' => 'danger',
            ];
        }

        return [
            'description' => __('No change'),
            'icon' => 'heroicon-m-minus',
            'color' => 'gray',
        ];
    }

    /**
     * Get chart data for the last 7 days
     */
    private function getTrendChart(string $modelClass, ?callable $filter = null): array
    {
        $data = [];
        $labels = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $labels[] = $date->translatedFormat('M d');

            $query = $modelClass::whereDate('created_at', $date);

            if ($filter) {
                $query = $filter($query);
            }

            $data[] = $query->count();
        }

        return $data;
    }
}
