<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TeacherAttendanceController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | GET ATTENDANCE FOR A CLASS
    |--------------------------------------------------------------------------
    */

    public function index(Request $request)
    {
        $teacher = $request->user();

        $validated = $request->validate([
            'class_id' => ['required', 'integer'],
            'date' => ['required', 'date_format:Y-m-d'],
        ]);

        $class = SchoolClass::where(
            'school_id',
            $teacher->school_id
        )->findOrFail($validated['class_id']);

        $isAssigned = $teacher->classes()
            ->where('school_classes.id', $class->id)
            ->exists();

        if (!$isAssigned) {
            return response()->json([
                'message' => 'You are not authorized to access attendance for this class.',
            ], 403);
        }

        $className = strtolower(trim((string) $class->name));

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

        $attendanceRecords = Attendance::where(
            'school_id',
            $teacher->school_id
        )
            ->where('class_id', $class->id)
            ->where('attendance_date', $validated['date'])
            ->get()
            ->keyBy('student_id');

        $studentsWithAttendance = $students->map(
            function ($student) use ($attendanceRecords) {
                $record = $attendanceRecords->get($student->id);

                return [
                    'id' => $student->id,
                    'first_name' => $student->first_name,
                    'middle_name' => $student->middle_name,
                    'last_name' => $student->last_name,
                    'admission_number' => $student->admission_number,
                    'gender' => $student->gender,
                    'status' => $record?->status,
                    'remarks' => $record?->remarks,
                ];
            }
        )->values();

        return response()->json([
            'message' => 'Attendance retrieved successfully.',
            'class' => $class,
            'date' => $validated['date'],
            'students' => $studentsWithAttendance,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | SAVE ATTENDANCE
    |--------------------------------------------------------------------------
    */

    public function store(Request $request)
    {
        $teacher = $request->user();

        $validated = $request->validate([
            'class_id' => ['required', 'integer'],
            'attendance_date' => ['required', 'date_format:Y-m-d'],

            'students' => ['required', 'array', 'min:1'],

            'students.*.student_id' => [
                'required',
                'integer',
                'distinct',
                'exists:students,id',
            ],

            'students.*.status' => [
                'required',
                Rule::in([
                    'present',
                    'absent',
                    'late',
                    'excused',
                ]),
            ],

            'students.*.remarks' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ]);

        $class = SchoolClass::where(
            'school_id',
            $teacher->school_id
        )->findOrFail($validated['class_id']);

        $isAssigned = $teacher->classes()
            ->where('school_classes.id', $class->id)
            ->exists();

        if (!$isAssigned) {
            return response()->json([
                'message' => 'You are not authorized to record attendance for this class.',
            ], 403);
        }

        $className = strtolower(trim((string) $class->name));

        $validStudentIds = Student::where(
            'school_id',
            $teacher->school_id
        )
            ->whereRaw(
                'LOWER(TRIM(class_name)) = ?',
                [$className]
            )
            ->whereIn(
                'id',
                collect($validated['students'])
                    ->pluck('student_id')
                    ->all()
            )
            ->pluck('id')
            ->all();

        if (
            count($validStudentIds) !==
            count($validated['students'])
        ) {
            return response()->json([
                'message' => 'One or more students do not belong to this class.',
            ], 422);
        }

        DB::transaction(function () use (
            $validated,
            $teacher,
            $class,
            $validStudentIds
        ) {
            foreach ($validated['students'] as $studentData) {
                Attendance::updateOrCreate(
                    [
                        'student_id' => $studentData['student_id'],
                        'attendance_date' => $validated['attendance_date'],
                    ],
                    [
                        'school_id' => $teacher->school_id,
                        'class_id' => $class->id,
                        'teacher_id' => $teacher->id,
                        'status' => $studentData['status'],
                        'remarks' => $studentData['remarks'] ?? null,
                    ]
                );
            }
        });

        return response()->json([
            'message' => 'Attendance saved successfully.',
            'class_id' => $class->id,
            'attendance_date' => $validated['attendance_date'],
            'students_saved' => count($validStudentIds),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | ATTENDANCE HISTORY
    |--------------------------------------------------------------------------
    */

    public function history(Request $request)
    {
        $teacher = $request->user();

        $validated = $request->validate([
            'class_id' => ['required', 'integer'],
        ]);

        $class = SchoolClass::where(
            'school_id',
            $teacher->school_id
        )->findOrFail($validated['class_id']);

        $isAssigned = $teacher->classes()
            ->where('school_classes.id', $class->id)
            ->exists();

        if (!$isAssigned) {
            return response()->json([
                'message' => 'You are not authorized to view this attendance history.',
            ], 403);
        }

        $history = Attendance::where(
            'school_id',
            $teacher->school_id
        )
            ->where('class_id', $class->id)
            ->select(
                'attendance_date',
                'status',
                DB::raw('COUNT(*) as total')
            )
            ->groupBy('attendance_date', 'status')
            ->orderByDesc('attendance_date')
            ->get();

        return response()->json([
            'message' => 'Attendance history retrieved successfully.',
            'class' => $class,
            'history' => $history,
        ]);
    }
}