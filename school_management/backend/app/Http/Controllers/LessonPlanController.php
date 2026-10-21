<?php

namespace App\Http\Controllers;

use App\Models\LessonPlan;
use App\Models\SchoolClass;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LessonPlanController extends Controller
{
    /**
     * List lesson plans for the logged-in teacher.
     */
    public function index(Request $request)
    {
        $teacher = $request->user();

        $query = LessonPlan::with(['subject', 'schoolClass'])
            ->where('teacher_id', $teacher->id)
            ->orderBy('lesson_date', 'desc')
            ->orderBy('created_at', 'desc');

        if ($request->has('subject_id') && $request->subject_id) {
            $query->where('subject_id', $request->subject_id);
        }

        if ($request->has('class_id') && $request->class_id) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $lessonPlans = $query->paginate(15);

        return response()->json([
            'message' => 'Lesson plans retrieved successfully.',
            'data' => $lessonPlans->items(),
            'total' => $lessonPlans->total(),
        ]);
    }

    /**
     * Store a new lesson plan.
     */
    public function store(Request $request)
    {
        $teacher = $request->user();

        $validated = $request->validate([
            'topic' => ['required', 'string', 'max:255'],
            'subject_id' => ['nullable', 'integer', 'exists:subjects,id'],
            'class_id' => ['nullable', 'integer', 'exists:school_classes,id'],
            'lesson_date' => ['required', 'date'],
            'duration' => ['nullable', 'string', 'max:50'],
            'status' => ['required', 'in:draft,prepared,completed'],
            'notes' => ['nullable', 'string'],
        ]);

        $lessonPlan = LessonPlan::create([
            'teacher_id' => $teacher->id,
            ...$validated,
        ]);

        return response()->json([
            'message' => 'Lesson plan created successfully.',
            'data' => $lessonPlan->load(['subject', 'schoolClass']),
        ], 201);
    }

    /**
     * Display a specific lesson plan.
     */
    public function show(Request $request, LessonPlan $lessonPlan)
    {
        $teacher = $request->user();

        if ($lessonPlan->teacher_id !== $teacher->id) {
            return response()->json([
                'message' => 'You are not authorized to view this lesson plan.',
            ], 403);
        }

        return response()->json([
            'message' => 'Lesson plan retrieved successfully.',
            'data' => $lessonPlan->load(['subject', 'schoolClass']),
        ]);
    }

    /**
     * Update a lesson plan.
     */
    public function update(Request $request, LessonPlan $lessonPlan)
    {
        $teacher = $request->user();

        if ($lessonPlan->teacher_id !== $teacher->id) {
            return response()->json([
                'message' => 'You are not authorized to update this lesson plan.',
            ], 403);
        }

        $validated = $request->validate([
            'topic' => ['sometimes', 'required', 'string', 'max:255'],
            'subject_id' => ['sometimes', 'nullable', 'integer', 'exists:subjects,id'],
            'class_id' => ['sometimes', 'nullable', 'integer', 'exists:school_classes,id'],
            'lesson_date' => ['sometimes', 'required', 'date'],
            'duration' => ['sometimes', 'nullable', 'string', 'max:50'],
            'status' => ['sometimes', 'required', 'in:draft,prepared,completed'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ]);

        $lessonPlan->update($validated);

        return response()->json([
            'message' => 'Lesson plan updated successfully.',
            'data' => $lessonPlan->fresh()->load(['subject', 'schoolClass']),
        ]);
    }

    /**
     * Delete a lesson plan.
     */
    public function destroy(Request $request, LessonPlan $lessonPlan)
    {
        $teacher = $request->user();

        if ($lessonPlan->teacher_id !== $teacher->id) {
            return response()->json([
                'message' => 'You are not authorized to delete this lesson plan.',
            ], 403);
        }

        $lessonPlan->delete();

        return response()->json([
            'message' => 'Lesson plan deleted successfully.',
        ]);
    }
}
