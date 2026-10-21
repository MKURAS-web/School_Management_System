```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('examinations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('school_id')
                ->constrained('schools')
                ->cascadeOnDelete();

            $table->foreignId('class_id')
                ->constrained('school_classes')
                ->cascadeOnDelete();

            $table->foreignId('subject_id')
                ->constrained('subjects')
                ->cascadeOnDelete();

            $table->foreignId('teacher_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('title');
            $table->enum('exam_type', [
                'quiz',
                'test',
                'midterm',
                'terminal',
                'annual',
                'mock',
                'other',
            ])->default('test');

            $table->date('exam_date');
            $table->decimal('total_marks', 8, 2)->default(100);
            $table->text('description')->nullable();

            $table->enum('status', [
                'draft',
                'published',
                'completed',
            ])->default('draft');

            $table->timestamps();

            $table->index(
                ['school_id', 'class_id', 'subject_id'],
                'examinations_class_subject_index'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('examinations');
    }
};
