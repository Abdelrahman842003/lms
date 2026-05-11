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
        // Truncate settings table to ensure a clean state
        \Illuminate\Support\Facades\Schema::disableForeignKeyConstraints();
        \Illuminate\Support\Facades\DB::table('settings')->truncate();
        \Illuminate\Support\Facades\Schema::enableForeignKeyConstraints();

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
