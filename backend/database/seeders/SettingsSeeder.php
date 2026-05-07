<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->call([
            SeoSettingsSeeder::class,
            SystemRolesSeeder::class,
            AdminAccountSeeder::class,
            VideoSettingsSeeder::class,
            GamificationSettingsSeeder::class,
            LandingPageSeeder::class,
        ]);
    }
}
