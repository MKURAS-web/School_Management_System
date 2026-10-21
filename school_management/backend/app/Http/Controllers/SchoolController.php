<?php

namespace App\Http\Controllers;

use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class SchoolController extends Controller
{
    public function index()
    {
        $schools = School::latest()->get();

        return response()->json($schools);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:schools,code',
            'location' => 'nullable|string|max:255',
            'level' => 'required|in:O-Level,Advanced Level,O-Level & Advanced Level',
        ]);

        $school = School::create($validated);

        return response()->json([
            'message' => 'School added successfully.',
            'school' => $school,
        ], 201);
    }

    public function show(School $school)
    {
        return response()->json($school);
    }

    /**
     * Get the currently logged-in School Admin's school.
     */
    public function currentSchool(Request $request)
    {
        $schoolId = $request->user()->school_id;

        $school = School::find($schoolId);

        if (!$school) {
            return response()->json([
                'message' => 'School not found.',
            ], 404);
        }

        return response()->json($school);
    }

    public function update(Request $request, School $school)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:schools,code,' . $school->id,
            'location' => 'nullable|string|max:255',
            'level' => 'required|in:O-Level,Advanced Level,O-Level & Advanced Level',
        ]);

        $school->update($validated);

        return response()->json([
            'message' => 'School updated successfully.',
            'school' => $school,
        ]);
    }

    public function destroy(School $school)
    {
        $school->delete();

        return response()->json([
            'message' => 'School deleted successfully.',
        ]);
    }

    public function students(School $school)
    {
        $students = Student::where('school_id', $school->id)
            ->latest()
            ->get();

        return response()->json($students);
    }
}