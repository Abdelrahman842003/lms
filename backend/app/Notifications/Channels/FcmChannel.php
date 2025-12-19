<?php

namespace App\Notifications\Channels;

use Illuminate\Notifications\Notification;
use Google\Client;
use Illuminate\Support\Facades\Log;

class FcmChannel
{
    protected $client;

    public function __construct()
    {
        // We can initialize client here or per send. 
        // Per send is safer for long running processes to avoid token expiration if not handled.
    }

    public function send($notifiable, Notification $notification)
    {
        $tokens = $notifiable->routeNotificationForFcm();
        if (empty($tokens)) {
            return;
        }

        // Get data from notification
        // We assume toArray returns title and message as per existing notifications
        $data = $notification->toArray($notifiable);
        $title = $data['title'] ?? 'Notification';
        $body = $data['message'] ?? '';
        $customData = $data; // Send all data as custom data

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
            $endpoint = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

            foreach ($tokens as $token) {
                $payload = [
                    'message' => [
                        'token' => $token,
                        'notification' => [
                            'title' => $title,
                            'body' => $body,
                        ],
                        'data' => array_map(function($value) {
                            return is_array($value) ? json_encode($value) : (string) $value;
                        }, $customData),
                    ]
                ];

                try {
                    $httpClient->post($endpoint, ['json' => $payload]);
                } catch (\GuzzleHttp\Exception\ClientException $e) {
                    $response = $e->getResponse();
                    $statusCode = $response->getStatusCode();
                    
                    // Handle invalid token (404 Not Found or 400 Invalid Argument with specific details)
                    if ($statusCode == 404 || $statusCode == 400) {
                        // We can be more specific by parsing the body if needed, but 404 usually means unregistered
                        \App\Models\DeviceToken::where('token', $token)->delete();
                        Log::info("Deleted invalid FCM token: {$token}");
                    } else {
                        Log::error("FCM Send Error for token {$token}: " . $e->getMessage());
                    }
                } catch (\Exception $e) {
                    Log::error("FCM Send Error for token {$token}: " . $e->getMessage());
                }
            }
        } catch (\Exception $e) {
            Log::error("FCM Initialization Error: " . $e->getMessage());
        }
    }

    private function getProjectId($path)
    {
        $json = json_decode(file_get_contents($path), true);
        return $json['project_id'] ?? null;
    }
}
