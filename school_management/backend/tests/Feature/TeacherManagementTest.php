<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeacherManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_school_admin_can_manage_teachers_and_assign_them_to_classes_and_subjects(): void
    {
        $school = School::create([
            'name' => 'Test School',
            'code' => 'TS-003',
            'location' => 'Nairobi',
            'level' => 'O-Level',
        ]);

        $admin = User::factory()->create([
            'role' => 'school_admin',
            'school_id' => $school->id,
        ]);

        $this->actingAs($admin, 'sanctum');

        $classResponse = $this->postJson('/api/school/classes', [
            'name' => 'Form Two',
            'description' => 'Senior class',
        ]);

        $subjectResponse = $this->postJson('/api/school/subjects', [
            'name' => 'Biology',
            'code' => 'BIO-201',
            'description' => 'Life science',
        ]);

        $teacherResponse = $this->postJson('/api/school/teachers', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => 'Password123',
            'role' => 'teacher',
            'phone' => '0723456789',
            'designation' => 'Mathematics Teacher',
            'responsibility' => 'Head of Department',
            'subject_ids' => [$subjectResponse->json('subject.id')],
            'class_ids' => [$classResponse->json('class.id')],
        ]);

        $teacherResponse->assertStatus(201)
            ->assertJsonPath('teacher.name', 'Jane Doe')
            ->assertJsonPath('teacher.role', 'teacher');

        $this->getJson('/api/school/teachers')
            ->assertStatus(200)
            ->assertJsonFragment(['name' => 'Jane Doe']);

        $this->postJson('/api/school/teachers/assign-subjects', [
            'teacher_id' => $teacherResponse->json('teacher.id'),
            'subject_ids' => [$subjectResponse->json('subject.id')],
        ])->assertStatus(200);

        $this->postJson('/api/school/teachers/assign-classes', [
            'teacher_id' => $teacherResponse->json('teacher.id'),
            'class_ids' => [$classResponse->json('class.id')],
        ])->assertStatus(200);

        $teacherUpdate = $this->putJson('/api/school/teachers/' . $teacherResponse->json('teacher.id'), [
            'name' => 'Jane Doe Updated',
            'email' => 'jane.updated@example.com',
            'password' => '',
            'role' => 'teacher',
            'phone' => '0789123456',
            'designation' => 'Science Teacher',
            'responsibility' => 'Class Teacher',
            'status' => 'Active',
        ]);

        $teacherUpdate->assertStatus(200)
            ->assertJsonPath('teacher.name', 'Jane Doe Updated');
    }

    public function test_teacher_can_fetch_dashboard_data_for_their_assigned_classes(): void
    {
        $school = School::create([
            'name' => 'Teacher Dashboard School',
            'code' => 'TDS-001',
            'location' => 'Kampala',
            'level' => 'O-Level',
        ]);

        $admin = User::factory()->create([
            'role' => 'school_admin',
            'school_id' => $school->id,
        ]);

        $this->actingAs($admin, 'sanctum');

        $classResponse = $this->postJson('/api/school/classes', [
            'name' => 'Form Two',
            'description' => 'Senior class',
        ]);

        $subjectResponse = $this->postJson('/api/school/subjects', [
            'name' => 'Biology',
            'code' => 'BIO-201',
            'description' => 'Life science',
        ]);

        $teacher = User::factory()->create([
            'name' => 'Jane Teacher',
            'email' => 'teacher.dashboard@example.com',
            'role' => 'teacher',
            'school_id' => $school->id,
            'designation' => 'Biology Teacher',
        ]);

        $teacher->classes()->attach($classResponse->json('class.id'));
        $teacher->subjects()->attach($subjectResponse->json('subject.id'));

        Student::create([
            'school_id' => $school->id,
            'admission_number' => 'ADM-1001',
            'first_name' => 'Alice',
            'middle_name' => '',
            'last_name' => 'Mugisha',
            'gender' => 'Female',
            'class_name' => 'Form Two',
            'phone' => '0700000001',
        ]);

        $this->actingAs($teacher, 'sanctum');

        $this->getJson('/api/school/teacher/dashboard')
            ->assertStatus(200)
            ->assertJsonPath('teacher.name', 'Jane Teacher')
            ->assertJsonPath('teacher.classes.0.name', 'Form Two')
            ->assertJsonFragment(['first_name' => 'Alice']);

        $this->getJson('/api/school/teachers/' . $teacher->id)
            ->assertStatus(200)
            ->assertJsonPath('name', 'Jane Teacher');

        $this->putJson('/api/school/teachers/' . $teacher->id, [
            'phone' => '0701234567',
            'designation' => 'Senior Biology Teacher',
        ])->assertStatus(200)
            ->assertJsonPath('teacher.phone', '0701234567');
    }
}
