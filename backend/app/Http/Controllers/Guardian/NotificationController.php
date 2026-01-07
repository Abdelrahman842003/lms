<?php

namespace App\Http\Controllers\Guardian;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

use App\Services\Guardian\GuardianNotificationService;

class NotificationController extends Controller
{
    protected $notificationService;

    public function __construct(GuardianNotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }
    /**
     * Get all notifications for all children
     */
    public function index(Request $request)
    {
        $parent = $request->user();
        $perPage = $request->input('per_page', 20);

        $notifications = $this->notificationService->getNotifications($parent, $perPage);
        $unreadCount = $this->notificationService->getUnreadCount($parent);

        // Transform notifications
        $formattedNotifications = $notifications->map(function ($notification) {
            $data = $notification->data ?? [];
            return [
                'id' => (string)$notification->id,
                'type' => $data['type'] ?? 'general',
                'data' => [
                    'title' => $data['title'] ?? 'إشعار',
                    'message' => $data['message'] ?? '',
                    'sender_name' => $data['sender_name'] ?? 'النظام',
                    'child_name' => $data['child_name'] ?? null,
                    'is_voice' => $data['is_voice'] ?? false,
                    'voice_url' => $data['voice_url'] ?? null,
                    'voice_duration' => $data['voice_duration'] ?? null,
                ],
                'read_at' => $notification->read_at,
                'created_at' => $notification->created_at,
            ];
        });

        return $this->successResponse([
            'notifications' => [], // Legacy format if needed
            'received_notifications' => $formattedNotifications,
            'stats' => [
                'total' => $notifications->total(),
                'unread' => $unreadCount,
            ],
            'pagination' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ]
        ]);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Request $request, string $id)
    {
        $parent = $request->user();

        try {
            $this->notificationService->markAsRead($parent, $id);
            return $this->successResponse(null, 'تم تحديد الإشعار كمقروء');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 404);
        }
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request)
    {
        $parent = $request->user();
        $this->notificationService->markAllAsRead($parent);

        return $this->successResponse(null, 'تم تحديد جميع الإشعارات كمقروءة');
    }
}
