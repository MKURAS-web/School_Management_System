<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_marks', function (Blueprint $table) {
            // Remove the old restriction that allowed only one
            // mark per student for an entire examination.
            $table->dropUnique('student_marks_exam_student_unique');

            // Connect each mark to the teacher's subject submission.
            $table->foreignId('submission_id')
                ->nullable()
                ->after('examination_id')
                ->constrained('examination_submissions')
                ->cascadeOnDelete();

            // A student can have one mark per submission.
            $table->unique(
                ['submission_id', 'student_id'],
                'student_marks_submission_student_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('student_marks', function (Blueprint $table) {
            $table->dropUnique(
                'student_marks_submission_student_unique'
            );

            $table->dropConstrainedForeignId('submission_id');

            $table->unique(
                ['examination_id', 'student_id'],
                'student_marks_exam_student_unique'
            );
        });
    }
};