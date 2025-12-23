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

        $credentials = config('services.firebase.credentials') 
            ?? env('GOOGLE_APPLICATION_CREDENTIALS')
            ?? storage_path('firebase-credentials.json');
        
        // Check if credentials is JSON content or file path
        $credentialsArray = null;
        if (is_string($credentials) && (str_starts_with(trim($credentials), '{') || str_starts_with(trim($credentials), '['))) {
            // It's JSON content from Docker secret
            $credentialsArray = json_decode($credentials, true);
            Log::info("Using Firebase credentials from Docker secret");
        } elseif (file_exists($credentials)) {
            // It's a file path
            $credentialsArray = json_decode(file_get_contents($credentials), true);
            Log::info("Using Firebase credentials from file: " . $credentials);
        } else {
            Log::error("Firebase credentials not found or invalid");
            return;
        }

        try {
            $client = new Client();
            $client->setAuthConfig($credentialsArray);
            $client->addScope('https://www.googleapis.com/auth/firebase.messaging');
            $httpClient = $client->authorize();

            $projectId = $credentialsArray['project_id'] ?? null;
            $endpoint = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

            foreach ($tokens as $token) {
                $payload = [
                    'message' => [
                        'token' => $token,
                        'notification' => [
                            'title' => $title,
                            'body' => $body,
                            'icon' => 'https://neetaq.com/logo.png',
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


}
