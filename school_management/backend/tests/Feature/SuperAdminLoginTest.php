<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class SuperAdminLoginTest extends TestCase
{
    use \Illuminate\Foundation\Testing\RefreshDatabase;

    public function test_database_seeder_creates_super_admin_account(): void
    {
        Artisan::call('db:seed', ['--class' => \Database\Seeders\DatabaseSeeder::class]);

        $this->assertDatabaseHas('users', [
            'email' => 'admin@schoolmanagement.com',
            'role' => 'super_admin',
        ]);
    }
}
