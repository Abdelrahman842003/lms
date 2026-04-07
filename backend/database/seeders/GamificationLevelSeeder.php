<?php

namespace Database\Seeders;

use App\Domains\Gamification\Models\GamificationLevel;
use Illuminate\Database\Seeder;

class GamificationLevelSeeder extends Seeder
{
    public function run(): void
    {
        $levels = [
            [
                'name' => 'طالب مبتدئ',
                'description' => 'بداية الرحلة',
                'icon' => '🌱',
                'color' => '#A0AEC0',
                'min_points' => 0,
                'max_points' => 99,
                'sort_order' => 1,
            ],
            [
                'name' => 'باحث',
                'description' => 'يبحث عن المعرفة',
                'icon' => '🔍',
                'color' => '#68D391',
                'min_points' => 100,
                'max_points' => 299,
                'sort_order' => 2,
            ],
            [
                'name' => 'دارس',
                'description' => 'يتعلم ويجتهد',
                'icon' => '📖',
                'color' => '#4299E1',
                'min_points' => 300,
                'max_points' => 599,
                'sort_order' => 3,
            ],
            [
                'name' => 'متعلم',
                'description' => 'اكتسب أساسيات',
                'icon' => '📚',
                'color' => '#9F7AEA',
                'min_points' => 600,
                'max_points' => 999,
                'sort_order' => 4,
            ],
            [
                'name' => 'أديب',
                'description' => 'لديه أدب العلم',
                'icon' => '✒️',
                'color' => '#ED8936',
                'min_points' => 1000,
                'max_points' => 1499,
                'sort_order' => 5,
            ],
            [
                'name' => 'عالِم',
                'description' => 'وصل لمرتبة العلم',
                'icon' => '🔬',
                'color' => '#38B2AC',
                'min_points' => 1500,
                'max_points' => 2199,
                'sort_order' => 6,
            ],
            [
                'name' => 'حكيم',
                'description' => 'حكمة وفهم عميق',
                'icon' => '🏛️',
                'color' => '#E53E3E',
                'min_points' => 2200,
                'max_points' => 2999,
                'sort_order' => 7,
            ],
            [
                'name' => 'نابغة',
                'description' => 'تفوق واضح',
                'icon' => '⭐',
                'color' => '#D69E2E',
                'min_points' => 3000,
                'max_points' => 3999,
                'sort_order' => 8,
            ],
            [
                'name' => 'عبقري',
                'description' => 'عقل متميز',
                'icon' => '💎',
                'color' => '#805AD5',
                'min_points' => 4000,
                'max_points' => 5499,
                'sort_order' => 9,
            ],
            [
                'name' => 'فيلسوف',
                'description' => 'قمة المعرفة',
                'icon' => '👑',
                'color' => '#FFD700',
                'min_points' => 5500,
                'max_points' => null,
                'sort_order' => 10,
            ],
        ];

        foreach ($levels as $level) {
            GamificationLevel::updateOrCreate(
                ['sort_order' => $level['sort_order']],
                $level
            );
        }
    }
}
