<?php

namespace App\Http\Controllers;

use App\Models\Examination;
use App\Models\ExaminationClassSubject;
use App\Models\ExaminationSubmission;
use App\Models\ExaminationReview;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminExaminationController extends Controller
{
    /**
     * Display examinations created by the logged-in school admin.
     */
    public function index(Request $request)
    {
        $admin = $request->user();

        if (!$admin->school_id) {
            return response()->json([
                'message' => 'Your account is not linked to a school.',
            ], 422);
        }

        $examinations = Examination::query()
            ->where('school_id', $admin->school_id)
            ->where('created_by', $admin->id)
            ->with([
                'creator:id,name',
                'classSubjects.schoolClass:id,name',
                'classSubjects.subject:id,name,code',
                'classSubjects.teacher:id,name,email',
                'classSubjects.submission.latestReview.reviewer:id,name',
            ])
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Examinations retrieved successfully.',
            'data' => $examinations,
        ]);
    }

    /**
     * Create an examination with multiple class-subject assignments.
     *
     * The teacher is detected automatically using existing class
     * and subject assignments.
     */
    public function store(Request $request)
    {
        $admin = $request->user();

        if (!$admin->school_id) {
            return response()->json([
                'message' => 'Your account is not linked to a school.',
            ], 422);
        }

        $validated = $request->validate([
            'title' => [
                'required',
                'string',
                'max:255',
            ],

            'exam_type' => [
                'required',
                Rule::in(['midterm', 'annual', 'other']),
            ],

            'exam_date' => [
                'required',
                'date',
            ],

            'academic_year' => [
                'nullable',
                'string',
                'max:20',
            ],

            'submission_deadline' => [
                'nullable',
                'date',
                'after:now',
            ],

            'description' => [
                'nullable',
                'string',
            ],

            'assignments' => [
                'required',
                'array',
                'min:1',
            ],

            'assignments.*.class_id' => [
                'required',
                'integer',
                'exists:school_classes,id',
            ],

            'assignments.*.subject_id' => [
                'required',
                'integer',
                'exists:subjects,id',
            ],

            'assignments.*.maximum_marks' => [
                'required',
                'numeric',
                'gt:0',
                'max:999999.99',
            ],
        ]);

        /*
         * Validate every class-subject assignment before creating
         * any examination records.
         */
        $seenAssignments = [];
        $resolvedAssignments = [];

        foreach ($validated['assignments'] as $index => $assignment) {
            $class = SchoolClass::query()
                ->where('school_id', $admin->school_id)
                ->find($assignment['class_id']);

            if (!$class) {
                throw ValidationException::withMessages([
                    "assignments.$index.class_id" =>
                        'The selected class does not belong to your school.',
                ]);
            }

            $subject = Subject::query()
                ->where('school_id', $admin->school_id)
                ->find($assignment['subject_id']);

            if (!$subject) {
                throw ValidationException::withMessages([
                    "assignments.$index.subject_id" =>
                        'The selected subject does not belong to your school.',
                ]);
            }

            $classHasSubject = $class->subjects()
                ->where('subjects.id', $subject->id)
                ->exists();

            if (!$classHasSubject) {
                throw ValidationException::withMessages([
                    "assignments.$index.subject_id" =>
                        'This subject is not assigned to the selected class.',
                ]);
            }

            /*
             * Find teachers assigned to both this class and subject.
             */
            $teachersForAssignment = User::query()
                ->where('school_id', $admin->school_id)
                ->where('role', 'teacher')
                ->whereHas('classes', function ($query) use ($class) {
                    $query->where('school_classes.id', $class->id);
                })
                ->whereHas('subjects', function ($query) use ($subject) {
                    $query->where('subjects.id', $subject->id);
                })
                ->get();

            if ($teachersForAssignment->isEmpty()) {
                throw ValidationException::withMessages([
                    "assignments.$index.subject_id" =>
                        'No teacher is assigned to both this class and subject. Assign the teacher first.',
                ]);
            }

            if ($teachersForAssignment->count() > 1) {
                throw ValidationException::withMessages([
                    "assignments.$index.subject_id" =>
                        'Multiple teachers are assigned to this class and subject. Please clarify the responsible teacher.',
                ]);
            }

            $pair = $class->id . '-' . $subject->id;

            if (isset($seenAssignments[$pair])) {
                throw ValidationException::withMessages([
                    "assignments.$index.subject_id" =>
                        'A class cannot have the same subject assigned twice in one examination.',
                ]);
            }

            $seenAssignments[$pair] = true;

            $resolvedAssignments[] = [
                'class_id' => $class->id,
                'subject_id' => $subject->id,
                'teacher_id' => $teachersForAssignment->first()->id,
                'maximum_marks' => $assignment['maximum_marks'],
            ];
        }

        /*
         * Create the examination and all assignments atomically.
         */
        $examination = DB::transaction(function () use (
            $validated,
            $admin,
            $resolvedAssignments
        ) {
            $examination = Examination::create([
                'school_id' => $admin->school_id,
                'created_by' => $admin->id,

                // Legacy fields retained for compatibility.
                'class_id' => null,
                'subject_id' => null,
                'teacher_id' => null,

                'title' => $validated['title'],
                'exam_type' => $validated['exam_type'],
                'exam_date' => $validated['exam_date'],

                'submission_deadline' =>
                    $validated['submission_deadline'] ?? null,

                'academic_year' =>
                    $validated['academic_year'] ?? null,

                'description' =>
                    $validated['description'] ?? null,

                'status' => 'draft',

                // Each assignment has its own maximum_marks.
                'total_marks' => 100,
            ]);

            foreach ($resolvedAssignments as $assignment) {
                ExaminationClassSubject::create([
                    'examination_id' => $examination->id,
                    'class_id' => $assignment['class_id'],
                    'subject_id' => $assignment['subject_id'],
                    'teacher_id' => $assignment['teacher_id'],
                    'maximum_marks' => $assignment['maximum_marks'],
                ]);
            }

            return $examination;
        });

        $examination->load([
            'creator:id,name',
            'classSubjects.schoolClass:id,name',
            'classSubjects.subject:id,name,code',
            'classSubjects.teacher:id,name,email',
        ]);

        return response()->json([
            'message' => 'Examination created successfully.',
            'data' => $examination,
        ], 201);
    }

    /**
     * List submissions for examinations created by this admin.
     */
    public function submissions(Request $request)
    {
        $admin = $request->user();

        if (!$admin->school_id) {
            return response()->json([
                'message' => 'Your account is not linked to a school.',
            ], 422);
        }

        $submissions = ExaminationSubmission::query()
            ->whereHas('classSubject.examination', function ($query) use ($admin) {
                $query->where('school_id', $admin->school_id)
                    ->where('created_by', $admin->id);
            })
            ->whereIn('status', [
                'submitted',
                'approved',
                'rejected',
            ])
            ->with([
                'classSubject.examination:id,school_id,created_by,title,exam_type,exam_date,academic_year',
                'classSubject.schoolClass:id,name',
                'classSubject.subject:id,name,code',
                'classSubject.teacher:id,name,email',
                'submittedBy:id,name',
                'latestReview.reviewer:id,name',
            ])
            ->withCount('marks')
            ->latest('submitted_at')
            ->get();

        return response()->json([
            'message' => 'Examination submissions retrieved successfully.',
            'data' => $submissions,
        ]);
    }

    /**
     * Review a submitted examination.
     *
     * decision: approved or rejected.
     * A reason is required for rejection.
     */
    public function reviewSubmission(
        Request $request,
        ExaminationSubmission $submission
    ) {
        $admin = $request->user();

        if (!$admin->school_id) {
            return response()->json([
                'message' => 'Your account is not linked to a school.',
            ], 422);
        }

        $validated = $request->validate([
            'decision' => [
                'required',
                Rule::in(['approved', 'rejected']),
            ],

            'reason' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ]);

        if (
            $validated['decision'] === 'rejected'
            && trim((string) ($validated['reason'] ?? '')) === ''
        ) {
            throw ValidationException::withMessages([
                'reason' => [
                    'A reason is required when rejecting a submission.',
                ],
            ]);
        }

        $submission->loadMissing('classSubject.examination');

        $examination = $submission->classSubject->examination;

        /*
         * This admin can only review examinations created by them
         * within their own school.
         */
        if (
            (int) $examination->school_id !== (int) $admin->school_id
            || (int) $examination->created_by !== (int) $admin->id
        ) {
            abort(
                403,
                'You are not authorized to review this submission.'
            );
        }

        if ($submission->status !== 'submitted') {
            return response()->json([
                'message' => 'Only submitted marks can be reviewed.',
            ], 422);
        }

        DB::transaction(function () use (
            $submission,
            $admin,
            $validated
        ) {
            $lockedSubmission = ExaminationSubmission::query()
                ->whereKey($submission->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedSubmission->status !== 'submitted') {
                throw ValidationException::withMessages([
                    'submission' => [
                        'This submission has already been reviewed.',
                    ],
                ]);
            }

            /*
             * Preserve every review decision in the history table.
             */
            ExaminationReview::create([
                'examination_submission_id' => $lockedSubmission->id,
                'reviewed_by' => $admin->id,
                'decision' => $validated['decision'],
                'reason' => $validated['reason'] ?? null,
                'reviewed_at' => now(),
            ]);

            $lockedSubmission->update([
                'status' => $validated['decision'],
            ]);
        });

        return response()->json([
            'message' => $validated['decision'] === 'approved'
                ? 'Marks approved successfully.'
                : 'Marks rejected. The teacher can correct and resubmit them.',

            'data' => $submission->fresh()->load([
                'latestReview.reviewer:id,name',
                'classSubject.schoolClass:id,name',
                'classSubject.subject:id,name,code',
                'classSubject.teacher:id,name,email',
            ]),
        ]);
    }
}
