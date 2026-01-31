<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Factories\NotificationFactory;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Notification\SendNotificationRequest;
use App\Models\Admin;
use App\Models\SentNotification;
use App\Models\Teacher;
use App\Models\Student;
use App\Models\Secretary;
use App\Services\Admin\NotificationService;
use App\Services\Notifications\VoiceNotificationService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class NotificationController extends Controller
{
    use ApiResponseTrait;

    protected $notificationService;
    protected $voiceService;

    public function __construct(NotificationService $notificationService, VoiceNotificationService $voiceService)
    {
        $this->notificationService = $notificationService;
        $this->voiceService = $voiceService;
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
            ->get()
            ->map(function ($notification) {
                if ($notification->is_voice && $notification->voice_path) {
                    $notification->voice_url = $this->voiceService->getVoiceUrl($notification->voice_path);
                }
                return $notification;
            });

        $receivedNotifications = $admin->notifications()
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

    /**
     * Check if admin can send voice notification (always true for admin)
     */
    public function checkVoiceLimit()
    {
        return $this->successResponse([
            'can_send_voice' => true, // Admin always can
            'max_duration' => VoiceNotificationService::MAX_DURATION,
        ]);
    }

    /**
     * Store a voice notification - Admin has no daily limit
     */
    public function storeVoice(Request $request)
    {
        $admin = Auth::user();

        if (!$admin) {
            return $this->errorResponse('Unauthorized', 401);
        }

        // Validate request
        $request->validate([
            'title' => 'required|string|max:255',
            'voice' => 'required|file|max:2048', // max 2MB
            'duration' => 'required|integer|min:1|max:' . VoiceNotificationService::MAX_DURATION,
            'recipient_type' => 'required|in:all_users,all_teachers,all_students,all_secretaries',
        ]);

        try {
            // Validate audio file
            $this->voiceService->validateAudioFile(
                $request->file('voice'),
                (int) $request->input('duration')
            );

            // Get recipients based on type
            $recipientType = $request->input('recipient_type');
            $recipients = collect();

            switch ($recipientType) {
                case 'all_users':
                    $recipients = Teacher::all()
                        ->merge(Student::all())
                        ->merge(Secretary::all());
                    break;
                case 'all_teachers':
                    $recipients = Teacher::all();
                    break;
                case 'all_students':
                    $recipients = Student::all();
                    break;
                case 'all_secretaries':
                    $recipients = Secretary::all();
                    break;
            }

            if ($recipients->isEmpty()) {
                return $this->errorResponse('No recipients found', 404);
            }

            // Store voice file
            $voicePath = $this->voiceService->storeVoiceFile($request->file('voice'), $admin);
            $voiceUrl = $this->voiceService->getVoiceUrl($voicePath);

            // Send notification to recipients
            $channel = NotificationFactory::make('database');
            $channel->send($recipients, $request->input('title'), '[رسالة صوتية]', [
                'sender_name' => 'الإدارة',
                'sender_role' => 'admin',
                'is_voice' => true,
                'voice_url' => $voiceUrl,
                'voice_path' => $voicePath,
                'voice_duration' => (int) $request->input('duration'),
            ]);

            // Log the sent notification
            $sentNotification = SentNotification::create([
                'admin_id' => $admin->id,
                'title' => $request->input('title'),
                'message' => '[رسالة صوتية]',
                'recipient_type' => $recipientType,
                'recipient_count' => $recipients->count(),
                'is_voice' => true,
                'voice_path' => $voicePath,
                'voice_duration' => (int) $request->input('duration'),
            ]);

            return $this->successResponse([
                'message' => 'تم إرسال الرسالة الصوتية بنجاح',
                'notification' => $sentNotification,
            ]);

        } catch (\InvalidArgumentException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        } catch (\Exception $e) {
            Log::error('Voice notification error: ' . $e->getMessage());
            return $this->errorResponse('حدث خطأ أثناء إرسال الرسالة الصوتية', 500);
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
