<?php

namespace App\Http\Controllers;

use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class StudentController extends Controller
{
    /**
     * Display students belonging to the
     * currently logged-in School Admin's school.
     *
     * Supports filtering by class and stream(s) and pagination:
     *   ?class_name=Form Two
     *   ?streams=A,B            (comma separated or repeated streams[] params)
     *   ?search=...
     *   ?page=2&per_page=10
     */
    public function index(Request $request)
    {
        $schoolId = $request->user()->school_id;

        $perPage = max(1, min((int) $request->input('per_page', 10), 1000));
        $page = max(1, (int) $request->input('page', 1));

        $query = Student::where('school_id', $schoolId)
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc');

        $className = $request->input('class_name');
        if ($className !== null && $className !== '' && $className !== 'all') {
            $query->whereRaw('LOWER(TRIM(class_name)) = ?', [strtolower(trim($className))]);
        }

        $streams = $request->input('streams');
        if ($streams !== null && $streams !== '') {
            $streamList = is_array($streams)
                ? $streams
                : array_filter(explode(',', $streams));

            $streamList = array_values(
                array_filter(
                    array_map(
                        fn ($stream) => strtolower(trim($stream)),
                        $streamList
                    ),
                    fn ($stream) => $stream !== ''
                )
            );

            if (!empty($streamList)) {
                $query->whereInRaw('LOWER(TRIM(stream))', $streamList);
            }
        }

        $search = $request->input('search');
        if ($search !== null && $search !== '') {
            $term = '%' . strtolower(trim($search)) . '%';

            $query->where(function ($q) use ($term) {
                $q->whereRaw('LOWER(TRIM(admission_number)) LIKE ?', [$term])
                    ->orWhereRaw(
                        'LOWER(TRIM(CONCAT_WS(\' \', first_name, middle_name, last_name))) LIKE ?',
                        [$term]
                    )
                    ->orWhereRaw('LOWER(gender) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(phone) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(address) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(class_name) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(stream) LIKE ?', [$term]);
            });
        }

        $students = $query->paginate($perPage, ['*'], 'page', $page);

        return response()->json($students);
    }

    /**
     * Store a new student.
     */
    public function store(Request $request)
    {
        $schoolId = $request->user()->school_id;

        $validated = $request->validate([
            'admission_number' => [
                'required',
                'string',
                'max:255',
            ],

            'first_name' => [
                'required',
                'string',
                'max:255',
            ],

            'middle_name' => [
                'nullable',
                'string',
                'max:255',
            ],

            'last_name' => [
                'required',
                'string',
                'max:255',
            ],

            'gender' => [
                'required',
                'in:Male,Female',
            ],

            'date_of_birth' => [
                'nullable',
                'date',
            ],

            'phone' => [
                'nullable',
                'string',
                'max:30',
            ],

            'address' => [
                'nullable',
                'string',
                'max:255',
            ],

            'class_name' => [
                'nullable',
                'string',
                'max:100',
            ],

            'stream' => [
                'nullable',
                'string',
                'max:100',
            ],
        ]);

        /*
         * IMPORTANT:
         *
         * We do NOT accept school_id from the frontend.
         *
         * The school_id is automatically taken from
         * the logged-in School Admin.
         */
        $validated['school_id'] = $schoolId;

        /*
         * Make sure admission number is unique
         * within this particular school.
         */
        $existingStudent = Student::where(
            'school_id',
            $schoolId
        )
            ->where(
                'admission_number',
                $validated['admission_number']
            )
            ->exists();

        if ($existingStudent) {
            return response()->json([
                'message' => 'Admission number already exists in your school.',
            ], 422);
        }

        $student = Student::create($validated);

        return response()->json([
            'message' => 'Student added successfully.',
            'student' => $student,
        ], 201);
    }

    /**
     * Import multiple students in a single request.
     */
    public function import(Request $request)
    {
        $schoolId = $request->user()->school_id;

        $students = $request->input('students');

        if (!is_array($students) || empty($students)) {
            return response()->json([
                'message' => 'Please provide a list of students to import.',
            ], 422);
        }

        $createdStudents = [];
        $errors = [];

        foreach ($students as $index => $studentData) {
            $validator = Validator::make($studentData ?? [], [
                'admission_number' => ['required', 'string', 'max:255'],
                'first_name' => ['required', 'string', 'max:255'],
                'middle_name' => ['nullable', 'string', 'max:255'],
                'last_name' => ['required', 'string', 'max:255'],
                'gender' => ['required', 'in:Male,Female'],
                'date_of_birth' => ['nullable', 'date'],
                'phone' => ['nullable', 'string', 'max:30'],
                'address' => ['nullable', 'string', 'max:255'],
                'class_name' => ['nullable', 'string', 'max:100'],
                'stream' => ['nullable', 'string', 'max:100'],
            ]);

            if ($validator->fails()) {
                $errors[] = 'Row ' . ($index + 1) . ': ' . $validator->errors()->first();
                continue;
            }

            $validated = $validator->validated();
            $validated['school_id'] = $schoolId;

            $admissionNumber = trim((string) $validated['admission_number']);
            $existingStudent = Student::where('school_id', $schoolId)
                ->where('admission_number', $admissionNumber)
                ->exists();

            if ($existingStudent) {
                $errors[] = 'Row ' . ($index + 1) . ': Admission number ' . $admissionNumber . ' already exists in your school.';
                continue;
            }

            $validated['admission_number'] = $admissionNumber;

            $createdStudents[] = Student::create($validated);
        }

        if (empty($createdStudents)) {
            return response()->json([
                'message' => 'No students were imported.',
                'errors' => $errors,
            ], 422);
        }

        return response()->json([
            'message' => 'Students imported successfully.',
            'count' => count($createdStudents),
            'students' => $createdStudents,
            'errors' => $errors,
        ], 200);
    }

    /**
     * Display a specific student.
     */
    public function show(
        Request $request,
        Student $student
    ) {
        $schoolId = $request->user()->school_id;

        /*
         * Security check:
         *
         * A School Admin can only view
         * students belonging to their school.
         */
        if ($student->school_id !== $schoolId) {
            return response()->json([
                'message' => 'You are not authorized to access this student.',
            ], 403);
        }

        return response()->json($student);
    }

    /**
     * Update a student.
     */
    public function update(
        Request $request,
        Student $student
    ) {
        $schoolId = $request->user()->school_id;

        /*
         * Prevent School Admin from updating
         * a student from another school.
         */
        if ($student->school_id !== $schoolId) {
            return response()->json([
                'message' => 'You are not authorized to update this student.',
            ], 403);
        }

        $validated = $request->validate([
            'admission_number' => [
                'required',
                'string',
                'max:255',
            ],

            'first_name' => [
                'required',
                'string',
                'max:255',
            ],

            'middle_name' => [
                'nullable',
                'string',
                'max:255',
            ],

            'last_name' => [
                'required',
                'string',
                'max:255',
            ],

            'gender' => [
                'required',
                'in:Male,Female',
            ],

            'date_of_birth' => [
                'nullable',
                'date',
            ],

            'phone' => [
                'nullable',
                'string',
                'max:30',
            ],

            'address' => [
                'nullable',
                'string',
                'max:255',
            ],

            'class_name' => [
                'nullable',
                'string',
                'max:100',
            ],

            'stream' => [
                'nullable',
                'string',
                'max:100',
            ],
        ]);

        /*
         * Never allow the frontend to change
         * the student's school.
         */
        $validated['school_id'] = $schoolId;

        $student->update($validated);

        return response()->json([
            'message' => 'Student updated successfully.',
            'student' => $student,
        ]);
    }

    /**
     * Delete a student.
     */
    public function destroy(
        Request $request,
        Student $student
    ) {
        $schoolId = $request->user()->school_id;

        /*
         * Prevent deletion of students
         * belonging to another school.
         */
        if ($student->school_id !== $schoolId) {
            return response()->json([
                'message' => 'You are not authorized to delete this student.',
            ], 403);
        }

        $student->delete();

        return response()->json([
            'message' => 'Student deleted successfully.',
        ]);
    }

    /**
     * Download the (filtered) students as a CSV file.
     *
     * Supports the same filters as index: class_name, streams, search.
     */
    public function download(Request $request)
    {
        $schoolId = $request->user()->school_id;

        $query = Student::where('school_id', $schoolId)
            ->orderBy('class_name', 'asc')
            ->orderBy('stream', 'asc')
            ->orderBy('admission_number', 'asc');

        $className = $request->input('class_name');
        if ($className !== null && $className !== '' && $className !== 'all') {
            $query->whereRaw('LOWER(TRIM(class_name)) = ?', [strtolower(trim($className))]);
        }

        $streams = $request->input('streams');
        $streamList = [];
        if ($streams !== null && $streams !== '') {
            $streamList = is_array($streams)
                ? $streams
                : array_filter(explode(',', $streams));

            $streamList = array_values(
                array_filter(
                    array_map(
                        fn ($stream) => strtolower(trim($stream)),
                        $streamList
                    ),
                    fn ($stream) => $stream !== ''
                )
            );

            if (!empty($streamList)) {
                $query->whereInRaw('LOWER(TRIM(stream))', $streamList);
            }
        }

        $search = $request->input('search');
        if ($search !== null && $search !== '') {
            $term = '%' . strtolower(trim($search)) . '%';

            $query->where(function ($q) use ($term) {
                $q->whereRaw('LOWER(TRIM(admission_number)) LIKE ?', [$term])
                    ->orWhereRaw(
                        'LOWER(TRIM(CONCAT_WS(\' \', first_name, middle_name, last_name))) LIKE ?',
                        [$term]
                    )
                    ->orWhereRaw('LOWER(gender) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(phone) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(address) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(class_name) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(stream) LIKE ?', [$term]);
            });
        }

        $students = $query->get();

        $rows = [
            [
                'Admission Number', 'First Name', 'Middle Name', 'Last Name', 'Gender',
                'Date of Birth', 'Phone', 'Address', 'Class', 'Stream',
            ],
        ];

        foreach ($students as $student) {
            $rows[] = [
                $student->admission_number ?? '',
                $student->first_name ?? '',
                $student->middle_name ?? '',
                $student->last_name ?? '',
                $student->gender ?? '',
                $student->date_of_birth ?? '',
                $student->phone ?? '',
                $student->address ?? '',
                $student->class_name ?? '',
                $student->stream ?? '',
            ];
        }

        $csv = "\xEF\xBB\xBF" . implode("\n", array_map(
            function ($row) {
                return implode(',', array_map([$this, 'escapeCsv'], $row));
            },
            $rows
        ));

        $fileNameParts = ['students'];
        if ($className && $className !== 'all') {
            $fileNameParts[] = $this->slug($className);
        }
        if (!empty($streamList)) {
            $fileNameParts[] = implode('-', array_map(fn ($stream) => $this->slug($stream), $streamList));
        }

        $fileName = implode('-', $fileNameParts) . '.csv';

        return response($csv)
            ->header('Content-Type', 'text/csv; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="' . $fileName . '"');
    }

    /**
     * Escape a value for safe inclusion in a CSV field.
     */
    private function escapeCsv($value): string
    {
        $value = (string) ($value ?? '');

        if (preg_match('/[",\r\n]/', $value)) {
            return '"' . str_replace('"', '""', $value) . '"';
        }

        return $value;
    }

    /**
     * Create a URL/file friendly slug from a text.
     */
    private function slug(string $text): string
    {
        return trim(preg_replace('/[^a-z0-9]+/i', '-', strtolower((string) $text)), '-');
    }
}