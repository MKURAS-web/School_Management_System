<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Update examinations table
        |--------------------------------------------------------------------------
        */

        Schema::table('examinations', function (Blueprint $table) {
            // An examination will now belong to the school,
            // not necessarily to one class, subject or teacher.
            $table->foreignId('class_id')
                ->nullable()
                ->change();

            $table->foreignId('subject_id')
                ->nullable()
                ->change();

            $table->foreignId('teacher_id')
                ->nullable()
                ->change();

            // The school administrator who created the examination.
            $table->foreignId('created_by')
                ->nullable()
                ->after('school_id')
                ->constrained('users')
                ->nullOnDelete();

            // Optional submission deadline.
            $table->dateTime('submission_deadline')
                ->nullable();

            // Academic year, for example 2026.
            $table->string('academic_year', 20)
                ->nullable();
        });

        /*
        |--------------------------------------------------------------------------
        | Create examination_class_subjects table
        |--------------------------------------------------------------------------
        |
        | One examination can cover multiple classes and subjects.
        | Each class-subject assignment has its own maximum marks
        | and assigned teacher.
        |
        */

        Schema::create(
            'examination_class_subjects',
            function (Blueprint $table) {
                $table->id();

                $table->foreignId('examination_id')
                    ->constrained('examinations')
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

                $table->decimal('maximum_marks', 8, 2)
                    ->default(100);

                $table->timestamps();

                // Prevent assigning the same subject to the same
                // class twice in one examination.
                $table->unique(
                    ['examination_id', 'class_id', 'subject_id'],
                    'exam_class_subject_unique'
                );

                $table->index(
                    ['teacher_id', 'class_id', 'subject_id'],
                    'exam_teacher_class_subject_index'
                );
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('examination_class_subjects');

        Schema::table('examinations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('created_by');

            $table->dropColumn([
                'submission_deadline',
                'academic_year',
            ]);

            $table->foreignId('class_id')
                ->nullable(false)
                ->change();

            $table->foreignId('subject_id')
                ->nullable(false)
                ->change();

            $table->foreignId('teacher_id')
                ->nullable(false)
                ->change();
        });
    }
};