<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class TeacherProfileController extends Controller
{
    /**
     * Get logged-in teacher profile.
     */
    public function show(Request $request)
    {
        $teacher = $request->user();

        return response()->json([
            'message' => 'Teacher profile retrieved successfully.',
            'teacher' => [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'email' => $teacher->email,
                'phone' => $teacher->phone,
                'designation' => $teacher->designation,
                'responsibility' => $teacher->responsibility,
                'gender' => $teacher->gender,
                'date_of_birth' => $teacher->date_of_birth,
                'status' => $teacher->status,
                'role' => $teacher->role,

                'subjects' => $teacher->subjects,
                'classes' => $teacher->classes,
            ],
        ]);
    }

    /**
     * Update logged-in teacher profile.
     */
    public function update(Request $request)
    {
        $teacher = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $teacher->id,
            'phone' => 'nullable|string|max:30',
        ]);

        $teacher->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'teacher' => [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'email' => $teacher->email,
                'phone' => $teacher->phone,
                'designation' => $teacher->designation,
                'responsibility' => $teacher->responsibility,
                'gender' => $teacher->gender,
                'date_of_birth' => $teacher->date_of_birth,
                'status' => $teacher->status,
                'role' => $teacher->role,

                'subjects' => $teacher->subjects,
                'classes' => $teacher->classes,
            ],
        ]);
    }
}