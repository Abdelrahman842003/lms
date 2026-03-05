<?php

declare(strict_types=1);

namespace App\Domains\Notifications\Channels;

use App\Domains\Notifications\Contracts\NotificationChannelInterface;
use App\Domains\Auth\Models\DeviceToken;
use App\Domains\Notifications\Services\NotificationSettingsService;
use App\Domains\Notifications\Support\FirebaseCredentialsResolver;
use Google\Client;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class FcmChannelStrategy implements NotificationChannelInterface
{
    public function send(mixed $recipients, mixed $titleOrNotification, ?string $message = null, array $data = []): void
    {
        // Strategy-style usage: send(Collection $recipients, string $title, string $message, array $data)
        if ($recipients instanceof Collection && is_string($titleOrNotification) && is_string($message)) {
            $this->sendBulk($recipients, $titleOrNotification, $message, $data);
            return;
        }

        // Laravel channel usage: send(object $notifiable, Notification $notification)
        if (is_object($recipients) && is_object($titleOrNotification)) {
            $this->sendNotifiable($recipients, $titleOrNotification);
            return;
        }

        Log::warning('Invalid FCM send signature usage', [
            'recipients_type' => is_object($recipients) ? $recipients::class : gettype($recipients),
            'title_or_notification_type' => is_object($titleOrNotification) ? $titleOrNotification::class : gettype($titleOrNotification),
        ]);
    }

    private function sendBulk(Collection $recipients, string $title, string $message, array $data = []): void
    {
        /** @var NotificationSettingsService $notificationSettings */
        $notificationSettings = app(NotificationSettingsService::class);

        if (! $notificationSettings->isExternalEnabled()) {
            return;
        }

        $recipients = $notificationSettings->filterRecipients($recipients);

        if ($recipients->isEmpty()) {
            return;
        }

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
            if ($projectId === null) {
                Log::error('Firebase project_id not found in credentials');
                return;
            }

            $endpoint  = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

            foreach ($recipients as $recipient) {
                // Get tokens using the trait method
                $tokens = $recipient->routeNotificationForFcm();

                if (empty($tokens)) {
                    continue;
                }

                foreach ($tokens as $token) {
                    $payload = [
                        'message' => [
                            'token'        => $token,
                            'notification' => [
                                'title' => $title,
                                'body'  => $message,
                            ],
                            'data' => array_map('strval', $data), // FCM data values must be strings
                        ],
                    ];

                    try {
                        $httpClient->post($endpoint, ['json' => $payload]);
                    } catch (\Exception $e) {
                        Log::error("FCM Send Error for token {$token}: " . $e->getMessage());
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error("FCM Initialization Error: " . $e->getMessage());
        }
    }

    private function sendNotifiable(object $notifiable, object $notification): void
    {
        /** @var NotificationSettingsService $notificationSettings */
        $notificationSettings = app(NotificationSettingsService::class);

        if (! $notificationSettings->isExternalEnabled()) {
            return;
        }

        if ($notificationSettings->isRecipientBlocked($notifiable)) {
            return;
        }

        $payload = [];
        if (method_exists($notification, 'toFcm')) {
            $payload = (array) $notification->toFcm($notifiable);
        } elseif (method_exists($notification, 'toArray')) {
            $payload = (array) $notification->toArray($notifiable);
        }

        $title = (string) (
            $payload['title']
            ?? data_get($payload, 'notification.title')
            ?? 'إشعار جديد'
        );
        $message = (string) (
            $payload['message']
            ?? $payload['body']
            ?? data_get($payload, 'notification.body')
            ?? ''
        );

        $data = [];
        if (isset($payload['data']) && is_array($payload['data'])) {
            $data = $payload['data'];
        } elseif (!empty($payload)) {
            $data = $payload;
            unset($data['title'], $data['message'], $data['body'], $data['notification']);
        }

        $tokens = method_exists($notifiable, 'routeNotificationForFcm')
            ? (array) $notifiable->routeNotificationForFcm()
            : [];

        if (empty($tokens)) {
            return;
        }

        $this->sendToTokens($tokens, $title, $message, $data);
    }

    public function sendToTokens(array $tokens, string $title, string $message, array $data = []): void
    {
        /** @var NotificationSettingsService $notificationSettings */
        $notificationSettings = app(NotificationSettingsService::class);

        if (! $notificationSettings->isExternalEnabled()) {
            return;
        }

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
            if ($projectId === null) {
                Log::error('Firebase project_id not found in credentials');
                return;
            }

            $endpoint  = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

            $batchSize = $notificationSettings->maxBatchSize();

            foreach (array_chunk($tokens, $batchSize) as $tokenBatch) {
                $promises = [];

                foreach ($tokenBatch as $token) {
                    $payload = [
                        'message' => [
                            'token'        => $token,
                            'notification' => [
                                'title' => $title,
                                'body'  => $message,
                            ],
                            'data' => array_map(function ($value) {
                                return is_array($value) ? json_encode($value) : (string) $value;
                            }, $data),
                        ],
                    ];

                    $promises[$token] = $httpClient->postAsync($endpoint, ['json' => $payload]);
                }

                // Wait for current batch requests to complete
                $results = \GuzzleHttp\Promise\Utils::settle($promises)->wait();
                foreach ($results as $token => $result) {
                    if ($result['state'] === 'rejected') {
                        $reason = $result['reason'];
                        if ($reason instanceof \GuzzleHttp\Exception\ClientException) {
                            $statusCode = $reason->getResponse()->getStatusCode();
                            if ($statusCode == 404 || $statusCode == 400) {
                                DeviceToken::where('token', $token)->delete();
                                Log::info("Deleted invalid FCM token (Async): {$token}");
                            } else {
                                Log::error("FCM Async Send Error for token {$token}: " . $reason->getMessage());
                            }
                        } else {
                            Log::error("FCM Async Send Error for token {$token}: " . $reason->getMessage());
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error("FCM Initialization Error: " . $e->getMessage());
        }
    }

}
