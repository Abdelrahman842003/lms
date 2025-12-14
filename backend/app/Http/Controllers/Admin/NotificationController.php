<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Notification\SendNotificationRequest;
use App\Models\SentNotification;
use App\Services\Admin\NotificationService;
use App\Traits\ApiResponseTrait;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
{
    use ApiResponseTrait;

    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function index()
    {
        Log::info('Admin Notification Index Reached');
        $admin = Auth::user();
        Log::info('Admin User: ' . ($admin ? $admin->id : 'null'));

        if (!$admin) {
             return $this->errorResponse('Unauthorized', 401);
        }
        
        $notifications = SentNotification::where('admin_id', $admin->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $receivedNotifications = $admin->notifications()
            ->orderBy('created_at', 'desc')
            ->get();

        return $this->successResponse([
            'notifications' => $notifications,
            'received_notifications' => $receivedNotifications
        ]);
    }

    public function store(SendNotificationRequest $request)
    {
        try {
            $sentNotification = $this->notificationService->sendNotification($request->validated());

            return $this->successResponse([
                'message' => 'Notification sent successfully',
                'notification' => $sentNotification
            ], 'Notification sent successfully');
        } catch (\Exception $e) {
            $code = $e->getCode();
            // Ensure code is a valid HTTP status code
            if (!is_int($code) || $code < 100 || $code > 599) {
                $code = 500;
            }
            return $this->errorResponse($e->getMessage(), $code);
        }
    }

    public function markAsRead($id)
    {
        $admin = Auth::user();
        $notification = $admin->notifications()->where('id', $id)->first();

        if ($notification) {
            $notification->markAsRead();
        }

        return $this->successResponse(null, 'Notification marked as read');
    }
}
