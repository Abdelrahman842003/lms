<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domains\Support\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            // Platform Pricing
            [
                'key' => 'pricePerStudent',
                'value' => '15',
                'group' => 'pricing',
            ],
            
            // Trial Period
            [
                'key' => 'trial_period_days',
                'value' => '4',
                'group' => 'enrollment',
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
