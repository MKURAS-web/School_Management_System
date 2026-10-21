<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\User;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    /**
     * List announcements for the school admin's school.
     */
    public function index(Request $request)
    {
        $schoolId = $request->user()->school_id;

        $announcements = Announcement::with('creator')
            ->where('school_id', $schoolId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'message' => 'Announcements retrieved successfully.',
            'data' => $announcements,
        ]);
    }

    /**
     * Create a new announcement for the school admin's school.
     * All teachers in the school will be able to see it.
     */
    public function store(Request $request)
    {
        $schoolId = $request->user()->school_id;
        $admin = $request->user();

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string'],
        ]);

        $announcement = Announcement::create([
            'school_id' => $schoolId,
            'created_by' => $admin->id,
            'title' => $validated['title'],
            'message' => $validated['message'],
            'published_at' => now(),
        ]);

        return response()->json([
            'message' => 'Announcement created successfully.',
            'data' => $announcement->load('creator'),
        ], 201);
    }

    /**
     * Mark all announcements as read for the logged-in teacher.
     */
    public function markAllAsRead(Request $request)
    {
        $schoolId = $request->user()->school_id;

        Announcement::where('school_id', $schoolId)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json([
            'message' => 'All announcements marked as read.',
        ]);
    }

    /**
     * Delete an announcement (only by the school admin who owns the school).
     */
    public function destroy(Request $request, Announcement $announcement)
    {
        $schoolId = $request->user()->school_id;

        if ($announcement->school_id !== $schoolId) {
            return response()->json([
                'message' => 'You are not authorized to delete this announcement.',
            ], 403);
        }

        $announcement->delete();

        return response()->json([
            'message' => 'Announcement deleted successfully.',
        ]);
    }

    /**
     * List announcements visible to the logged-in teacher (their school).
     */
    public function teacherIndex(Request $request)
    {
        $teacher = $request->user();
        $schoolId = $teacher->school_id;

        $announcements = Announcement::with('creator')
            ->where('school_id', $schoolId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'message' => 'Announcements retrieved successfully.',
            'data' => $announcements,
        ]);
    }
}
