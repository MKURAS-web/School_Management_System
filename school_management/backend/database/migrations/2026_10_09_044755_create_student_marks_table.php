```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_marks', function (Blueprint $table) {
            $table->id();

            $table->foreignId('examination_id')
                ->constrained('examinations')
                ->cascadeOnDelete();

            $table->foreignId('student_id')
                ->constrained('students')
                ->cascadeOnDelete();

            $table->decimal('marks_obtained', 8, 2)->nullable();

            $table->text('remarks')->nullable();

            $table->foreignId('entered_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->unique(
                ['examination_id', 'student_id'],
                'student_marks_exam_student_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_marks');
    }
};
