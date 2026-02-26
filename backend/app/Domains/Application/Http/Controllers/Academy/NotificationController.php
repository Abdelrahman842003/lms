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

        $notification = $this->service->createNotification(
            $academy,
            $data,
            null
        );

        return $this->successResponse(
            new NotificationResource($notification),
            'تم إرسال الإشعار بنجاح'
        );
    }

    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $academy = $request->user();

        try {
            $notification = $this->service->markAsRead($id, $academy->id);

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

        $notification = $this->service->sendToTeachers(
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
