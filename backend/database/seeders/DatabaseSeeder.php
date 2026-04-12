<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    // use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        // Disable foreign key checks to allow truncation
        \Illuminate\Support\Facades\Schema::disableForeignKeyConstraints();

        // Truncate tables
        \App\Domains\Auth\Models\Admin::truncate();
        \Spatie\Permission\Models\Role::truncate();
        \Spatie\Permission\Models\Permission::truncate();
        \Illuminate\Support\Facades\DB::table('model_has_roles')->truncate();
        \Illuminate\Support\Facades\DB::table('model_has_permissions')->truncate();
        \Illuminate\Support\Facades\DB::table('role_has_permissions')->truncate();

        // Enable foreign key checks
        \Illuminate\Support\Facades\Schema::enableForeignKeyConstraints();

        $this->call([
            FilamentPermissionSeeder::class,
            PermissionSeeder::class,
            SecretaryAppPermissionsSeeder::class,
            // AcademySeeder::class,
            // CompleteSeeder::class,
            // AttachTeachersToAcademySeeder::class,
            // AcademyTestDataSeeder::class,
        ]);
    }
}
