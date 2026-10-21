<?php

namespace App\Http\Controllers;

use App\Models\Examination;
use App\Models\ExaminationClassSubject;
use App\Models\ExaminationSubmission;
use App\Models\ExaminationReview;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentMark;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ExaminationController extends Controller
{
    /**
     * List examination assignments belonging to the logged-in teacher.
     */
    public function index(Request $request)
    {
        $teacher = $request->user();

        $assignments = ExaminationClassSubject::query()
            ->where('teacher_id', $teacher->id)
            ->whereHas('examination', function ($query) use ($teacher) {
                $query->where('school_id', $teacher->school_id)
                    ->whereNotNull('created_by');
            })
            ->with([
                'examination:id,school_id,created_by,title,exam_type,exam_date,submission_deadline,academic_year,description,status',
                'schoolClass:id,name',
                'subject:id,name,code',
                'submission.latestReview.reviewer:id,name',
            ])
            ->latest('id')
            ->get();

        return response()->json([
            'message' => 'Examination assignments retrieved successfully.',
            'data' => $assignments,
        ]);
    }

    /**
     * Display students and existing marks for a teacher's assignment.
     */
    public function students(
        Request $request,
        ExaminationClassSubject $assignment
    ) {
        $teacher = $request->user();

        $this->authorizeAssignment($teacher, $assignment);

        $class = $assignment->schoolClass;

        $students = Student::query()
            ->where('school_id', $teacher->school_id)
            ->whereRaw(
                'LOWER(TRIM(class_name)) = ?',
                [strtolower(trim($class->name))]
            )
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();

        $submission = ExaminationSubmission::firstOrCreate(
            [
                'examination_class_subject_id' => $assignment->id,
            ],
            [
                'submitted_by' => $teacher->id,
                'status' => 'draft',
            ]
        );

        $marks = $submission->marks()
            ->get()
            ->keyBy('student_id');

        $studentData = $students->map(function ($student) use ($marks) {
            $mark = $marks->get($student->id);

            return [
                'id' => $student->id,
                'first_name' => $student->first_name,
                'middle_name' => $student->middle_name,
                'last_name' => $student->last_name,
                'admission_number' => $student->admission_number,
                'stream' => $student->stream,
                'marks_obtained' => $mark?->marks_obtained,
                'remarks' => $mark?->remarks,
            ];
        })->values();

        return response()->json([
            'message' => 'Assignment students retrieved successfully.',
            'assignment' => $assignment->load([
                'examination',
                'schoolClass:id,name',
                'subject:id,name,code',
            ]),
            'submission' => $submission->load('latestReview'),
            'students' => $studentData,
        ]);
    }

    /**
     * Save marks as a draft.
     *
     * Submitted marks can only be edited again after rejection.
     */
    public function saveMarks(
        Request $request,
        ExaminationClassSubject $assignment
    ) {
        $teacher = $request->user();

        $this->authorizeAssignment($teacher, $assignment);

        $validated = $request->validate([
            'students' => ['required', 'array', 'min:1'],
            'students.*.student_id' => [
                'required',
                'integer',
                'distinct',
                'exists:students,id',
            ],
            'students.*.marks_obtained' => [
                'nullable',
                'numeric',
                'min:0',
            ],
            'students.*.remarks' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ]);

        $maximumMarks = (float) $assignment->maximum_marks;

        foreach ($validated['students'] as $studentData) {
            if (
                $studentData['marks_obtained'] !== null
                && (float) $studentData['marks_obtained'] > $maximumMarks
            ) {
                throw ValidationException::withMessages([
                    'students' => [
                        "A student's marks cannot exceed {$maximumMarks}.",
                    ],
                ]);
            }
        }

        $class = $assignment->schoolClass;

        $studentIds = collect($validated['students'])
            ->pluck('student_id')
            ->all();

        $validStudentIds = Student::query()
            ->where('school_id', $teacher->school_id)
            ->whereRaw(
                'LOWER(TRIM(class_name)) = ?',
                [strtolower(trim($class->name))]
            )
            ->whereIn('id', $studentIds)
            ->pluck('id')
            ->all();

        if (count($validStudentIds) !== count(array_unique($studentIds))) {
            throw ValidationException::withMessages([
                'students' => [
                    'One or more students do not belong to this class.',
                ],
            ]);
        }

        DB::transaction(function () use (
            $assignment,
            $teacher,
            $validated
        ) {
            $submission = ExaminationSubmission::query()
                ->where('examination_class_subject_id', $assignment->id)
                ->lockForUpdate()
                ->first();

            if (!$submission) {
                $submission = ExaminationSubmission::create([
                    'examination_class_subject_id' => $assignment->id,
                    'submitted_by' => $teacher->id,
                    'status' => 'draft',
                ]);
            }

            if (!in_array($submission->status, ['draft', 'rejected'], true)) {
                throw ValidationException::withMessages([
                    'submission' => [
                        'Only draft or rejected submissions can be edited.',
                    ],
                ]);
            }

            if ($submission->status === 'rejected') {
                $submission->update([
                    'status' => 'draft',
                    'submitted_at' => null,
                ]);
            }

            foreach ($validated['students'] as $studentData) {
                StudentMark::updateOrCreate(
                    [
                        'submission_id' => $submission->id,
                        'student_id' => $studentData['student_id'],
                    ],
                    [
                        'examination_id' => $assignment->examination_id,
                        'marks_obtained' => $studentData['marks_obtained'],
                        'remarks' => $studentData['remarks'] ?? null,
                        'entered_by' => $teacher->id,
                    ]
                );
            }
        });

        return response()->json([
            'message' => 'Marks saved as draft successfully.',
        ]);
    }

    /**
     * Submit completed marks to the school admin for review.
     */
    public function submitMarks(
        Request $request,
        ExaminationClassSubject $assignment
    ) {
        $teacher = $request->user();

        $this->authorizeAssignment($teacher, $assignment);

        $submission = ExaminationSubmission::query()
            ->where('examination_class_subject_id', $assignment->id)
            ->first();

        if (!$submission) {
            return response()->json([
                'message' => 'Save marks as a draft before submitting.',
            ], 422);
        }

        if (!in_array($submission->status, ['draft', 'rejected'], true)) {
            return response()->json([
                'message' => 'This submission has already been submitted.',
            ], 422);
        }

        $class = $assignment->schoolClass;

        $expectedStudentCount = Student::query()
            ->where('school_id', $teacher->school_id)
            ->whereRaw(
                'LOWER(TRIM(class_name)) = ?',
                [strtolower(trim($class->name))]
            )
            ->count();

        $marks = $submission->marks()->get();

        if (
            $marks->count() !== $expectedStudentCount
            || $marks->contains(fn ($mark) => $mark->marks_obtained === null)
        ) {
            return response()->json([
                'message' => 'Enter marks for every student before submitting.',
            ], 422);
        }

        DB::transaction(function () use ($submission, $teacher) {
            $submission->update([
                'submitted_by' => $teacher->id,
                'status' => 'submitted',
                'submitted_at' => now(),
            ]);
        });

        return response()->json([
            'message' => 'Marks submitted to the school admin successfully.',
            'submission' => $submission->fresh(),
        ]);
    }

    /**
     * Ensure the logged-in teacher owns this assignment.
     */
    private function authorizeAssignment($teacher, ExaminationClassSubject $assignment): void
    {
        $assignment->loadMissing('examination');

        abort_if(
            (int) $assignment->teacher_id !== (int) $teacher->id
            || (int) $assignment->examination->school_id !== (int) $teacher->school_id,
            403,
            'You are not authorized to access this examination assignment.'
        );
    }
}