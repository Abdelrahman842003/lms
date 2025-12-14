<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Admin::firstOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
            ]
        );

        Admin::firstOrCreate(
            ['username' => 'johndoe'],
            [
                'name' => 'John Doe',
                'password' => Hash::make('password123'),
            ]
        );
    }
}
