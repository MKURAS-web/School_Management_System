<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class SchoolAdminController extends Controller
{
    /**
     * Create a School Admin.
     *
     * Only Super Admin should be allowed
     * to access this endpoint.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'email',
                'max:255',
                'unique:users,email',
            ],

            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
            ],

            'school_id' => [
                'required',
                'integer',
                'exists:schools,id',
                function ($attribute, $value, $fail) {
                    $hasAdmin = User::where('role', 'school_admin')
                        ->where('school_id', $value)
                        ->exists();

                    if ($hasAdmin) {
                        $fail('This school already has a school admin.');
                    }
                },
            ],
        ]);

        // Make sure the selected school exists
        $school = School::findOrFail(
            $validated['school_id']
        );

        // Create School Admin
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make(
                $validated['password']
            ),
            'role' => 'school_admin',
            'school_id' => $school->id,
        ]);

        return response()->json([
            'message' => 'School Admin created successfully.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'school_id' => $user->school_id,
                'school' => $school,
            ],
        ], 201);
    }

    /**
     * List School Admins.
     */
    public function index()
    {
        $admins = User::where(
            'role',
            'school_admin'
        )
            ->with('school')
            ->latest()
            ->get();

        return response()->json($admins);
    }

    /**
     * Show a School Admin.
     */
    public function show(User $user)
    {
        if ($user->role !== 'school_admin') {
            return response()->json(['message' => 'User is not a school admin.'], 404);
        }

        $user->load('school');

        return response()->json($user);
    }

    /**
     * Update a School Admin.
     */
    public function update(Request $request, User $user)
    {
        if ($user->role !== 'school_admin') {
            return response()->json(['message' => 'User is not a school admin.'], 404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'school_id' => [
                'required',
                'integer',
                'exists:schools,id',
                function ($attribute, $value, $fail) use ($user) {
                    $anotherAdminExists = User::where('role', 'school_admin')
                        ->where('school_id', $value)
                        ->where('id', '!=', $user->id)
                        ->exists();

                    if ($anotherAdminExists) {
                        $fail('This school already has a school admin.');
                    }
                },
            ],
        ]);

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->school_id = $validated['school_id'];

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        $user->load('school');

        return response()->json([
            'message' => 'School Admin updated successfully.',
            'user' => $user,
        ]);
    }

    /**
     * Delete a School Admin.
     */
    public function destroy(User $user)
    {
        if ($user->role !== 'school_admin') {
            return response()->json(['message' => 'User is not a school admin.'], 404);
        }

        $user->delete();

        return response()->json(['message' => 'School Admin deleted.']);
    }
}