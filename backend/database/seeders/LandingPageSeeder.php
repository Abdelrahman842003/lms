<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domains\Application\Models\Setting;
use Illuminate\Database\Seeder;

class LandingPageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $content = [
            'hero' => [
                'badge' => 'نقدم لكم نطاق',
                'title' => 'النظام الذي يفهم التعليم',
                'subtitle' => 'كما تفهمه أنت.',
                'description' => 'بعيداً عن الأدوات التقليدية، نطاق هو نظام تشغيل متكامل مصمم خصيصاً للمؤسسات التعليمية.',
                'cta_primary' => 'ابدأ تجربة مجانية',
                'cta_secondary' => 'الأسعار',
            ],
            'features' => [
                [
                    'icon' => 'heroicon-o-rocket-launch',
                    'title' => 'سرعة في الأداء',
                    'description' => 'واجهة مستخدم سريعة وسلسة تضمن تجربة تعليمية فريدة.',
                ],
                [
                    'icon' => 'heroicon-o-shield-check',
                    'title' => 'أمان وحماية',
                    'description' => 'حماية متقدمة للمحتوى التعليمي وبيانات الطلاب.',
                ],
                [
                    'icon' => 'heroicon-o-chart-bar',
                    'title' => 'تقارير مفصلة',
                    'description' => 'متابعة دقيقة لمستوى الطلاب من خلال تقارير وتحليلات ذكية.',
                ],
            ],
            'stats' => [
                ['label' => 'طالب نشط', 'value' => '10,000+'],
                ['label' => 'مدرس مشترك', 'value' => '500+'],
                ['label' => 'دورة تعليمية', 'value' => '2,000+'],
            ],
            'testimonials' => [
                [
                    'name' => 'أحمد محمد',
                    'role' => 'مدرس لغة عربية',
                    'quote' => 'نطاق ساعدني جداً في تنظيم دروسي ومتابعة طلابي بشكل احترافي.',
                ],
            ],
        ];

        Setting::updateOrCreate(
            ['key' => 'landing_page_content'],
            [
                'value' => json_encode($content, JSON_UNESCAPED_UNICODE),
                'group' => 'landing',
            ]
        );

        $this->command->info('Landing page content seeded.');
    }
}
