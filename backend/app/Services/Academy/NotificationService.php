<?php

declare(strict_types=1);

namespace App\Services\Academy;

use App\Models\Academy;
use App\Models\AcademyNotification;
use Illuminate\Pagination\LengthAwarePaginator;

class NotificationService
{
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
    public function createNotification(Academy $academy, \App\DTOs\Academy\NotificationData $data, ?string $creatorId = null): AcademyNotification
    {
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
        $data = new \App\DTOs\Academy\NotificationData(
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
        $data = new \App\DTOs\Academy\NotificationData(
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
