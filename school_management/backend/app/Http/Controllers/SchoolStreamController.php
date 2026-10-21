<?php

namespace App\Http\Controllers;

use App\Models\SchoolClass;
use App\Models\SchoolStream;
use Illuminate\Http\Request;

class SchoolStreamController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = $request->user()->school_id;

        $streams = SchoolStream::with('class')
            ->where('school_id', $schoolId)
            ->orderBy('name')
            ->get();

        return response()->json($streams);
    }

    public function store(Request $request)
    {
        $schoolId = $request->user()->school_id;

        $validated = $request->validate([
            'class_id' => ['required', 'exists:school_classes,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $class = SchoolClass::where('school_id', $schoolId)
            ->find($validated['class_id']);

        if (!$class) {
            return response()->json([
                'message' => 'The selected class does not belong to your school.',
            ], 403);
        }

        $validated['school_id'] = $schoolId;

        $stream = SchoolStream::create($validated);

        return response()->json([
            'message' => 'Stream created successfully.',
            'stream' => $stream->load('class'),
        ], 201);
    }

    public function update(Request $request, SchoolStream $schoolStream)
    {
        $schoolId = $request->user()->school_id;

        if ($schoolStream->school_id !== $schoolId) {
            return response()->json([
                'message' => 'You are not authorized to update this stream.',
            ], 403);
        }

        $validated = $request->validate([
            'class_id' => ['required', 'exists:school_classes,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $class = SchoolClass::where('school_id', $schoolId)
            ->find($validated['class_id']);

        if (!$class) {
            return response()->json([
                'message' => 'The selected class does not belong to your school.',
            ], 403);
        }

        $schoolStream->update($validated);

        return response()->json([
            'message' => 'Stream updated successfully.',
            'stream' => $schoolStream->load('class'),
        ]);
    }

    public function destroy(Request $request, SchoolStream $schoolStream)
    {
        $schoolId = $request->user()->school_id;

        if ($schoolStream->school_id !== $schoolId) {
            return response()->json([
                'message' => 'You are not authorized to delete this stream.',
            ], 403);
        }

        $schoolStream->delete();

        return response()->json([
            'message' => 'Stream deleted successfully.',
        ]);
    }
}
