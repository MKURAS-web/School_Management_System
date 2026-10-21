<?php

namespace Tests\Unit;

use App\Models\Student;
use PHPUnit\Framework\TestCase;

class StudentModelTest extends TestCase
{
    public function test_student_model_allows_class_name_to_be_mass_assigned(): void
    {
        $fillable = (new Student())->getFillable();

        $this->assertContains('class_name', $fillable);
    }
}
