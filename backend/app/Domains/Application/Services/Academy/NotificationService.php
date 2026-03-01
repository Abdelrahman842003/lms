<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Academy;

use App\Domains\Auth\Models\Academy;
use App\Domains\Notifications\Services\NotificationSettingsService;
use App\Domains\Notifications\Models\AcademyNotification;
use Illuminate\Pagination\LengthAwarePaginator;
use RuntimeException;

class NotificationService
{
    public function __construct(
        private NotificationSettingsService $notificationSettings,
    ) {}

    /**
     * Get academy notifications
     */
    public function getNotifications(
        Academy $academy,
        int $perPage,
        ?string $userId = null,
        ?string $targetType = null
    ): LengthAwarePaginator {
        $query = AcademyNotification::forAcademy($academy->id)
            ->with('creator')
            ->orderBy('created_at', 'desc');

        if ($targetType) {
            $query->where(function ($q) use ($targetType) {
                $q->where('target_type', $targetType)
                  ->orWhere('target_type', 'all');
            });
        }

        if ($userId) {
            // Filter to show only relevant notifications for this user
            $query->where(function ($q) use ($userId) {
                $q->whereJsonDoesntContain('read_by', $userId)
                  ->orWhereNull('read_by');
            });
        }

        return $query->paginate($perPage);
    }

    /**
     * Create notification
     */
    /**
     * Create notification
     */
    public function createNotification(Academy $academy, \App\Domains\Notifications\DTOs\NotificationData $data, ?string $creatorId = null): AcademyNotification
    {
        if (! $this->notificationSettings->isInternalEnabled()) {
            throw new RuntimeException('الإشعارات الداخلية متوقفة من إعدادات النظام.');
        }

        if ($data->target_type === 'teachers' && $this->notificationSettings->isTypeBlocked('teacher')) {
            throw new RuntimeException('إرسال الإشعارات للمعلمين متوقف من إعدادات النظام.');
        }

        if ($data->target_type === 'secretaries' && $this->notificationSettings->isTypeBlocked('secretary')) {
            throw new RuntimeException('إرسال الإشعارات للسكرتيرين متوقف من إعدادات النظام.');
        }

        return AcademyNotification::create([
            'academy_id' => $academy->id,
            'created_by' => $creatorId,
            'title' => $data->title,
            'message' => $data->message,
            'type' => $data->type,
            'target_type' => $data->target_type,
        ]);
    }

    /**
     * Mark notification as read by user
     */
    public function markAsRead(string $notificationId, string $userId): AcademyNotification
    {
        $notification = AcademyNotification::findOrFail($notificationId);
        $notification->markAsReadBy($userId);

        return $notification->fresh();
    }

    /**
     * Send notification to all teachers in academy
     */
    public function sendToTeachers(Academy $academy, string $title, string $message, string $type = 'info', ?string $creatorId = null): AcademyNotification
    {
        $data = new \App\Domains\Notifications\DTOs\NotificationData(
            title: $title,
            message: $message,
            type: $type,
            target_type: 'teachers'
        );
        return $this->createNotification($academy, $data, $creatorId);
    }

    /**
     * Send notification to all secretaries in academy
     */
    public function sendToSecretaries(Academy $academy, string $title, string $message, string $type = 'info', ?string $creatorId = null): AcademyNotification
    {
        $data = new \App\Domains\Notifications\DTOs\NotificationData(
            title: $title,
            message: $message,
            type: $type,
            target_type: 'secretaries'
        );
        return $this->createNotification($academy, $data, $creatorId);
    }

    /**
     * Get unread count for user
     */
    public function getUnreadCount(Academy $academy, string $userId, ?string $targetType = null): int
    {
        $query = AcademyNotification::forAcademy($academy->id)
            ->unreadBy($userId);

        if ($targetType) {
            $query->where(function ($q) use ($targetType) {
                $q->where('target_type', $targetType)
                  ->orWhere('target_type', 'all');
            });
        }

        return $query->count();
    }
}
