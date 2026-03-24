<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Academy;

use App\Domains\Notifications\DTOs\NotificationData;
use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Academy\SendToTeachersRequest;
use App\Domains\Application\Http\Requests\Academy\StoreNotificationRequest;
use App\Domains\Application\Http\Resources\Academy\NotificationResource;
use App\Domains\Application\Services\Academy\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(
        private NotificationService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        $academy = $request->user();

        $perPage = (int) $request->input('per_page', 15);
        $targetType = $request->input('target_type');

        $notifications = $this->service->getNotifications(
            $academy,
            $perPage,
            null, // We don't filter by userId for academy view
            $targetType
        );

        return $this->successResponse(NotificationResource::collection($notifications));
    }

    public function store(StoreNotificationRequest $request): JsonResponse
    {
        $academy = $request->user();

        $data = NotificationData::fromRequest($request);

        try {
            $notification = $this->service->createNotification(
                $academy,
                $data,
                null
            );
        } catch (\RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse(
            new NotificationResource($notification),
            'تم إرسال الإشعار بنجاح'
        );
    }

    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $academy = $request->user();

        try {
            // Get user ID for marking as read (could be academy or secretary)
            $userId = $request->user()->id;
            $notification = $this->service->markAsRead($academy, $id, $userId);

            return $this->successResponse([
                'notification' => $notification,
                'message' => 'تم تحديد الإشعار كمقروء',
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 404);
        }
    }

    public function sendToTeachers(SendToTeachersRequest $request): JsonResponse
    {
        $academy = $request->user();

        try {
            $notification = $this->service->sendToTeachers(
                $academy,
                $request->validated('title'),
                $request->validated('message'),
                $request->validated('type') ?? 'info',
                null
            );
        } catch (\RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse([
            'notification' => $notification,
        ], 'تم إرسال الإشعار لجميع المدرسين', 201);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $academy = $request->user();

        $count = $this->service->getUnreadCount(
            $academy,
            $academy->id,
            'academy'
        );

        return $this->successResponse(['unread_count' => $count]);
    }
}
