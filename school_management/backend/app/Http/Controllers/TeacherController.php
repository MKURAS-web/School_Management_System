<?php

namespace App\Http\Controllers;

use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class TeacherController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | TEACHERS / STAFF INDEX
    |--------------------------------------------------------------------------
    */

    public function index(Request $request)
    {
        $schoolId = $request->user()->school_id;

        $teachers = User::with(['subjects', 'classes'])
            ->where('school_id', $schoolId)
            ->whereIn('role', ['teacher', 'staff'])
            ->orderBy('name')
            ->get();

        return response()->json($teachers);
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE TEACHER / STAFF
    |--------------------------------------------------------------------------
    */

    public function store(Request $request)
    {
        $schoolId = $request->user()->school_id;

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'in:teacher,staff'],
            'phone' => ['nullable', 'string', 'max:20'],
            'designation' => ['nullable', 'string', 'max:255'],
            'responsibility' => ['nullable', 'string', 'max:255'],
            'gender' => ['nullable', 'in:Male,Female,Other'],
            'date_of_birth' => ['nullable', 'date'],
            'status' => ['nullable', 'in:Active,On Leave,Inactive'],

            'subject_ids' => ['nullable', 'array'],
            'subject_ids.*' => ['integer', 'exists:subjects,id'],

            'class_ids' => ['nullable', 'array'],
            'class_ids.*' => ['integer', 'exists:school_classes,id'],
        ]);

        $validated['school_id'] = $schoolId;
        $validated['password'] = Hash::make($validated['password']);
        $validated['status'] = $validated['status'] ?? 'Active';

        $teacher = User::create($validated);

        $subjectIds = $validated['subject_ids'] ?? [];
        $classIds = $validated['class_ids'] ?? [];

        $validSubjects = Subject::where('school_id', $schoolId)
            ->whereIn('id', $subjectIds)
            ->pluck('id')
            ->all();

        $validClasses = SchoolClass::where('school_id', $schoolId)
            ->whereIn('id', $classIds)
            ->pluck('id')
            ->all();

        $teacher->subjects()->sync($validSubjects);
        $teacher->classes()->sync($validClasses);

        return response()->json([
            'message' => 'Teacher created successfully.',
            'teacher' => $teacher->load(['subjects', 'classes']),
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | TEACHER DASHBOARD
    |--------------------------------------------------------------------------
    */

    public function dashboard(Request $request)
    {
        $actor = $request->user();
        $schoolId = $actor->school_id;

        $teacher = User::with(['subjects', 'classes'])
            ->where('school_id', $schoolId)
            ->whereIn('role', ['teacher', 'staff'])
            ->findOrFail($actor->id);

        $classes = $teacher->classes()
            ->orderBy('name')
            ->get();

        $schoolStudents = Student::where('school_id', $schoolId)
            ->select([
                'id',
                'first_name',
                'middle_name',
                'last_name',
                'admission_number',
                'gender',
                'phone',
                'class_name',
            ])
            ->get();

        $studentsByClass = [];

        foreach ($classes as $class) {
            $className = strtolower(
                trim((string) $class->name)
            );

            $studentsByClass[(string) $class->id] = $schoolStudents
                ->filter(function ($student) use ($className) {

                    $studentClassName = strtolower(
                        trim((string) ($student->class_name ?? ''))
                    );

                    return $studentClassName === $className
                        || str_contains(
                            $studentClassName,
                            $className
                        );
                })
                ->values()
                ->all();
        }

        return response()->json([
            'teacher' => $teacher,
            'classes' => $classes,
            'subjects' => $teacher->subjects,
            'studentsByClass' => $studentsByClass,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW TEACHER
    |--------------------------------------------------------------------------
    */

    public function show(Request $request, User $user)
    {
        $schoolId = $request->user()->school_id;
        $actor = $request->user();

        $isSchoolAdmin = $actor->role === 'school_admin';
        $isOwnProfile = $actor->id === $user->id;

        if (
            $user->school_id !== $schoolId ||
            !in_array($user->role, ['teacher', 'staff'], true)
        ) {
            return response()->json([
                'message' => 'You are not authorized to view this teacher.',
            ], 403);
        }

        if (!$isSchoolAdmin && !$isOwnProfile) {
            return response()->json([
                'message' => 'You are not authorized to view this teacher.',
            ], 403);
        }

        return response()->json(
            $user->load(['subjects', 'classes'])
        );
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE TEACHER
    |--------------------------------------------------------------------------
    */

    public function update(Request $request, User $user)
    {
        $schoolId = $request->user()->school_id;
        $actor = $request->user();

        $isSchoolAdmin = $actor->role === 'school_admin';
        $isOwnProfile = $actor->id === $user->id;

        if (
            $user->school_id !== $schoolId ||
            !in_array($user->role, ['teacher', 'staff'], true)
        ) {
            return response()->json([
                'message' => 'You are not authorized to update this teacher.',
            ], 403);
        }

        if (!$isSchoolAdmin && !$isOwnProfile) {
            return response()->json([
                'message' => 'You are not authorized to update this teacher.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                'unique:users,email,' . $user->id,
            ],

            'password' => [
                'sometimes',
                'nullable',
                'string',
                'min:8',
            ],

            'role' => [
                'sometimes',
                'required',
                'in:teacher,staff',
            ],

            'phone' => [
                'nullable',
                'string',
                'max:20',
            ],

            'designation' => [
                'nullable',
                'string',
                'max:255',
            ],

            'responsibility' => [
                'nullable',
                'string',
                'max:255',
            ],

            'gender' => [
                'nullable',
                'in:Male,Female,Other',
            ],

            'date_of_birth' => [
                'nullable',
                'date',
            ],

            'status' => [
                'nullable',
                'in:Active,On Leave,Inactive',
            ],

            'subject_ids' => [
                'nullable',
                'array',
            ],

            'subject_ids.*' => [
                'integer',
                'exists:subjects,id',
            ],

            'class_ids' => [
                'nullable',
                'array',
            ],

            'class_ids.*' => [
                'integer',
                'exists:school_classes,id',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | PASSWORD
        |--------------------------------------------------------------------------
        */

        if (
            array_key_exists('password', $validated) &&
            (
                is_null($validated['password']) ||
                trim((string) $validated['password']) === ''
            )
        ) {
            unset($validated['password']);
        }

        if (
            isset($validated['password']) &&
            $validated['password'] !== null &&
            $validated['password'] !== ''
        ) {
            $validated['password'] = Hash::make(
                $validated['password']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | UPDATE USER
        |--------------------------------------------------------------------------
        */

        $user->update($validated);

        /*
        |--------------------------------------------------------------------------
        | UPDATE SUBJECTS
        |--------------------------------------------------------------------------
        */

        if ($request->has('subject_ids')) {

            $validSubjects = Subject::where(
                'school_id',
                $schoolId
            )
                ->whereIn(
                    'id',
                    $validated['subject_ids']
                )
                ->pluck('id')
                ->all();

            $user->subjects()->sync($validSubjects);
        }

        /*
        |--------------------------------------------------------------------------
        | UPDATE CLASSES
        |--------------------------------------------------------------------------
        */

        if ($request->has('class_ids')) {

            $validClasses = SchoolClass::where(
                'school_id',
                $schoolId
            )
                ->whereIn(
                    'id',
                    $validated['class_ids']
                )
                ->pluck('id')
                ->all();

            $user->classes()->sync($validClasses);
        }

        return response()->json([
            'message' => 'Teacher updated successfully.',
            'teacher' => $user
                ->fresh()
                ->load(['subjects', 'classes']),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | MY SUBJECTS
    |--------------------------------------------------------------------------
    */

    public function mySubjects(Request $request)
    {
        $teacher = $request->user();

        $subjects = $teacher->subjects()
            ->orderBy('name')
            ->get();

        return response()->json([
            'message' => 'Teacher subjects retrieved successfully.',
            'subjects' => $subjects,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | MY CLASSES
    |--------------------------------------------------------------------------
    */

    public function myClasses(Request $request)
    {
        $teacher = $request->user();

        $classes = $teacher->classes()
            ->orderBy('name')
            ->get();

        return response()->json([
            'message' => 'Teacher classes retrieved successfully.',
            'classes' => $classes,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CLASS DETAILS
    |--------------------------------------------------------------------------
    */

    public function classDetails(
        Request $request,
        SchoolClass $class
    ) {
        $teacher = $request->user();

        /*
        |--------------------------------------------------------------------------
        | CHECK SCHOOL
        |--------------------------------------------------------------------------
        */

        if ($class->school_id !== $teacher->school_id) {
            return response()->json([
                'message' => 'You are not authorized to view this class.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | CHECK TEACHER CLASS ASSIGNMENT
        |--------------------------------------------------------------------------
        */

        $isAssigned = $teacher->classes()
            ->where('school_classes.id', $class->id)
            ->exists();

        if (!$isAssigned) {
            return response()->json([
                'message' => 'You are not authorized to view this class.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | GET STUDENTS
        |--------------------------------------------------------------------------
        */

        $className = strtolower(
            trim((string) $class->name)
        );

        $students = Student::where(
            'school_id',
            $teacher->school_id
        )
            ->whereRaw(
                'LOWER(TRIM(class_name)) = ?',
                [$className]
            )
            ->orderBy('first_name')
            ->get();

        return response()->json([
            'message' => 'Class details retrieved successfully.',
            'class' => $class,
            'students' => $students,
            'students_count' => $students->count(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | STUDENT DETAILS
    |--------------------------------------------------------------------------
    */

    public function studentDetails(
        Request $request,
        Student $student
    ) {
        $teacher = $request->user();

        /*
        |--------------------------------------------------------------------------
        | CHECK STUDENT SCHOOL
        |--------------------------------------------------------------------------
        */

        if ($student->school_id !== $teacher->school_id) {
            return response()->json([
                'message' => 'You are not authorized to view this student.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | GET TEACHER CLASSES
        |--------------------------------------------------------------------------
        */

        $teacherClasses = $teacher->classes()->get();

        /*
        |--------------------------------------------------------------------------
        | STUDENT CLASS
        |--------------------------------------------------------------------------
        */

        $studentClassName = strtolower(
            trim((string) $student->class_name)
        );

        /*
        |--------------------------------------------------------------------------
        | CHECK STUDENT CLASS ASSIGNMENT
        |--------------------------------------------------------------------------
        */

        $isAssignedToTeacher = $teacherClasses->contains(
            function ($class) use ($studentClassName) {

                $className = strtolower(
                    trim((string) $class->name)
                );

                return $className === $studentClassName;
            }
        );

        if (!$isAssignedToTeacher) {
            return response()->json([
                'message' => 'You are not authorized to view this student.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | RETURN STUDENT
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'message' => 'Student details retrieved successfully.',
            'student' => $student,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE TEACHER
    |--------------------------------------------------------------------------
    */

    public function destroy(Request $request, User $user)
    {
        $schoolId = $request->user()->school_id;

        if (
            $user->school_id !== $schoolId ||
            !in_array($user->role, ['teacher', 'staff'], true)
        ) {
            return response()->json([
                'message' => 'You are not authorized to delete this teacher.',
            ], 403);
        }

        $user->subjects()->detach();
        $user->classes()->detach();

        $user->delete();

        return response()->json([
            'message' => 'Teacher deleted successfully.',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | ASSIGN SUBJECTS
    |--------------------------------------------------------------------------
    */

    public function assignSubjects(Request $request)
    {
        $schoolId = $request->user()->school_id;

        $validated = $request->validate([
            'teacher_id' => [
                'required',
                'exists:users,id',
            ],

            'subject_ids' => [
                'required',
                'array',
            ],

            'subject_ids.*' => [
                'integer',
                'exists:subjects,id',
            ],
        ]);

        $teacher = User::where(
            'school_id',
            $schoolId
        )
            ->whereIn(
                'role',
                ['teacher', 'staff']
            )
            ->find($validated['teacher_id']);

        if (!$teacher) {
            return response()->json([
                'message' => 'The selected teacher does not belong to your school.',
            ], 403);
        }

        $validSubjects = Subject::where(
            'school_id',
            $schoolId
        )
            ->whereIn(
                'id',
                $validated['subject_ids']
            )
            ->pluck('id')
            ->all();

        $teacher->subjects()->sync($validSubjects);

        return response()->json([
            'message' => 'Teacher subjects updated successfully.',
            'teacher' => $teacher->load('subjects'),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | ASSIGN CLASSES
    |--------------------------------------------------------------------------
    */

    public function assignClasses(Request $request)
    {
        $schoolId = $request->user()->school_id;

        $validated = $request->validate([
            'teacher_id' => [
                'required',
                'exists:users,id',
            ],

            'class_ids' => [
                'required',
                'array',
            ],

            'class_ids.*' => [
                'integer',
                'exists:school_classes,id',
            ],
        ]);

        $teacher = User::where(
            'school_id',
            $schoolId
        )
            ->whereIn(
                'role',
                ['teacher', 'staff']
            )
            ->find($validated['teacher_id']);

        if (!$teacher) {
            return response()->json([
                'message' => 'The selected teacher does not belong to your school.',
            ], 403);
        }

        $validClasses = SchoolClass::where(
            'school_id',
            $schoolId
        )
            ->whereIn(
                'id',
                $validated['class_ids']
            )
            ->pluck('id')
            ->all();

        $teacher->classes()->sync($validClasses);

        return response()->json([
            'message' => 'Teacher classes updated successfully.',
            'teacher' => $teacher->load('classes'),
        ]);
    }
}