<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClassManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_school_admin_can_create_and_list_classes_and_streams(): void
    {
        $school = School::create([
            'name' => 'Test School',
            'code' => 'TS-001',
            'location' => 'Nairobi',
            'level' => 'O-Level',
        ]);

        $admin = User::factory()->create([
            'role' => 'school_admin',
            'school_id' => $school->id,
        ]);

        $this->actingAs($admin, 'sanctum');

        $classResponse = $this->postJson('/api/school/classes', [
            'name' => 'Form One',
            'description' => 'Junior class',
        ]);

        $classResponse->assertStatus(201)
            ->assertJsonPath('class.name', 'Form One');

        $streamResponse = $this->postJson('/api/school/streams', [
            'class_id' => $classResponse->json('class.id'),
            'name' => 'Stream A',
            'description' => 'Science stream',
        ]);

        $streamResponse->assertStatus(201)
            ->assertJsonPath('stream.name', 'Stream A');

        $this->getJson('/api/school/classes')
            ->assertStatus(200)
            ->assertJsonFragment(['name' => 'Form One']);

        $this->getJson('/api/school/streams')
            ->assertStatus(200)
            ->assertJsonFragment(['name' => 'Stream A']);
    }

    public function test_o_level_school_gets_default_classes_and_blocks_extra_class_creation(): void
    {
        $school = School::create([
            'name' => 'O Level School',
            'code' => 'OLS-001',
            'location' => 'Kisumu',
            'level' => 'O-Level',
        ]);

        $admin = User::factory()->create([
            'role' => 'school_admin',
            'school_id' => $school->id,
        ]);

        $this->actingAs($admin, 'sanctum');

        $response = $this->getJson('/api/school/classes');

        $response->assertStatus(200)
            ->assertJsonFragment(['name' => 'Form One'])
            ->assertJsonFragment(['name' => 'Form Two'])
            ->assertJsonFragment(['name' => 'Form Three'])
            ->assertJsonFragment(['name' => 'Form Four']);

        $this->postJson('/api/school/classes', [
            'name' => 'Form Five',
            'description' => 'Not allowed',
        ])->assertStatus(422);
    }

    public function test_advanced_school_gets_default_classes_and_blocks_extra_class_creation(): void
    {
        $school = School::create([
            'name' => 'Advanced School',
            'code' => 'ADV-001',
            'location' => 'Mombasa',
            'level' => 'Advanced Level',
        ]);

        $admin = User::factory()->create([
            'role' => 'school_admin',
            'school_id' => $school->id,
        ]);

        $this->actingAs($admin, 'sanctum');

        $this->getJson('/api/school/classes')
            ->assertStatus(200)
            ->assertJsonFragment(['name' => 'Form Five'])
            ->assertJsonFragment(['name' => 'Form Six']);

        $this->postJson('/api/school/classes', [
            'name' => 'Form One',
            'description' => 'Not allowed',
        ])->assertStatus(422);
    }

    public function test_mixed_school_gets_all_default_classes_and_blocks_extra_class_creation(): void
    {
        $school = School::create([
            'name' => 'Mixed School',
            'code' => 'MIX-001',
            'location' => 'Nakuru',
            'level' => 'O-Level & Advanced Level',
        ]);

        $admin = User::factory()->create([
            'role' => 'school_admin',
            'school_id' => $school->id,
        ]);

        $this->actingAs($admin, 'sanctum');

        $this->getJson('/api/school/classes')
            ->assertStatus(200)
            ->assertJsonFragment(['name' => 'Form One'])
            ->assertJsonFragment(['name' => 'Form Two'])
            ->assertJsonFragment(['name' => 'Form Three'])
            ->assertJsonFragment(['name' => 'Form Four'])
            ->assertJsonFragment(['name' => 'Form Five'])
            ->assertJsonFragment(['name' => 'Form Six']);

        $this->postJson('/api/school/classes', [
            'name' => 'Form Seven',
            'description' => 'Not allowed',
        ])->assertStatus(422);
    }
}
