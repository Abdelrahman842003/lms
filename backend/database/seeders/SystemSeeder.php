<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class SystemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Clean start (Optional: depending on environment)
        if (app()->environment('local', 'testing')) {
            $this->command->warn('Cleaning existing data for a fresh start...');
            Schema::disableForeignKeyConstraints();
            
            // Tables to truncate
            $tables = [
                'permissions',
                'roles',
                'model_has_roles',
                'model_has_permissions',
                'role_has_permissions',
                'settings',
                'users',
                'admins',
                'teachers',
                'academies',
                'students',
                'guardians',
                'secretaries',
                'gamification_levels',
            ];

            foreach ($tables as $table) {
                if (Schema::hasTable($table)) {
                    DB::table($table)->truncate();
                }
            }

            Schema::enableForeignKeyConstraints();
            $this->command->info('Existing data cleaned.');
        }

        // 2. Execute seeders in correct order
        $this->call([
            // Security First
            PermissionsSeeder::class,
            SystemRolesSeeder::class, // For secretary roles etc.

            // Settings & Configuration
            SeoSettingsSeeder::class,
            VideoSettingsSeeder::class, 
            GamificationSettingsSeeder::class,
            LandingPageSeeder::class,

            // Test Data & Accounts
            TestAccountsSeeder::class,
        ]);

        $this->command->info('System Seeder completed successfully!');
    }
}
