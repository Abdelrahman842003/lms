<?php

namespace App\Http\Controllers\Teacher;

use App\Factories\NotificationFactory;
use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\Notification\SendNotificationRequest;
use App\Models\SentNotification;
use App\Services\Teacher\NotificationService;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    use \App\Traits\ResolvesTeacher;
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function index()
    {
        $teacher = $this->getTeacherFromRequest(request());
        
        $notifications = SentNotification::where('teacher_id', $teacher->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $receivedNotifications = $teacher->notifications()
            ->orderBy('created_at', 'desc')
            ->get();

        return $this->successResponse([
            'notifications' => $notifications,
            'received_notifications' => $receivedNotifications
        ]);
    }

    public function store(SendNotificationRequest $request)
    {
        $teacher = $this->getTeacherFromRequest(request());
        $validated = $request->validated();

        $recipients = $this->notificationService->getRecipients(
            $teacher,
            $validated['recipient_type'],
            $validated['grade_id'] ?? null,
            $validated['group_id'] ?? null
        );



        if ($recipients->isEmpty()) {
            return $this->errorResponse('No recipients found', 404);
        }

        $channel = NotificationFactory::make('database');
        $channel->send($recipients, $validated['title'], $validated['message'], [
            'sender_name' => $teacher->name,
            'sender_role' => 'teacher',
        ]);

        $sentNotification = $this->notificationService->logNotification(
            $teacher,
            $validated,
            $recipients->count()
        );

        // Send real-time notifications to parents
        $this->notificationService->sendToParents($recipients, $teacher, $validated);

        return $this->successResponse([
            'message' => 'Notification sent successfully',
            'notification' => $sentNotification
        ]);
    }
    public function markAsRead($id)
    {
        $teacher = $this->getTeacherFromRequest(request());
        $notification = $teacher->notifications()->where('id', $id)->first();

        if ($notification) {
            $notification->markAsRead();
        }

        return $this->successResponse(null, 'Notification marked as read');
    }
}
