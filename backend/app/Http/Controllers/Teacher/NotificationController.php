<?php

namespace App\Http\Controllers\Teacher;

use App\Factories\NotificationFactory;
use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\Notification\SendNotificationRequest;
use App\Models\SentNotification;
use App\Services\Teacher\NotificationService;
use App\Services\VoiceNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class NotificationController extends Controller
{
    use \App\Traits\ResolvesTeacher;
    protected $notificationService;
    protected $voiceService;

    public function __construct(NotificationService $notificationService, VoiceNotificationService $voiceService)
    {
        $this->notificationService = $notificationService;
        $this->voiceService = $voiceService;
    }

    public function index()
    {
        $teacher = $this->getTeacherFromRequest(request());
        
        $notifications = SentNotification::where('teacher_id', $teacher->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($notification) {
                if ($notification->is_voice && $notification->voice_path) {
                    $notification->voice_url = $this->voiceService->getVoiceUrl($notification->voice_path);
                }
                return $notification;
            });

        $receivedNotifications = $teacher->notifications()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($notification) {
                $data = $notification->data;
                if (isset($data['is_voice']) && $data['is_voice']) {
                    $notification->is_voice = true;
                    $notification->voice_url = $data['voice_url'] ?? null;
                    $notification->voice_duration = $data['voice_duration'] ?? null;
                }
                return $notification;
            });

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

    /**
     * Check if teacher can send voice notification today
     */
    public function checkVoiceLimit()
    {
        $teacher = $this->getTeacherFromRequest(request());
        $canSend = $this->voiceService->canUserSendVoice($teacher);

        return $this->successResponse([
            'can_send_voice' => $canSend,
            'max_duration' => VoiceNotificationService::MAX_DURATION,
        ]);
    }

    /**
     * Store a voice notification
     */
    public function storeVoice(Request $request)
    {
        $teacher = $this->getTeacherFromRequest(request());

        // Check daily limit
        if (!$this->voiceService->canUserSendVoice($teacher)) {
            return $this->errorResponse('لقد استنفدت الحصة اليومية للرسائل الصوتية. حاول مرة أخرى غداً.', 429);
        }

        // Validate request
        $request->validate([
            'title' => 'required|string|max:255',
            'voice' => 'required|file|max:2048', // max 2MB
            'duration' => 'required|integer|min:1|max:' . VoiceNotificationService::MAX_DURATION,
            'recipient_type' => 'required|in:all,grade,group,admin',
            'grade_id' => 'required_if:recipient_type,grade|exists:grades,id',
            'group_id' => 'required_if:recipient_type,group|exists:groups,id',
        ]);

        try {
            // Validate audio file
            $this->voiceService->validateAudioFile(
                $request->file('voice'),
                (int) $request->input('duration')
            );

            // Get recipients
            $recipients = $this->notificationService->getRecipients(
                $teacher,
                $request->input('recipient_type'),
                $request->input('grade_id'),
                $request->input('group_id')
            );

            if ($recipients->isEmpty()) {
                return $this->errorResponse('No recipients found', 404);
            }

            // Store voice file
            $voicePath = $this->voiceService->storeVoiceFile($request->file('voice'), $teacher);
            $voiceUrl = $this->voiceService->getVoiceUrl($voicePath);

            // Send notification to recipients
            $channel = NotificationFactory::make('database');
            $channel->send($recipients, $request->input('title'), '[رسالة صوتية]', [
                'sender_name' => $teacher->name,
                'sender_role' => 'teacher',
                'is_voice' => true,
                'voice_url' => $voiceUrl,
                'voice_duration' => (int) $request->input('duration'),
            ]);

            // Log the sent notification
            $sentNotification = SentNotification::create([
                'teacher_id' => $teacher->id,
                'title' => $request->input('title'),
                'message' => '[رسالة صوتية]',
                'recipient_type' => $request->input('recipient_type'),
                'recipient_count' => $recipients->count(),
                'is_voice' => true,
                'voice_path' => $voicePath,
                'voice_duration' => (int) $request->input('duration'),
            ]);

            // Mark daily limit as used
            $this->voiceService->markDailyLimitUsed($teacher);

            // Send to parents
            $this->notificationService->sendToParents($recipients, $teacher, [
                'title' => $request->input('title'),
                'message' => '[رسالة صوتية]',
                'is_voice' => true,
                'voice_url' => $voiceUrl,
                'voice_duration' => (int) $request->input('duration'),
            ]);

            return $this->successResponse([
                'message' => 'تم إرسال الرسالة الصوتية بنجاح',
                'notification' => $sentNotification,
            ]);

        } catch (\InvalidArgumentException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        } catch (\Exception $e) {
            return $this->errorResponse('حدث خطأ أثناء إرسال الرسالة الصوتية', 500);
        }
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
