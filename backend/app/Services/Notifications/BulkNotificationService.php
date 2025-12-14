<?php

namespace App\Services\Notifications;

use App\Jobs\SendBulkNotificationJob;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class BulkNotificationService
{
    public function send(Builder $query, string $title, string $message, array $data = [])
    {
        // Chunk the query to avoid memory issues
        $query->chunk(1000, function ($users) use ($title, $message, $data) {
            $tokens = [];
            $notificationsData = [];
            $now = now();
            
            foreach ($users as $user) {
                // Collect tokens for FCM
                if (method_exists($user, 'deviceTokens')) {
                    $userTokens = $user->deviceTokens->pluck('token')->toArray();
                    $tokens = array_merge($tokens, $userTokens);
                }

                // Prepare data for database insertion
                $notificationsData[] = [
                    'id' => \Illuminate\Support\Str::uuid()->toString(),
                    'type' => 'App\Notifications\AdminNotification',
                    'notifiable_type' => get_class($user),
                    'notifiable_id' => $user->id,
                    'data' => json_encode([
                        'title' => $title,
                        'message' => $message,
                        'sender_name' => $data['sender_name'] ?? 'System',
                        'sender_role' => $data['sender_role'] ?? 'admin',
                    ]),
                    'read_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            // Bulk insert into database
            if (!empty($notificationsData)) {
                \Illuminate\Support\Facades\DB::table('notifications')->insert($notificationsData);
            }

            // Dispatch FCM Job
            if (!empty($tokens)) {
                foreach (array_chunk($tokens, 500) as $tokenChunk) {
                    SendBulkNotificationJob::dispatch($tokenChunk, $title, $message, $data);
                }
            }
        });
    }
}
