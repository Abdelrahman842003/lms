<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domains\Gamification\Models\GamificationLevel;
use Illuminate\Database\Seeder;

class GamificationLevelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $levels = [
            [
                'name' => 'طالب علم',
                'description' => 'بداية الطريق بوعي.',
                'icon' => '🌱',
                'color' => '#cbd5e0',
                'min_points' => 0,
                'max_points' => 99,
                'sort_order' => 1,
            ],
            [
                'name' => 'مُستكشف',
                'description' => 'شخص بدأ يدور ويفهم الأساسيات.',
                'icon' => '🔍',
                'color' => '#a0aec0',
                'min_points' => 100,
                'max_points' => 249,
                'sort_order' => 2,
            ],
            [
                'name' => 'طموح',
                'description' => 'باين عليه إنه عايز يوصل لحاجة كبيرة.',
                'icon' => '🚀',
                'color' => '#68d391',
                'min_points' => 250,
                'max_points' => 499,
                'sort_order' => 3,
            ],
            [
                'name' => 'مُجتهد',
                'description' => 'إثبات إنه شخص بيشتغل على نفسه بجد.',
                'icon' => '💪',
                'color' => '#48bb78',
                'min_points' => 500,
                'max_points' => 799,
                'sort_order' => 4,
            ],
            [
                'name' => 'مُثابر',
                'description' => 'شخص عنده صمود ومبينقطعش عن المذاكرة.',
                'icon' => '⏳',
                'color' => '#38a169',
                'min_points' => 800,
                'max_points' => 1199,
                'sort_order' => 5,
            ],
            [
                'name' => 'مُتميز',
                'description' => 'بدأ يسبق اللي في سنه وفي مستواه.',
                'icon' => '✨',
                'color' => '#63b3ed',
                'min_points' => 1200,
                'max_points' => 1699,
                'sort_order' => 6,
            ],
            [
                'name' => 'مُبدع',
                'description' => 'مبقاش بس بيذاكر، بقى بيحل بأسلوب ذكي.',
                'icon' => '💡',
                'color' => '#4299e1',
                'min_points' => 1700,
                'max_points' => 2299,
                'sort_order' => 7,
            ],
            [
                'name' => 'مُتمكن',
                'description' => 'واثق من معلوماته، وصعب يغلط في الأساسيات.',
                'icon' => '🎯',
                'color' => '#3182ce',
                'min_points' => 2300,
                'max_points' => 2999,
                'sort_order' => 8,
            ],
            [
                'name' => 'خـبـيـر',
                'description' => 'وصل لمرحلة إن المادة بقت "في جيبه".',
                'icon' => '🎓',
                'color' => '#9f7aea',
                'min_points' => 3000,
                'max_points' => 3999,
                'sort_order' => 9,
            ],
            [
                'name' => 'مُبتكر',
                'description' => 'بيقدر يطبق اللي اتعلمه في أفكار جديدة.',
                'icon' => '🎨',
                'color' => '#805ad5',
                'min_points' => 4000,
                'max_points' => 5499,
                'sort_order' => 10,
            ],
            [
                'name' => 'مُـلـهـم',
                'description' => 'مستواه يخلي الناس التانية تقلد اجتهاده.',
                'icon' => '🌟',
                'color' => '#ed64a6',
                'min_points' => 5500,
                'max_points' => 7499,
                'sort_order' => 11,
            ],
            [
                'name' => 'نـابـغـة',
                'description' => 'لقب فخم جداً في أي شهادة، بيوحي بذكاء خارق.',
                'icon' => '💎',
                'color' => '#d53f8c',
                'min_points' => 7500,
                'max_points' => 9999,
                'sort_order' => 12,
            ],
            [
                'name' => 'رائد (Pioneer)',
                'description' => 'شخص بيقود الطريق وبقى مرجع في مجاله.',
                'icon' => '🚩',
                'color' => '#f6e05e',
                'min_points' => 10000,
                'max_points' => 14999,
                'sort_order' => 13,
            ],
            [
                'name' => 'أستاذ (Master)',
                'description' => 'درجة من الاحترافية تخليه يعلم غيره.',
                'icon' => '⚔️',
                'color' => '#ecc94b',
                'min_points' => 15000,
                'max_points' => 19999,
                'sort_order' => 14,
            ],
            [
                'name' => 'الـعـمـيـد (Dean)',
                'description' => 'القمة.. لقب رسمي وقوي جداً للي ختم "نطاق".',
                'icon' => '👑',
                'color' => '#d69e2e',
                'min_points' => 20000,
                'max_points' => null,
                'sort_order' => 15,
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
