<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubjectManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_school_admin_can_create_subjects_and_assign_them_to_classes_and_teachers(): void
    {
        $school = School::create([
            'name' => 'Test School',
            'code' => 'TS-002',
            'location' => 'Nairobi',
            'level' => 'O-Level',
        ]);

        $admin = User::factory()->create([
            'role' => 'school_admin',
            'school_id' => $school->id,
        ]);

        $teacher = User::factory()->create([
            'role' => 'teacher',
            'school_id' => $school->id,
            'name' => 'Jane Teacher',
        ]);

        $this->actingAs($admin, 'sanctum');

        $classResponse = $this->postJson('/api/school/classes', [
            'name' => 'Form One',
            'description' => 'Junior class',
        ]);

        $subjectResponse = $this->postJson('/api/school/subjects', [
            'name' => 'Mathematics',
            'code' => 'MATH-101',
            'description' => 'Core maths',
        ]);

        $subjectResponse->assertStatus(201)
            ->assertJsonPath('subject.name', 'Mathematics')
            ->assertJsonPath('subject.code', 'MATH-101');

        $classAssignResponse = $this->postJson('/api/school/subjects/assign-class', [
            'subject_id' => $subjectResponse->json('subject.id'),
            'class_id' => $classResponse->json('class.id'),
        ]);

        $classAssignResponse->assertStatus(200)
            ->assertJsonPath('message', 'Subject assigned to class successfully.');

        $teacherAssignResponse = $this->postJson('/api/school/subjects/assign-teacher', [
            'subject_id' => $subjectResponse->json('subject.id'),
            'teacher_id' => $teacher->id,
            'class_id' => $classResponse->json('class.id'),
        ]);

        $teacherAssignResponse->assertStatus(200)
            ->assertJsonPath('message', 'Subject assigned to teacher successfully for the selected class.');

        $this->postJson('/api/school/subjects/assign-teacher', [
            'subject_id' => $subjectResponse->json('subject.id'),
            'teacher_id' => $teacher->id,
        ])->assertStatus(422);

        $this->getJson('/api/school/subjects')
            ->assertStatus(200)
            ->assertJsonFragment(['name' => 'Mathematics'])
            ->assertJsonFragment(['code' => 'MATH-101']);
    }
}
