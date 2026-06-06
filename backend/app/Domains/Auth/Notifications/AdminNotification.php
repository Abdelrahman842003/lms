<?php

declare(strict_types=1);

namespace App\Domains\Auth\Notifications;

use App\Domains\Notifications\Services\NotificationSettingsService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Notification;

class AdminNotification extends Notification implements ShouldBroadcast
{
    use Queueable;

    public $title;
    public $message;
    public $senderName;
    public $senderRole;
    public $data;

    /**
     * Create a new notification instance.
     */
    public function __construct($title, $message, $senderName, $senderRole, $data = [])
    {
        $this->title = $title;
        $this->message = $message;
        $this->senderName = $senderName;
        $this->senderRole = $senderRole;
        $this->data = $data;
    }

    public function via(object $notifiable): array
    {
        return app(NotificationSettingsService::class)->channelsFor(
            $notifiable,
            ['database', 'broadcast'],
            true
        );
    }

    /**
     * Get the array representation of the notification for the database.
     *
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        $notification = \Filament\Notifications\Notification::make()
            ->title($this->title)
            ->body($this->message . "\n\n" . 'من: ' . $this->senderName . ' (' . $this->senderRole . ')')
            ->icon('heroicon-o-bell');

        if (isset($this->data['is_voice']) && $this->data['is_voice']) {
            $notification->icon('heroicon-o-speaker-wave')
                ->actions([
                    \Filament\Actions\Action::make('listen')
                        ->label('استماع للرسالة الصوتية')
                        ->url($this->data['voice_url'])
                        ->openUrlInNewTab(),
                ]);
        }

        return $notification->getDatabaseMessage();
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return array_merge([
            'title' => $this->title,
            'message' => $this->message,
            'sender_name' => $this->senderName,
            'sender_role' => $this->senderRole,
        ], $this->data);
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): \Illuminate\Notifications\Messages\BroadcastMessage
    {
        return (new \Illuminate\Notifications\Messages\BroadcastMessage([
            'notification_id' => $this->id,
            'title' => $this->title,
            'message' => $this->message,
            'sender_name' => $this->senderName,
            'sender_role' => $this->senderRole,
            'data' => $this->data,
            'created_at' => now()->toISOString(),
        ]))->onQueue('notifications');
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'new.notification';
    }
}
