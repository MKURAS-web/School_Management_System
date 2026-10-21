<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentBulkImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_school_admin_can_import_multiple_students_in_one_request(): void
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

        $response = $this->postJson('/api/school/students/import', [
            'students' => [
                [
                    'admission_number' => 'S-101',
                    'first_name' => 'Alice',
                    'middle_name' => 'Mwikali',
                    'last_name' => 'Njeri',
                    'gender' => 'Female',
                    'date_of_birth' => '2014-05-14',
                    'phone' => '0712345678',
                    'address' => 'Nairobi',
                    'class_name' => 'Form One',
                    'stream' => 'North',
                ],
                [
                    'admission_number' => 'S-102',
                    'first_name' => 'Brian',
                    'middle_name' => '',
                    'last_name' => 'Kiptoo',
                    'gender' => 'Male',
                    'date_of_birth' => '2013-08-12',
                    'phone' => '0712345679',
                    'address' => 'Kisumu',
                    'class_name' => 'Form One',
                    'stream' => 'North',
                ],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('count', 2)
            ->assertJsonFragment(['admission_number' => 'S-101'])
            ->assertJsonFragment(['admission_number' => 'S-102']);

        $this->assertDatabaseCount('students', 2);
    }

    public function test_super_admin_can_view_students_for_a_school(): void
    {
        $school = School::create([
            'name' => 'School One',
            'code' => 'SO-100',
            'location' => 'Kampala',
            'level' => 'O-Level',
        ]);

        $anotherSchool = School::create([
            'name' => 'School Two',
            'code' => 'ST-200',
            'location' => 'Mbarara',
            'level' => 'Advanced Level',
        ]);

        $schoolAdmin = User::factory()->create([
            'role' => 'school_admin',
            'school_id' => $school->id,
        ]);

        $superAdmin = User::factory()->create([
            'role' => 'super_admin',
            'school_id' => null,
        ]);

        $this->actingAs($schoolAdmin, 'sanctum');

        $this->postJson('/api/school/students/import', [
            'students' => [[
                'admission_number' => 'S-901',
                'first_name' => 'Alice',
                'middle_name' => '',
                'last_name' => 'Kagwa',
                'gender' => 'Female',
                'date_of_birth' => '2014-05-14',
                'phone' => '0712345678',
                'address' => 'Kampala',
                'class_name' => 'Form One',
                'stream' => 'North',
            ]],
        ])->assertStatus(200);

        $this->actingAs($schoolAdmin, 'sanctum');

        $this->postJson('/api/school/students/import', [
            'students' => [[
                'admission_number' => 'S-902',
                'first_name' => 'Bob',
                'middle_name' => '',
                'last_name' => 'Mugisha',
                'gender' => 'Male',
                'date_of_birth' => '2013-08-12',
                'phone' => '0712345679',
                'address' => 'Kigali',
                'class_name' => 'Form Five',
                'stream' => 'North',
            ]],
        ])->assertStatus(200);

        $this->actingAs($superAdmin, 'sanctum');

        $response = $this->getJson('/api/schools/' . $school->id . '/students');

        $response->assertStatus(200)
            ->assertJsonCount(2)
            ->assertJsonFragment(['admission_number' => 'S-901'])
            ->assertJsonFragment(['admission_number' => 'S-902']);

        $this->assertDatabaseHas('students', [
            'school_id' => $school->id,
            'admission_number' => 'S-901',
        ]);
    }
}
