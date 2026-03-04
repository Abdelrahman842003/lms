<?php

declare(strict_types=1);

namespace App\Domains\Notifications\Services;

use App\Domains\Notifications\Events\NewNotificationEvent;
use App\Domains\Auth\Models\DeviceToken;
use App\Domains\Auth\Models\Guardian;
use App\Domains\Auth\Models\ParentDeviceToken;
use App\Domains\Auth\Models\Student;
use App\Domains\Notifications\Support\FirebaseCredentialsResolver;
use Google\Client;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class NotificationService
{
    public function __construct(
        private NotificationSettingsService $notificationSettings,
    ) {}

    /**
     * Send hybrid notification (Reverb + FCM)
     *
     * @param object $notifiable The user to notify (Student, Teacher, Admin)
     * @param string $userType   Type of user ('student', 'teacher', 'admin')
     * @param string $title      Notification title
     * @param string $message    Notification message
     * @param array  $data       Additional data
     * @param string $type       Notification type
     * @param bool   $sendFcm   Whether to send FCM notification
     * @return string The notification ID
     */
    public function send(
        object $notifiable,
        string $userType,
        string $title,
        string $message,
        array $data = [],
        string $type = 'general',
        bool $sendFcm = true
    ): string {
        // Generate unique notification ID for deduplication
        $notificationId = Str::uuid()->toString();
        $sendInternal = $this->notificationSettings->isInternalEnabled();
        $sendExternal = $sendFcm && $this->notificationSettings->isExternalEnabled();

        if ($this->notificationSettings->isRecipientBlocked($notifiable)) {
            Log::info('Notification skipped for blocked recipient', [
                'recipient_class' => get_class($notifiable),
                'recipient_id' => (string) ($notifiable->id ?? ''),
                'notification_id' => $notificationId,
            ]);

            return $notificationId;
        }

        if (! $sendInternal && ! $sendExternal) {
            Log::info('Notification skipped because all channels are disabled', [
                'notification_id' => $notificationId,
            ]);

            return $notificationId;
        }

        if ($sendInternal) {
            // 1. Store in database
            try {
                $notifiable->notifications()->create([
                    'id'   => $notificationId,
                    'type' => 'App\\Notifications\\' . ucfirst($userType) . 'Notification',
                    'data' => [
                        'title'   => $title,
                        'message' => $message,
                        'type'    => $type,
                        ...$data,
                    ],
                    'read_at' => null,
                ]);
            } catch (\Exception $e) {
                Log::error("Failed to store notification in database: " . $e->getMessage());
            }

            // 2. Broadcast via Reverb (real-time for online users)
            try {
                broadcast(new NewNotificationEvent(
                    userId: (string) $notifiable->id,
                    userType: $userType,
                    notificationId: $notificationId,
                    title: $title,
                    message: $message,
                    data: $data,
                    type: $type,
                ));

                Log::info("Reverb notification sent: {$notificationId}");
            } catch (\Exception $e) {
                Log::error("Reverb broadcast failed: " . $e->getMessage());
            }
        }

        // 3. Send FCM for offline/background users
        if ($sendExternal) {
            try {
                $this->sendFcm($notifiable, $notificationId, $title, $message, $data, $type);
            } catch (\Exception $e) {
                Log::error("FCM send failed: " . $e->getMessage());
            }
        }

        return $notificationId;
    }

    /**
     * Send FCM notification
     */
    protected function sendFcm(
        object $notifiable,
        string $notificationId,
        string $title,
        string $message,
        array $data,
        string $type
    ): void {
        $tokens = method_exists($notifiable, 'routeNotificationForFcm')
            ? $notifiable->routeNotificationForFcm()
            : [];

        if (empty($tokens)) {
            Log::info("No FCM tokens found for user");
            return;
        }

        // Include notification_id in FCM data for deduplication
        $fcmData = [
            'notification_id' => $notificationId,
            'title'           => $title,
            'message'         => $message,
            'type'            => $type,
            ...$data,
        ];

        $credentials = FirebaseCredentialsResolver::resolve();

        if ($credentials === null) {
            Log::error('Firebase credentials are not configured');
            return;
        }

        try {
            $client = new Client();
            $client->setAuthConfig($credentials['auth_config']);
            $client->addScope('https://www.googleapis.com/auth/firebase.messaging');
            $httpClient = $client->authorize();

            $projectId = $credentials['project_id'] ?: null;

            if (!$projectId) {
                Log::error("Firebase project_id not found in credentials");
                return;
            }

            $endpoint = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

            foreach ($tokens as $token) {
                $payload = [
                    'message' => [
                        'token'        => $token,
                        'notification' => [
                            'title' => $title,
                            'body'  => $message,
                        ],
                        'data' => array_map(fn($v) => is_array($v) ? json_encode($v) : (string) $v, $fcmData),
                    ],
                ];

                try {
                    $httpClient->post($endpoint, ['json' => $payload]);
                    Log::info("FCM notification sent to token: " . substr($token, 0, 20) . "...");
                } catch (\GuzzleHttp\Exception\ClientException $e) {
                    $statusCode = $e->getResponse()->getStatusCode();

                    // Handle invalid token
                    if ($statusCode == 404 || $statusCode == 400) {
                        DeviceToken::where('token', $token)->delete();
                        Log::info("Deleted invalid FCM token: " . substr($token, 0, 20) . "...");
                    } else {
                        Log::error("FCM error for token: " . $e->getMessage());
                    }
                } catch (\Exception $e) {
                    Log::error("FCM error for token: " . $e->getMessage());
                }
            }
        } catch (\Exception $e) {
            Log::error("FCM initialization error: " . $e->getMessage());
        }
    }

    /**
     * Send notification to multiple users
     */
    public function sendToMany(
        iterable $notifiables,
        string $userType,
        string $title,
        string $message,
        array $data = [],
        string $type = 'general',
        bool $sendFcm = true
    ): array {
        $notificationIds = [];
        $batchSize = $this->notificationSettings->maxBatchSize();
        $allowedRecipients = $this->notificationSettings->filterRecipients($notifiables);

        foreach ($allowedRecipients->chunk($batchSize) as $recipientChunk) {
            foreach ($recipientChunk as $notifiable) {
                $notificationIds[] = $this->send(
                    $notifiable,
                    $userType,
                    $title,
                    $message,
                    $data,
                    $type,
                    $sendFcm
                );
            }
        }

        return $notificationIds;
    }

    /**
     * Send notification to parent(s) of a student
     *
     * @param Student $student The student whose parent should be notified
     * @param string  $title   Notification title
     * @param string  $message Notification message
     * @param array   $data    Additional data
     * @param string  $type    Notification type
     * @return void
     */
    public function sendToParent(
        Student $student,
        string $title,
        string $message,
        array $data = [],
        string $type = 'general',
        bool $skipDb = false
    ): void {
        $parentPhone = $student->parent_phone;
        $sendInternal = $this->notificationSettings->isInternalEnabled();
        $sendExternal = $this->notificationSettings->isExternalEnabled();

        if (empty($parentPhone)) {
            Log::info("Student {$student->id} has no parent_phone, skipping parent notification");
            return;
        }

        if ($this->notificationSettings->isTypeBlocked('guardian')) {
            Log::info("Parent notification skipped because guardian category is blocked");
            return;
        }

        $guardian = Guardian::where('phone', $parentPhone)->first();

        if ($guardian && $this->notificationSettings->isRecipientBlocked($guardian)) {
            Log::info("Parent notification skipped for blocked guardian: {$guardian->id}");
            return;
        }

        if (! $sendInternal && ! $sendExternal) {
            Log::info("Parent notification skipped because all channels are disabled");
            return;
        }

        // Add child name to the notification data
        $data['child_id']   = $student->id;
        $data['child_name'] = $student->name;

        // Store notification in student's notifications (parent will aggregate from children)
        $notificationId = Str::uuid()->toString();

        if ($sendInternal && ! $skipDb) {
            try {
                $student->notifications()->create([
                    'id'   => $notificationId,
                    'type' => 'App\\Notifications\\ParentNotification',
                    'data' => [
                        'title'      => $title,
                        'message'    => $message,
                        'type'       => $type,
                        'for_parent' => true,
                        ...$data,
                    ],
                    'read_at' => null,
                ]);
            } catch (\Exception $e) {
                Log::error("Failed to store parent notification: " . $e->getMessage());
            }
        }

        // Broadcast via Reverb for parent's channel
        // Use Guardian ID if available, otherwise fallback to phone
        $broadcastUserId = $guardian ? $guardian->id : $parentPhone;

        if ($sendInternal) {
            try {
                broadcast(new NewNotificationEvent(
                    userId: $broadcastUserId,
                    userType: 'parent',
                    notificationId: $notificationId,
                    title: $title,
                    message: $message,
                    data: $data,
                    type: $type,
                ));
            } catch (\Exception $e) {
                Log::error("Reverb broadcast to parent failed: " . $e->getMessage());
            }
        }

        // Send FCM to parent
        if ($sendExternal) {
            try {
                $this->sendFcmToParent($parentPhone, $notificationId, $title, $message, $data, $type);
            } catch (\Exception $e) {
                Log::error("FCM to parent failed: " . $e->getMessage());
            }
        }
    }

    /**
     * Send FCM notification to parent by phone
     */
    protected function sendFcmToParent(
        string $parentPhone,
        string $notificationId,
        string $title,
        string $message,
        array $data,
        string $type
    ): void {
        $tokens = ParentDeviceToken::getTokensForPhone($parentPhone);

        if (empty($tokens)) {
            Log::info("No FCM tokens found for parent phone: " . substr($parentPhone, 0, 5) . "...");
            return;
        }

        $fcmData = [
            'notification_id' => $notificationId,
            'title'           => $title,
            'message'         => $message,
            'type'            => $type,
            ...$data,
        ];

        $credentials = FirebaseCredentialsResolver::resolve();

        if ($credentials === null) {
            Log::error('Firebase credentials are not configured');
            return;
        }

        try {
            $client = new Client();
            $client->setAuthConfig($credentials['auth_config']);
            $client->addScope('https://www.googleapis.com/auth/firebase.messaging');
            $httpClient = $client->authorize();

            $projectId = $credentials['project_id'] ?: null;

            if (!$projectId) {
                Log::error("Firebase project_id not found in credentials");
                return;
            }

            $endpoint = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

            foreach ($tokens as $token) {
                $payload = [
                    'message' => [
                        'token'        => $token,
                        'notification' => [
                            'title' => $title,
                            'body'  => $message,
                        ],
                        'data' => array_map(fn($v) => is_array($v) ? json_encode($v) : (string) $v, $fcmData),
                    ],
                ];

                try {
                    $httpClient->post($endpoint, ['json' => $payload]);
                    Log::info("FCM notification sent to parent token: " . substr($token, 0, 20) . "...");
                } catch (\GuzzleHttp\Exception\ClientException $e) {
                    $statusCode = $e->getResponse()->getStatusCode();

                    if ($statusCode == 404 || $statusCode == 400) {
                        ParentDeviceToken::removeToken($token);
                        Log::info("Deleted invalid parent FCM token: " . substr($token, 0, 20) . "...");
                    } else {
                        Log::error("FCM error for parent token: " . $e->getMessage());
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error("FCM initialization error for parent: " . $e->getMessage());
        }
    }

    /**
     * Send notification to all parents of multiple students
     */
    public function sendToParents(
        iterable $students,
        string $title,
        string $message,
        array $data = [],
        string $type = 'general'
    ): void {
        foreach ($students as $student) {
            $this->sendToParent($student, $title, $message, $data, $type);
        }
    }
}
