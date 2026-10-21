<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('examination_submissions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('examination_class_subject_id')
                ->constrained('examination_class_subjects')
                ->cascadeOnDelete();

            $table->foreignId('submitted_by')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->enum('status', [
                'draft',
                'submitted',
                'approved',
                'rejected',
            ])->default('draft');

            $table->dateTime('submitted_at')->nullable();

            $table->timestamps();

            // One current submission record per class-subject assignment.
            $table->unique(
                'examination_class_subject_id',
                'exam_submission_assignment_unique'
            );

            $table->index(
                ['submitted_by', 'status'],
                'exam_submission_teacher_status_index'
            );
        });

        Schema::create('examination_reviews', function (Blueprint $table) {
            $table->id();

            $table->foreignId('examination_submission_id')
                ->constrained('examination_submissions')
                ->cascadeOnDelete();

            $table->foreignId('reviewed_by')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->enum('decision', [
                'approved',
                'rejected',
            ]);

            $table->text('reason')->nullable();

            $table->dateTime('reviewed_at');

            $table->timestamps();

            $table->index(
                ['examination_submission_id', 'reviewed_at'],
                'exam_review_submission_date_index'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('examination_reviews');

        Schema::dropIfExists('examination_submissions');
    }
};