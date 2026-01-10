<?php

declare(strict_types=1);

namespace App\Http\Controllers\Academy;

use App\Http\Controllers\Controller;
use App\Services\Academy\NotificationService;
use App\Http\Requests\Academy\StoreNotificationRequest;
use App\Http\Requests\Academy\SendToTeachersRequest;
use App\DTOs\Academy\NotificationData;
use App\Http\Resources\Academy\NotificationResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    public function __construct(
        private NotificationService $notificationService
    ) {}

    /**
     * Get academy notifications
     */
    public function index(Request $request): JsonResponse
    {
        $academy = $request->user();

        $perPage = (int) $request->input('per_page', 15);
        $targetType = $request->input('target_type');

        $notifications = $this->notificationService->getNotifications(
            $academy,
            $perPage,
            null, // We don't filter by userId for academy view
            $targetType
        );

        return $this->successResponse(NotificationResource::collection($notifications));
    }

    /**
     * Create notification
     */
    public function store(StoreNotificationRequest $request): JsonResponse
    {
        $academy = $request->user();

        $data = NotificationData::fromRequest($request);

        $notification = $this->notificationService->createNotification(
            $academy,
            $data,
            null
        );

        return $this->successResponse(
            new NotificationResource($notification),
            'تم إرسال الإشعار بنجاح'
        );
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $academy = $request->user();

        try {
            $notification = $this->notificationService->markAsRead($id, $academy->id);

            return $this->successResponse([
                'notification' => $notification,
                'message' => 'تم تحديد الإشعار كمقروء',
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 404);
        }
    }

    /**
     * Send notification to all teachers
     */
    public function sendToTeachers(SendToTeachersRequest $request): JsonResponse
    {
        $academy = $request->user();

        $notification = $this->notificationService->sendToTeachers(
            $academy,
            $request->validated('title'),
            $request->validated('message'),
            $request->validated('type') ?? 'info',
            null
        );

        return $this->successResponse([
            'notification' => $notification,
        ], 'تم إرسال الإشعار لجميع المدرسين', 201);
    }

    /**
     * Get unread count
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $academy = $request->user();

        $count = $this->notificationService->getUnreadCount(
            $academy,
            $academy->id,
            'academy'
        );

        return $this->successResponse(['unread_count' => $count]);
    }
}
