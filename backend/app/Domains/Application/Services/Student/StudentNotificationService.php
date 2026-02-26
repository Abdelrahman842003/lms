<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Student;

use App\Domains\Auth\Models\Student;
use App\Domains\Notifications\Models\SentNotification;

class StudentNotificationService
{
    /**
     * Get received notifications for a student
     */
    public function getReceivedNotifications(Student $student): array
    {
        return $student->notifications()
            ->orderBy('created_at', 'desc')
            ->get()
            ->filter(function ($notification) {
                // Exclude notifications that are for parent only
                $data = $notification->data;
                return !isset($data['for_parent']) || $data['for_parent'] !== true;
            })
            ->values()
            ->toArray();
    }

    /**
     * Get sent notifications for a student
     */
    public function getSentNotifications(Student $student): array
    {
        return $student->sentNotifications()
            ->orderBy('created_at', 'desc')
            ->get()
            ->toArray();
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead(Student $student, string $id): bool
    {
        $notification = $student->notifications()->where('id', $id)->first();

        if ($notification) {
            $notification->markAsRead();
            return true;
        }

        return false;
    }

    /**
     * Send a notification from student to admin
     */
    public function sendNotification(Student $student, string $title, string $message, string $recipientType): SentNotification
    {
        return SentNotification::create([
            'student_id' => $student->id,
            'title' => $title,
            'message' => $message,
            'recipient_type' => $recipientType,
            'recipient_count' => 1, // Only sent to admin/support
        ]);
    }
}
