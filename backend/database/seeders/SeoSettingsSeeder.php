<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domains\Application\Models\Setting;
use Illuminate\Database\Seeder;

class SeoSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            // Site Information
            [
                'key' => 'site_name',
                'value' => 'Netaq - نطاق',
                'group' => 'general',
            ],
            [
                'key' => 'site_title',
                'value' => 'منصة نطاق - للتميز التعليمي',
                'group' => 'general',
            ],
            
            // SEO Settings
            [
                'key' => 'seo_description',
                'value' => 'نطاق هي منصة تعليمية متكاملة تهدف إلى تنظيم العمل التعليمي وتطوير مستوى الطلاب من خلال نظام Gamification متطور.',
                'group' => 'seo',
            ],
            [
                'key' => 'seo_keywords',
                'value' => 'تعليم, منصة تعليمية, دروس, امتحانات, متابعة طلاب, Gamification, تعلم ذكي',
                'group' => 'seo',
            ],
            
            // Geographic & Contact Info
            [
                'key' => 'geo_location',
                'value' => 'Egypt',
                'group' => 'general',
            ],
            [
                'key' => 'contact_email',
                'value' => 'contact@netaq.com',
                'group' => 'general',
            ],
            [
                'key' => 'support_phone',
                'value' => '+20123456789',
                'group' => 'general',
            ],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
