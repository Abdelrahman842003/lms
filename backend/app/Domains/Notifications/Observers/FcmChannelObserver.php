<?php

declare(strict_types=1);

namespace App\Domains\Notifications\Observers;

use App\Domains\Auth\Models\DeviceToken;
use App\Domains\Notifications\Events\NotificationSentEvent;
use App\Domains\Notifications\Support\FirebaseCredentialsResolver;
use Google\Client;
use Illuminate\Support\Facades\Log;

/**
 * Observer that sends notifications via Firebase Cloud Messaging (FCM).
 * 
 * @see https://refactoring.guru/design-patterns/observer
 */
class FcmChannelObserver implements NotificationChannelObserverInterface
{
    /**
     * Handle the notification sent event by sending via FCM.
     */
    public function handle(NotificationSentEvent $event): void
    {
        if (!$this->shouldHandle($event)) {
            return;
        }

        $tokens = method_exists($event->notifiable, 'routeNotificationForFcm')
            ? $event->notifiable->routeNotificationForFcm()
            : [];

        if (empty($tokens)) {
            Log::info('No FCM tokens found for user', [
                'notification_id' => $event->notificationId,
            ]);
            return;
        }

        $this->sendFcm(
            $tokens,
            $event->notificationId,
            $event->title,
            $event->message,
            $event->data,
            $event->type
        );
    }

    /**
     * Check if this observer should handle the event.
     */
    public function shouldHandle(NotificationSentEvent $event): bool
    {
        return $event->fcmSent && $event->wasSentVia('fcm');
    }

    /**
     * Send FCM notification to the given tokens.
     *
     * @param array<string> $tokens
     */
    protected function sendFcm(
        array $tokens,
        string $notificationId,
        string $title,
        string $message,
        array $data,
        string $type
    ): void {
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
                Log::error('Firebase project_id not found in credentials');
                return;
            }

            $endpoint = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

            foreach ($tokens as $token) {
                $this->sendFcmToToken($httpClient, $endpoint, $token, $fcmData, $title, $message);
            }
        } catch (\Exception $e) {
            Log::error('FCM initialization error: ' . $e->getMessage());
        }
    }

    /**
     * Send FCM notification to a single token.
     */
    protected function sendFcmToToken(
        $httpClient,
        string $endpoint,
        string $token,
        array $fcmData,
        string $title,
        string $message
    ): void {
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
            Log::info('FCM notification sent', ['token_hash' => hash('sha256', $token)]);
        } catch (\GuzzleHttp\Exception\ClientException $e) {
            $this->handleFcmError($e, $token);
        } catch (\Exception $e) {
            Log::error('FCM error for token: ' . $e->getMessage());
        }
    }

    /**
     * Handle FCM errors and clean up invalid tokens.
     */
    protected function handleFcmError(\GuzzleHttp\Exception\ClientException $e, string $token): void
    {
        $statusCode = $e->getResponse()->getStatusCode();

        // Handle invalid token
        if ($statusCode == 404 || $statusCode == 400) {
            DeviceToken::where('token', $token)->delete();
            Log::info('Deleted invalid FCM token', ['token_hash' => hash('sha256', $token)]);
        } else {
            Log::error('FCM error for token: ' . $e->getMessage());
        }
    }
}
