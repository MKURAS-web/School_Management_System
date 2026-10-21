<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SchoolAdminManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_change_their_own_password(): void
    {
        $user = User::factory()->create([
            'role' => 'school_admin',
            'password' => Hash::make('old-password-123'),
        ]);

        $this->actingAs($user, 'sanctum');

        $response = $this->putJson('/api/user/password', [
            'current_password' => 'old-password-123',
            'password' => 'new-password-456',
            'password_confirmation' => 'new-password-456',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Password updated successfully.');

        $user->refresh();
        $this->assertTrue(Hash::check('new-password-456', $user->password));
    }

    public function test_creating_a_school_does_not_create_a_school_admin_automatically(): void
    {
        $superAdmin = User::factory()->create([
            'role' => 'super_admin',
        ]);

        $this->actingAs($superAdmin, 'sanctum');

        $response = $this->postJson('/api/schools', [
            'name' => 'New School',
            'code' => 'NS-101',
            'location' => 'Kisumu',
            'level' => 'O-Level',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('school.name', 'New School');

        $this->assertDatabaseCount('schools', 1);
        $this->assertDatabaseCount('users', 1);
    }

    public function test_super_admin_cannot_create_a_second_school_admin_for_the_same_school(): void
    {
        $superAdmin = User::factory()->create([
            'role' => 'super_admin',
        ]);

        $school = School::create([
            'name' => 'Test School',
            'code' => 'TS-001',
            'location' => 'Nairobi',
            'level' => 'O-Level',
        ]);

        User::factory()->create([
            'name' => 'First Admin',
            'email' => 'first-admin@school.test',
            'role' => 'school_admin',
            'school_id' => $school->id,
        ]);

        $this->actingAs($superAdmin, 'sanctum');

        $response = $this->postJson('/api/school-admins', [
            'name' => 'Second Admin',
            'email' => 'second-admin@school.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'school_id' => $school->id,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['school_id']);

        $this->assertDatabaseCount('users', 2);
    }
}
