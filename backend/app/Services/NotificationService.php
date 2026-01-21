<?php

namespace App\Services;

use App\Events\NewNotificationEvent;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Google\Client;

class NotificationService
{
    /**
     * Send hybrid notification (Reverb + FCM)
     *
     * @param object $notifiable The user to notify (Student, Teacher, Admin)
     * @param string $userType Type of user ('student', 'teacher', 'admin')
     * @param string $title Notification title
     * @param string $message Notification message
     * @param array $data Additional data
     * @param string $type Notification type
     * @param bool $sendFcm Whether to send FCM notification
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

        // 1. Store in database
        try {
            $notifiable->notifications()->create([
                'id' => $notificationId,
                'type' => 'App\\Notifications\\' . ucfirst($userType) . 'Notification',
                'data' => [
                    'title' => $title,
                    'message' => $message,
                    'type' => $type,
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

        // 3. Send FCM for offline/background users
        if ($sendFcm) {
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
            'title' => $title,
            'message' => $message,
            'type' => $type,
            ...$data,
        ];

        $credentialsPath = config('services.firebase.credentials')
            ?? env('GOOGLE_APPLICATION_CREDENTIALS')
            ?? storage_path('firebase-credentials.json');

        if (!file_exists($credentialsPath)) {
            Log::error("Firebase credentials not found at: {$credentialsPath}");
            return;
        }

        try {
            $client = new Client();
            $client->setAuthConfig($credentialsPath);
            $client->addScope('https://www.googleapis.com/auth/firebase.messaging');
            $httpClient = $client->authorize();

            $json = json_decode(file_get_contents($credentialsPath), true);
            $projectId = $json['project_id'] ?? null;
            
            if (!$projectId) {
                Log::error("Firebase project_id not found in credentials");
                return;
            }
            
            $endpoint = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

            foreach ($tokens as $token) {
                $payload = [
                    'message' => [
                        'token' => $token,
                        'notification' => [
                            'title' => $title,
                            'body' => $message,
                        ],
                        'data' => array_map(fn($v) => is_array($v) ? json_encode($v) : (string) $v, $fcmData),
                    ]
                ];

                try {
                    $httpClient->post($endpoint, ['json' => $payload]);
                    Log::info("FCM notification sent to token: " . substr($token, 0, 20) . "...");
                } catch (\GuzzleHttp\Exception\ClientException $e) {
                    $statusCode = $e->getResponse()->getStatusCode();
                    
                    // Handle invalid token
                    if ($statusCode == 404 || $statusCode == 400) {
                        \App\Models\DeviceToken::where('token', $token)->delete();
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

        foreach ($notifiables as $notifiable) {
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

        return $notificationIds;
    }

    /**
     * Send notification to parent(s) of a student
     * 
     * @param \App\Models\Student $student The student whose parent should be notified
     * @param string $title Notification title
     * @param string $message Notification message
     * @param array $data Additional data
     * @param string $type Notification type
     * @return void
     */
    public function sendToParent(
        \App\Models\Student $student,
        string $title,
        string $message,
        array $data = [],
        string $type = 'general',
        bool $skipDb = false
    ): void {
        $parentPhone = $student->parent_phone;
        
        if (empty($parentPhone)) {
            Log::info("Student {$student->id} has no parent_phone, skipping parent notification");
            return;
        }

        // Add child name to the notification data
        $data['child_id'] = $student->id;
        $data['child_name'] = $student->name;

        // Store notification in student's notifications (parent will aggregate from children)
        $notificationId = Str::uuid()->toString();
        
        if (!$skipDb) {
            try {
                $student->notifications()->create([
                    'id' => $notificationId,
                    'type' => 'App\\Notifications\\ParentNotification',
                    'data' => [
                        'title' => $title,
                        'message' => $message,
                        'type' => $type,
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
        // Fix: Use Guardian ID if available, otherwise fallback to phone (though frontend expects ID)
        $guardian = \App\Models\Guardian::where('phone', $parentPhone)->first();
        $broadcastUserId = $guardian ? $guardian->id : $parentPhone;

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

        // Send FCM to parent
        try {
            $this->sendFcmToParent($parentPhone, $notificationId, $title, $message, $data, $type);
        } catch (\Exception $e) {
            Log::error("FCM to parent failed: " . $e->getMessage());
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
        $tokens = \App\Models\ParentDeviceToken::getTokensForPhone($parentPhone);

        if (empty($tokens)) {
            Log::info("No FCM tokens found for parent phone: " . substr($parentPhone, 0, 5) . "...");
            return;
        }

        $fcmData = [
            'notification_id' => $notificationId,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            ...$data,
        ];

        $credentialsPath = config('services.firebase.credentials')
            ?? env('GOOGLE_APPLICATION_CREDENTIALS')
            ?? storage_path('firebase-credentials.json');

        if (!file_exists($credentialsPath)) {
            Log::error("Firebase credentials not found at: {$credentialsPath}");
            return;
        }

        try {
            $client = new Client();
            $client->setAuthConfig($credentialsPath);
            $client->addScope('https://www.googleapis.com/auth/firebase.messaging');
            $httpClient = $client->authorize();

            $json = json_decode(file_get_contents($credentialsPath), true);
            $projectId = $json['project_id'] ?? null;

            if (!$projectId) {
                Log::error("Firebase project_id not found in credentials");
                return;
            }

            $endpoint = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

            foreach ($tokens as $token) {
                $payload = [
                    'message' => [
                        'token' => $token,
                        'notification' => [
                            'title' => $title,
                            'body' => $message,
                        ],
                        'data' => array_map(fn($v) => is_array($v) ? json_encode($v) : (string) $v, $fcmData),
                    ]
                ];

                try {
                    $httpClient->post($endpoint, ['json' => $payload]);
                    Log::info("FCM notification sent to parent token: " . substr($token, 0, 20) . "...");
                } catch (\GuzzleHttp\Exception\ClientException $e) {
                    $statusCode = $e->getResponse()->getStatusCode();

                    if ($statusCode == 404 || $statusCode == 400) {
                        \App\Models\ParentDeviceToken::removeToken($token);
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
