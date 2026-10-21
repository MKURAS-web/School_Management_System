<?php

namespace App\Http\Controllers;

use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = $request->user()->school_id;

        $subjects = Subject::with(['classes' => function ($query) use ($schoolId) {
            $query->where('school_id', $schoolId)->orderBy('name');
        }, 'teachers' => function ($query) use ($schoolId) {
            $query->where('school_id', $schoolId)->orderBy('name');
        }])
            ->where('school_id', $schoolId)
            ->orderBy('name')
            ->get();

        return response()->json($subjects);
    }

    public function teachers(Request $request)
    {
        $schoolId = $request->user()->school_id;

        $teachers = User::where('school_id', $schoolId)
            ->where('role', 'teacher')
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return response()->json($teachers);
    }

    public function store(Request $request)
    {
        $schoolId = $request->user()->school_id;

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $validated['school_id'] = $schoolId;

        $subject = Subject::create($validated);

        return response()->json([
            'message' => 'Subject created successfully.',
            'subject' => $subject,
        ], 201);
    }

    public function show(Request $request, Subject $subject)
    {
        $schoolId = $request->user()->school_id;

        if ($subject->school_id !== $schoolId) {
            return response()->json([
                'message' => 'You are not authorized to access this subject.',
            ], 403);
        }

        return response()->json($subject->load(['classes', 'teachers']));
    }

    public function update(Request $request, Subject $subject)
    {
        $schoolId = $request->user()->school_id;

        if ($subject->school_id !== $schoolId) {
            return response()->json([
                'message' => 'You are not authorized to update this subject.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $subject->update($validated);

        return response()->json([
            'message' => 'Subject updated successfully.',
            'subject' => $subject,
        ]);
    }

    public function destroy(Request $request, Subject $subject)
    {
        $schoolId = $request->user()->school_id;

        if ($subject->school_id !== $schoolId) {
            return response()->json([
                'message' => 'You are not authorized to delete this subject.',
            ], 403);
        }

        $subject->classes()->detach();
        $subject->teachers()->detach();
        $subject->delete();

        return response()->json([
            'message' => 'Subject deleted successfully.',
        ]);
    }

    public function assignClass(Request $request)
    {
        $schoolId = $request->user()->school_id;

        $validated = $request->validate([
            'subject_id' => ['required', 'exists:subjects,id'],
            'class_id' => ['required', 'exists:school_classes,id'],
        ]);

        $subject = Subject::where('school_id', $schoolId)->find($validated['subject_id']);
        $class = SchoolClass::where('school_id', $schoolId)->find($validated['class_id']);

        if (!$subject || !$class) {
            return response()->json([
                'message' => 'The selected subject or class does not belong to your school.',
            ], 403);
        }

        $subject->classes()->syncWithoutDetaching([$class->id]);

        return response()->json([
            'message' => 'Subject assigned to class successfully.',
            'subject' => $subject->load('classes'),
        ]);
    }

    public function assignTeacher(Request $request)
    {
        $schoolId = $request->user()->school_id;

        $validated = $request->validate([
            'subject_id' => ['required', 'exists:subjects,id'],
            'teacher_id' => ['required', 'exists:users,id'],
            'class_id' => ['required', 'exists:school_classes,id'],
        ]);

        $subject = Subject::where('school_id', $schoolId)->find($validated['subject_id']);
        $teacher = User::where('school_id', $schoolId)
            ->where('role', 'teacher')
            ->find($validated['teacher_id']);
        $class = SchoolClass::where('school_id', $schoolId)->find($validated['class_id']);

        if (!$subject || !$teacher || !$class) {
            return response()->json([
                'message' => 'The selected subject, teacher, or class does not belong to your school.',
            ], 403);
        }

        $subject->classes()->syncWithoutDetaching([$class->id]);
        $subject->teachers()->syncWithoutDetaching([$teacher->id]);
        $teacher->classes()->syncWithoutDetaching([$class->id]);
        $teacher->subjects()->syncWithoutDetaching([$subject->id]);

        return response()->json([
            'message' => 'Subject assigned to teacher successfully for the selected class.',
            'subject' => $subject->load(['teachers', 'classes']),
            'teacher' => $teacher->load(['subjects', 'classes']),
        ]);
    }
}
