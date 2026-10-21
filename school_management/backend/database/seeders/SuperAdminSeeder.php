<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Create the Super Admin account.
     */
    public function run(): void
    {
        User::updateOrCreate(
            [
                'email' => 'admin@schoolmanagement.com',
            ],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('Admin@12345'),
                'role' => 'super_admin',
                'school_id' => null,
            ]
        );
    }
}