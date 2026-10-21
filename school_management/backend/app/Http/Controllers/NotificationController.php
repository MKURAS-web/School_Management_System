<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * List notifications for the logged-in teacher.
     */
    public function index(Request $request)
    {
        $teacher = $request->user();

        $query = Notification::where('user_id', $teacher->id)
            ->orderBy('created_at', 'desc');

        if ($request->has('filter') && $request->filter !== 'all') {
            if ($request->filter === 'unread') {
                $query->where('is_read', false);
            } elseif ($request->filter === 'read') {
                $query->where('is_read', true);
            }
        }

        $notifications = $query->paginate(15);

        return response()->json([
            'message' => 'Notifications retrieved successfully.',
            'data' => $notifications->items(),
            'total' => $notifications->total(),
            'unread_count' => Notification::where('user_id', $teacher->id)
                ->where('is_read', false)
                ->count(),
        ]);
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(Request $request, Notification $notification)
    {
        $teacher = $request->user();

        if ($notification->user_id !== $teacher->id) {
            return response()->json([
                'message' => 'You are not authorized to access this notification.',
            ], 403);
        }

        $notification->update(['is_read' => true]);

        return response()->json([
            'message' => 'Notification marked as read.',
            'data' => $notification,
        ]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request)
    {
        $teacher = $request->user();

        Notification::where('user_id', $teacher->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json([
            'message' => 'All notifications marked as read.',
        ]);
    }

    /**
     * Delete a notification.
     */
    public function destroy(Request $request, Notification $notification)
    {
        $teacher = $request->user();

        if ($notification->user_id !== $teacher->id) {
            return response()->json([
                'message' => 'You are not authorized to delete this notification.',
            ], 403);
        }

        $notification->delete();

        return response()->json([
            'message' => 'Notification deleted successfully.',
        ]);
    }
}
