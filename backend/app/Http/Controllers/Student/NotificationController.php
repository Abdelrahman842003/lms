<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\SendNotificationRequest;
use App\Http\Resources\Student\StudentNotificationResource;
use App\Services\Student\StudentNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(
        private StudentNotificationService $notificationService
    ) {}

    /**
     * Get all notifications for the student
     */
    public function index(Request $request): JsonResponse
    {
        $student = $request->user();
        
        $receivedNotifications = $this->notificationService->getReceivedNotifications($student);
        $sentNotifications = $this->notificationService->getSentNotifications($student);

        return $this->successResponse([
            'received_notifications' => $receivedNotifications,
            'notifications' => $sentNotifications
        ]);
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $student = $request->user();
        $this->notificationService->markAsRead($student, $id);

        return $this->successResponse(null, 'تم تحديد الإشعار كمقروء');
    }

    /**
     * Send a notification from student to admin
     */
    public function store(SendNotificationRequest $request): JsonResponse
    {
        $student = $request->user();
        $validated = $request->validated();

        $notification = $this->notificationService->sendNotification(
            $student,
            $validated['title'],
            $validated['message'],
            $validated['recipient_type']
        );

        return $this->successResponse(
            new StudentNotificationResource($notification),
            'تم إرسال الإشعار بنجاح'
        );
    }
}
