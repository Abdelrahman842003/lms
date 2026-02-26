<?php

declare(strict_types=1);

namespace App\Domains\Notifications\Channels;

use App\Domains\Notifications\Contracts\NotificationChannelInterface;
use App\Domains\Auth\Models\DeviceToken;
use Google\Client;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class FcmChannelStrategy implements NotificationChannelInterface
{
    public function send(Collection $recipients, string $title, string $message, array $data = []): void
    {
        // Get credentials path from config or fallback to storage
        $credentialsPath = config('services.firebase.credentials')
            ?? env('GOOGLE_APPLICATION_CREDENTIALS')
            ?? storage_path('firebase-credentials.json');

        if (!file_exists($credentialsPath)) {
            Log::error("Firebase credentials not found at: " . $credentialsPath);
            return;
        }

        try {
            $client = new Client();
            $client->setAuthConfig($credentialsPath);
            $client->addScope('https://www.googleapis.com/auth/firebase.messaging');
            $httpClient = $client->authorize();

            $projectId = $this->getProjectId($credentialsPath);
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

    public function sendToTokens(array $tokens, string $title, string $message, array $data = []): void
    {
        $credentialsPath = config('services.firebase.credentials')
            ?? env('GOOGLE_APPLICATION_CREDENTIALS')
            ?? storage_path('firebase-credentials.json');

        if (!file_exists($credentialsPath)) {
            Log::error("Firebase credentials not found at: " . $credentialsPath);
            return;
        }

        try {
            $client = new Client();
            $client->setAuthConfig($credentialsPath);
            $client->addScope('https://www.googleapis.com/auth/firebase.messaging');
            $httpClient = $client->authorize();

            $projectId = $this->getProjectId($credentialsPath);
            $endpoint  = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

            $promises = [];
            foreach ($tokens as $token) {
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

            // Wait for all requests to complete
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
        } catch (\Exception $e) {
            Log::error("FCM Initialization Error: " . $e->getMessage());
        }
    }

    private function getProjectId(string $path): ?string
    {
        $json = json_decode(file_get_contents($path), true);
        return $json['project_id'] ?? null;
    }
}
