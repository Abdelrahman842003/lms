<?php

declare(strict_types=1);

namespace App\Domains\Notifications\Services;

use App\Domains\Notifications\Events\NewNotificationEvent;
use App\Domains\Notifications\Jobs\SendBulkNotificationJob;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class BulkNotificationService
{
    public function send(Builder $query, string $title, string $message, array $data = [])
    {
        // Chunk the query to avoid memory issues
        $query->chunk(1000, function ($users) use ($title, $message, $data) {
            $tokens            = [];
            $notificationsData = [];
            $now               = now();

            foreach ($users as $user) {
                $notificationId = Str::uuid()->toString();

                // Determine user type from class name
                $userType = strtolower(class_basename($user));

                // Collect tokens for FCM
                if (method_exists($user, 'deviceTokens')) {
                    $userTokens = $user->deviceTokens->pluck('token')->toArray();
                    $tokens     = array_merge($tokens, $userTokens);
                }

                // Prepare data for database insertion
                $notificationsData[] = [
                    'id'              => $notificationId,
                    'type'            => 'App\Notifications\AdminNotification',
                    'notifiable_type' => get_class($user),
                    'notifiable_id'   => $user->id,
                    'data'            => json_encode([
                        'title'       => $title,
                        'message'     => $message,
                        'sender_name' => $data['sender_name'] ?? 'System',
                        'sender_role' => $data['sender_role'] ?? 'admin',
                    ]),
                    'read_at'    => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                // Broadcast via Reverb for real-time (online users)
                try {
                    broadcast(new NewNotificationEvent(
                        userId: (string) $user->id,
                        userType: $userType,
                        notificationId: $notificationId,
                        title: $title,
                        message: $message,
                        data: $data,
                        type: 'admin_notification'
                    ));
                } catch (\Exception $e) {
                    Log::error("Reverb broadcast failed for {$userType}:{$user->id}: " . $e->getMessage());
                }
            }

            // Bulk insert into database
            if (!empty($notificationsData)) {
                DB::table('notifications')->insert($notificationsData);
            }

            // Dispatch FCM Job for offline/background users
            if (!empty($tokens)) {
                foreach (array_chunk($tokens, 500) as $tokenChunk) {
                    SendBulkNotificationJob::dispatch($tokenChunk, $title, $message, $data);
                }
            }
        });
    }
}
