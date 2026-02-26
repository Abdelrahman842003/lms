<?php

namespace App\Filament\Widgets;

use App\Domains\Auth\Models\Academy;
use Filament\Widgets\ChartWidget;
use Illuminate\Support\Facades\DB;

class AcademyDistributionChart extends ChartWidget
{
    protected ?string $heading = 'Academies by Subscription Plan';

    protected static ?int $sort = 4;

    protected int|string|array $columnSpan = 1;

    protected ?string $maxHeight = '300px';

    protected function getData(): array
    {
        $data = Academy::query()
            ->select('subscription_plan', DB::raw('COUNT(*) as count'))
            ->groupBy('subscription_plan')
            ->pluck('count', 'subscription_plan')
            ->toArray();

        // Ensure we have all plan types with defaults
        $plans = ['basic', 'standard', 'premium', 'enterprise'];
        $chartData = [];
        $labels = [];

        foreach ($plans as $plan) {
            $count = $data[$plan] ?? 0;
            $chartData[] = $count;
            $labels[] = __(ucfirst($plan));
        }

        // Add any custom plans
        foreach ($data as $plan => $count) {
            if (!in_array($plan, $plans)) {
                $chartData[] = $count;
                $labels[] = __(ucfirst($plan));
            }
        }

        return [
            'datasets' => [
                [
                    'label' => __('Academies'),
                    'data' => $chartData,
                    'backgroundColor' => [
                        '#3b82f6', // blue-500 (basic)
                        '#eab308', // yellow-500 (standard)
                        '#22c55e', // green-500 (premium)
                        '#8b5cf6', // violet-500 (enterprise)
                        '#6b7280', // gray-500 (others)
                    ],
                    'borderColor' => [
                        '#2563eb',
                        '#ca8a04',
                        '#16a34a',
                        '#7c3aed',
                        '#4b5563',
                    ],
                    'borderWidth' => 2,
                    'hoverOffset' => 4,
                ],
            ],
            'labels' => $labels,
        ];
    }

    protected function getType(): string
    {
        return 'doughnut';
    }

    protected function getOptions(): array
    {
        return [
            'responsive' => true,
            'maintainAspectRatio' => false,
            'plugins' => [
                'legend' => [
                    'position' => 'bottom',
                    'labels' => [
                        'padding' => 20,
                        'usePointStyle' => true,
                        'font' => [
                            'family' => "'Inter', sans-serif",
                            'size' => 12,
                        ],
                    ],
                ],
                'tooltip' => [
                    'backgroundColor' => 'rgba(0, 0, 0, 0.8)',
                    'padding' => 12,
                    'cornerRadius' => 8,
                    'titleFont' => [
                        'family' => "'Inter', sans-serif",
                        'size' => 14,
                        'weight' => 'bold',
                    ],
                    'bodyFont' => [
                        'family' => "'Inter', sans-serif",
                        'size' => 13,
                    ],
                ],
            ],
            'cutout' => '60%',
            'animation' => [
                'animateScale' => true,
                'animateRotate' => true,
            ],
        ];
    }

    /**
     * Get additional statistics for the chart
     */
    public function getTotalAcademies(): int
    {
        return Academy::count();
    }

    /**
     * Get the most popular plan
     */
    public function getMostPopularPlan(): ?string
    {
        $plan = Academy::query()
            ->select('subscription_plan', DB::raw('COUNT(*) as count'))
            ->groupBy('subscription_plan')
            ->orderByDesc('count')
            ->first();

        return $plan?->subscription_plan;
    }
}
