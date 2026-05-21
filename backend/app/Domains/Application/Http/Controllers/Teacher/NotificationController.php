<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Teacher;

use App\Domains\Notifications\Factories\NotificationFactory;
use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Teacher\Notification\SendNotificationRequest;
use App\Domains\Application\Http\Requests\Teacher\Notification\StoreVoiceNotificationRequest;
use App\Domains\Notifications\Models\SentNotification;
use App\Domains\Application\Services\Teacher\NotificationService;
use App\Domains\Notifications\Services\NotificationSettingsService;
use App\Domains\Notifications\Services\VoiceNotificationService;
use App\Domains\Subscriptions\Services\StorageQuotaService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    use \App\Domains\Application\Traits\ResolvesTeacher;

    public function __construct(
        private NotificationService $notificationService,
        private VoiceNotificationService $voiceService,
        private NotificationSettingsService $notificationSettings,
        private StorageQuotaService $storageQuota,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        
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

    public function store(SendNotificationRequest $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $validated = $request->validated();

        $recipients = $this->notificationService->getRecipients(
            $teacher,
            $validated['recipient_type'],
            $validated['grade_id'] ?? null,
            $validated['group_id'] ?? null
        );
        $recipients = $this->notificationSettings->filterRecipients($recipients);

        if ($recipients->isEmpty()) {
            return $this->errorResponse('لا يوجد مستلمون متاحون بعد تطبيق إعدادات الإشعارات', 404);
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
    public function checkVoiceLimit(Request $request): JsonResponse
    {
        return $this->successResponse([
            // Voice notifications are no longer count-limited per day.
            // Availability is effectively controlled by storage quota checks on upload.
            'can_send_voice' => true,
            'max_duration' => VoiceNotificationService::MAX_DURATION,
        ]);
    }

    /**
     * Store a voice notification
     */
    public function storeVoice(StoreVoiceNotificationRequest $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);

        try {
            $voiceFile = $request->file('voice');

            // Validate audio file
            $this->voiceService->validateAudioFile(
                $voiceFile,
                (int) $request->input('duration')
            );

            // Get recipients
            $recipients = $this->notificationService->getRecipients(
                $teacher,
                $request->input('recipient_type'),
                $request->input('grade_id'),
                $request->input('group_id')
            );
            $recipients = $this->notificationSettings->filterRecipients($recipients);

            if ($recipients->isEmpty()) {
                return $this->errorResponse('لا يوجد مستلمون متاحون بعد تطبيق إعدادات الإشعارات', 404);
            }

            // Store voice file
            $voicePath = $this->voiceService->storeVoiceFile($voiceFile, $teacher);
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

            // Send to parents
            $this->notificationService->sendToParents($recipients, $teacher, [
                'title' => $request->input('title'),
                'message' => '[رسالة صوتية]',
                'is_voice' => true,
                'voice_url' => $voiceUrl,
                'voice_path' => $voicePath,
                'voice_duration' => (int) $request->input('duration'),
            ]);

            return $this->successResponse([
                'message' => 'تم إرسال الرسالة الصوتية بنجاح',
                'notification' => $sentNotification,
            ]);

        } catch (AuthorizationException $e) {
            return $this->errorResponse($e->getMessage(), 403);
        } catch (\InvalidArgumentException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Voice Notification Error: ' . $e->getMessage(), [
                'teacher_id' => $teacher->id,
                'exception' => $e
            ]);
            
            $message = config('app.debug') 
                ? 'حدث خطأ: ' . $e->getMessage() 
                : 'حدث خطأ أثناء إرسال الرسالة الصوتية';
                
            return $this->errorResponse($message, 500);
        }
    }

    public function markAsRead(Request $request, $id): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $notification = $teacher->notifications()->where('id', $id)->first();

        if ($notification) {
            $notification->markAsRead();
        }

        return $this->successResponse(null, 'Notification marked as read');
    }
}
