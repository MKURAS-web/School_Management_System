<?php

namespace App\Http\Controllers;

use App\Models\School;
use App\Models\SchoolClass;
use Illuminate\Http\Request;

class SchoolClassController extends Controller
{
    private const O_LEVEL_DEFAULT_CLASSES = [
        'Form One',
        'Form Two',
        'Form Three',
        'Form Four',
    ];

    private const ADVANCED_LEVEL_DEFAULT_CLASSES = [
        'Form Five',
        'Form Six',
    ];

    private function getDefaultClassesForSchool(?School $school): array
    {
        if (!$school) {
            return [];
        }

        if ($school->level === 'O-Level') {
            return self::O_LEVEL_DEFAULT_CLASSES;
        }

        if ($school->level === 'Advanced Level') {
            return self::ADVANCED_LEVEL_DEFAULT_CLASSES;
        }

        if ($school->level === 'O-Level & Advanced Level') {
            return array_merge(self::O_LEVEL_DEFAULT_CLASSES, self::ADVANCED_LEVEL_DEFAULT_CLASSES);
        }

        return [];
    }

    private function ensureDefaultSchoolClasses(int $schoolId): void
    {
        $school = School::find($schoolId);
        $defaultClasses = $this->getDefaultClassesForSchool($school);

        foreach ($defaultClasses as $className) {
            SchoolClass::firstOrCreate(
                [
                    'school_id' => $schoolId,
                    'name' => $className,
                ],
                [
                    'description' => 'Automatically generated for this school level.',
                ]
            );
        }
    }

    private function validateSchoolClassName(Request $request, ?SchoolClass $existingClass = null): array
    {
        $schoolId = $request->user()->school_id;
        $school = School::find($schoolId);
        $allowedClasses = $this->getDefaultClassesForSchool($school);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        if (empty($allowedClasses)) {
            return $validated;
        }

        $requestedName = trim($validated['name']);

        if ($existingClass && $requestedName === $existingClass->name) {
            return $validated;
        }

        if (!in_array($requestedName, $allowedClasses, true)) {
            abort(response()->json([
                'message' => 'This school level is restricted to the default classes: ' . implode(', ', $allowedClasses) . '.',
            ], 422));
        }

        return $validated;
    }

    public function index(Request $request)
    {
        $schoolId = $request->user()->school_id;

        $this->ensureDefaultSchoolClasses($schoolId);

        $classes = SchoolClass::with('streams')
            ->where('school_id', $schoolId)
            ->orderBy('name')
            ->get();

        return response()->json($classes);
    }

    public function store(Request $request)
    {
        $schoolId = $request->user()->school_id;
        $school = School::find($schoolId);
        $defaultClasses = $this->getDefaultClassesForSchool($school);

        if (!empty($defaultClasses)) {
            $existingDefaultClasses = SchoolClass::where('school_id', $schoolId)
                ->whereIn('name', $defaultClasses)
                ->count();

            if ($existingDefaultClasses >= count($defaultClasses)) {
                abort(response()->json([
                    'message' => 'This school already has its default classes and cannot add another class.',
                ], 422));
            }
        }

        $validated = $this->validateSchoolClassName($request);
        $validated['school_id'] = $schoolId;

        $schoolClass = SchoolClass::create($validated);

        return response()->json([
            'message' => 'Class created successfully.',
            'class' => $schoolClass,
        ], 201);
    }

    public function show(Request $request, SchoolClass $schoolClass)
    {
        $schoolId = $request->user()->school_id;

        if ($schoolClass->school_id !== $schoolId) {
            return response()->json([
                'message' => 'You are not authorized to access this class.',
            ], 403);
        }

        return response()->json([
            'class' => $schoolClass->load('streams'),
        ]);
    }

    public function update(Request $request, SchoolClass $schoolClass)
    {
        $schoolId = $request->user()->school_id;

        if ($schoolClass->school_id !== $schoolId) {
            return response()->json([
                'message' => 'You are not authorized to update this class.',
            ], 403);
        }

        $validated = $this->validateSchoolClassName($request, $schoolClass);
        $schoolClass->update($validated);

        return response()->json([
            'message' => 'Class updated successfully.',
            'class' => $schoolClass,
        ]);
    }

    public function destroy(Request $request, SchoolClass $schoolClass)
    {
        $schoolId = $request->user()->school_id;

        if ($schoolClass->school_id !== $schoolId) {
            return response()->json([
                'message' => 'You are not authorized to delete this class.',
            ], 403);
        }

        $schoolClass->delete();

        return response()->json([
            'message' => 'Class deleted successfully.',
        ]);
    }
}
