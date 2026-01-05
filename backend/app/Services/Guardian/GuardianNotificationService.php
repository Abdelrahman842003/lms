<?php

namespace App\Services\Guardian;

use App\Models\Guardian;
use Illuminate\Notifications\DatabaseNotification;

class GuardianNotificationService
{
    public function getNotifications(Guardian $guardian, int $perPage = 20)
    {
        // Get notifications for the guardian (if they have a user account)
        // AND notifications for all their children
        
        $studentIds = $guardian->students()->pluck('id');
        
        // This is tricky because notifications are polymorphic.
        // Usually notifications are stored for a User model.
        // If guardians have their own auth model (Guardian), they have their own notifications.
        // But they also want to see notifications sent to their children (Student model).
        
        // Let's assume we want to aggregate:
        // 1. Notifications sent directly to the Guardian
        // 2. Notifications sent to any of their Students
        
        // However, standard Laravel notifications are on a single notifiable.
        // Merging queries from different notifiable types is complex with standard relationships.
        // But the table has `notifiable_type` and `notifiable_id`.
        
        return DatabaseNotification::where(function ($query) use ($guardian, $studentIds) {
                $query->where(function ($q) use ($guardian) {
                    $q->where('notifiable_type', get_class($guardian))
                      ->where('notifiable_id', $guardian->id);
                })->orWhere(function ($q) use ($studentIds) {
                    $q->where('notifiable_type', 'App\Models\Student') // Hardcoded or use get_class(new Student)
                      ->whereIn('notifiable_id', $studentIds);
                });
            })
            ->latest()
            ->paginate($perPage);
    }

    public function markAsRead(Guardian $guardian, string $id)
    {
        $notification = DatabaseNotification::findOrFail($id);
        
        // Verify ownership (either guardian or one of their students)
        $isGuardian = $notification->notifiable_type === get_class($guardian) && $notification->notifiable_id === $guardian->id;
        $isStudent = $notification->notifiable_type === 'App\Models\Student' && $guardian->students()->where('id', $notification->notifiable_id)->exists();
        
        if ($isGuardian || $isStudent) {
            $notification->markAsRead();
            return true;
        }
        
        throw new \Exception('Notification not found or access denied', 404);
    }

    public function markAllAsRead(Guardian $guardian)
    {
        $studentIds = $guardian->students()->pluck('id');

        DatabaseNotification::where(function ($query) use ($guardian, $studentIds) {
            $query->where(function ($q) use ($guardian) {
                $q->where('notifiable_type', get_class($guardian))
                  ->where('notifiable_id', $guardian->id);
            })->orWhere(function ($q) use ($studentIds) {
                $q->where('notifiable_type', 'App\Models\Student')
                  ->whereIn('notifiable_id', $studentIds);
            });
        })->whereNull('read_at')->update(['read_at' => now()]);
    }
    
    public function getUnreadCount(Guardian $guardian): int
    {
        $studentIds = $guardian->students()->pluck('id');

        return DatabaseNotification::where(function ($query) use ($guardian, $studentIds) {
            $query->where(function ($q) use ($guardian) {
                $q->where('notifiable_type', get_class($guardian))
                  ->where('notifiable_id', $guardian->id);
            })->orWhere(function ($q) use ($studentIds) {
                $q->where('notifiable_type', 'App\Models\Student')
                  ->whereIn('notifiable_id', $studentIds);
            });
        })->whereNull('read_at')->count();
    }
}
