<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Admin;
use Illuminate\Support\Facades\Hash;

class OnlyAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Create Roles and Permissions
        $this->call(RolesAndPermissionsSeeder::class);

        // 2. Create Admin User
        $admin = Admin::firstOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
            ]
        );

        // 3. Assign Super Admin Role
        // Ensure the role exists (it should be created by RolesAndPermissionsSeeder)
        if ($admin) {
            $admin->assignRole('Super Admin');
        }
    }
}
