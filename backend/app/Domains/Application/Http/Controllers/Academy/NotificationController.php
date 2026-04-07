<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Academy;

use App\Domains\Notifications\DTOs\NotificationData;
use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Academy\SendToTeachersRequest;
use App\Domains\Application\Http\Requests\Academy\StoreNotificationRequest;
use App\Domains\Application\Http\Requests\Academy\StoreVoiceNotificationRequest;
use App\Domains\Application\Http\Resources\Academy\NotificationResource;
use App\Domains\Application\Services\Academy\NotificationService;
use App\Domains\Notifications\Services\VoiceNotificationService;
use Illuminate\Auth\Access\AuthorizationException;
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

        // Custom Academy Notifications (e.g. from academy to staff)
        $notifications = $this->service->getNotifications(
            $academy,
            $perPage,
            null,
            $targetType
        );

        // Standard Laravel Notifications (e.g. from system to academy)
        $receivedNotifications = $this->service->getReceivedNotifications(
            $academy,
            $perPage
        );

        return $this->successResponse([
            'notifications' => NotificationResource::collection($notifications),
            'received_notifications' => NotificationResource::collection($receivedNotifications),
        ]);
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

    public function checkVoiceLimit(Request $request): JsonResponse
    {
        return $this->successResponse([
            'can_send_voice' => true,
            'max_duration' => VoiceNotificationService::MAX_DURATION,
        ]);
    }

    public function storeVoice(StoreVoiceNotificationRequest $request): JsonResponse
    {
        $academy = $request->user();

        try {
            $notification = $this->service->createVoiceNotification(
                academy: $academy,
                title: (string) $request->validated('title'),
                voiceFile: $request->file('voice'),
                duration: (int) $request->validated('duration'),
                targetType: (string) ($request->validated('target_type') ?? 'all'),
                targetIds: $request->validated('target_ids') ?? [],
                type: (string) ($request->validated('type') ?? 'info'),
                creatorId: null,
            );
        } catch (AuthorizationException $e) {
            return $this->errorResponse(message: $e->getMessage(), code: 403);
        } catch (\InvalidArgumentException $e) {
            return $this->errorResponse(message: $e->getMessage(), code: 422);
        } catch (\RuntimeException $e) {
            return $this->errorResponse(message: $e->getMessage(), code: 422);
        } catch (\Throwable $e) {
            return $this->errorResponse(message: 'حدث خطأ أثناء إرسال الرسالة الصوتية', code: 500);
        }

        return $this->successResponse(
            new NotificationResource($notification),
            'تم إرسال الرسالة الصوتية بنجاح'
        );
    }

    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $academy = $request->user();

        // 1. Try standard notification first
        $standardNotification = $academy->notifications()->where('id', $id)->first();
        if ($standardNotification) {
            $standardNotification->markAsRead();
            return $this->successResponse(null, 'تم تحديد الإشعار كمقروء');
        }

        // 2. Try AcademyNotification (custom table)
        try {
            $userId = $request->user()->id;
            $notification = $this->service->markAsRead($academy, $id, $userId);

            return $this->successResponse([
                'notification' => $notification,
                'message' => 'تم تحديد الإشعار كمقروء',
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse('الإشعار غير موجود', 404);
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
