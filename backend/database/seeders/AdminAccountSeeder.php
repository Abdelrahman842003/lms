<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domains\Auth\Models\Admin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class AdminAccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = Admin::updateOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'is_admin' => true,
            ]
        );

        // Assign the Super Admin role from the admin guard
        $role = Role::where('name', 'Super Admin')->where('guard_name', 'admin')->first();
        if ($role) {
            $admin->assignRole($role);
        }
    }
}
