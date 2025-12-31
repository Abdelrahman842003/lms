<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use App\Traits\ApiResponseTrait;

class NotificationController extends Controller
{
    use ApiResponseTrait;

    public function index()
    {
        $student = Auth::user();
        
        // Get received notifications, excluding those marked for parent only
        $receivedNotifications = $student->notifications()
            ->orderBy('created_at', 'desc')
            ->get()
            ->filter(function ($notification) {
                // Exclude notifications that are for parent only
                $data = $notification->data;
                return !isset($data['for_parent']) || $data['for_parent'] !== true;
            })
            ->values();

        $sentNotifications = $student->sentNotifications()
            ->orderBy('created_at', 'desc')
            ->get();

        return $this->successResponse([
            'received_notifications' => $receivedNotifications,
            'notifications' => $sentNotifications
        ]);
    }

    public function markAsRead($id)
    {
        $student = Auth::user();
        $notification = $student->notifications()->where('id', $id)->first();

        if ($notification) {
            $notification->markAsRead();
        }

        return $this->successResponse(null, 'Notification marked as read');
    }

    public function store(\Illuminate\Http\Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'recipient_type' => 'required|in:admin',
        ]);

        $student = Auth::user();

        $notification = \App\Models\SentNotification::create([
            'student_id' => $student->id,
            'title' => $request->title,
            'message' => $request->message,
            'recipient_type' => $request->recipient_type,
            'recipient_count' => 1, // Only sent to admin/support
        ]);

        return $this->successResponse($notification, 'Notification sent successfully');
    }
}
