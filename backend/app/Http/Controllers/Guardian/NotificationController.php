<?php

namespace App\Http\Controllers\Guardian;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Get all notifications for all children
     */
    public function index(Request $request)
    {
        $parent = $request->user();
        
        if (!$parent || !$parent->parent_phone) {
            return $this->errorResponse('غير مصرح', 401);
        }

        // Get all children
        $children = Student::where('parent_phone', $parent->parent_phone)->get();

        $allNotifications = [];

        foreach ($children as $child) {
            // Get received notifications (from teachers/admin)
            $childNotifications = $child->notifications()
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($notification) use ($child) {
                    $data = $notification->data ?? [];
                    return [
                        'id' => $notification->id,
                        'child_id' => $child->id,
                        'child_name' => $child->name,
                        'title' => $data['title'] ?? 'إشعار',
                        'message' => $data['message'] ?? '',
                        'type' => $data['type'] ?? 'general',
                        'sender_name' => $data['sender_name'] ?? 'النظام',
                        'created_at' => $notification->created_at,
                        'read_at' => $notification->read_at,
                    ];
                });

            $allNotifications = array_merge($allNotifications, $childNotifications->toArray());
        }

        // Sort by created_at descending
        usort($allNotifications, function ($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });

        // Calculate stats
        $totalCount = count($allNotifications);
        $unreadCount = count(array_filter($allNotifications, fn($n) => $n['read_at'] === null));

        return $this->successResponse([
            'notifications' => $allNotifications,
            'stats' => [
                'total' => $totalCount,
                'unread' => $unreadCount,
            ],
        ]);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Request $request, string $id)
    {
        $parent = $request->user();
        
        if (!$parent || !$parent->parent_phone) {
            return $this->errorResponse('غير مصرح', 401);
        }

        // Get all children
        $children = Student::where('parent_phone', $parent->parent_phone)->get();
        $childIds = $children->pluck('id')->toArray();

        // Find the notification in any child's notifications
        $notification = null;
        foreach ($children as $child) {
            $found = $child->notifications()->where('id', $id)->first();
            if ($found) {
                $notification = $found;
                break;
            }
        }

        if ($notification) {
            $notification->markAsRead();
            return $this->successResponse(null, 'تم تحديد الإشعار كمقروء');
        }

        return $this->errorResponse('الإشعار غير موجود', 404);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request)
    {
        $parent = $request->user();
        
        if (!$parent || !$parent->parent_phone) {
            return $this->errorResponse('غير مصرح', 401);
        }

        // Get all children
        $children = Student::where('parent_phone', $parent->parent_phone)->get();

        foreach ($children as $child) {
            $child->unreadNotifications->markAsRead();
        }

        return $this->successResponse(null, 'تم تحديد جميع الإشعارات كمقروءة');
    }
}
