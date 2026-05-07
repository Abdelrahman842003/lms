<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Listeners;

use App\Domains\Lectures\Events\LectureActivated;
use App\Domains\Auth\Models\DeviceToken;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * يُرسل push notification لكل طلاب المجموعة عند تفعيل المحاضرة.
 * يعمل على Queue عشان ما يبطّئش الـ response.
 */
class NotifyGroupOnActivation implements ShouldQueue
{

    public function handle(LectureActivated $event): void
    {
        $lecture  = $event->lecture;
        $groupId  = $lecture->group_id;

        if (! $groupId) {
            return;
        }

        // جمع طلاب المجموعة النشطين
        $students = \App\Domains\Auth\Models\Student::whereHas('enrollments', function ($q) use ($groupId) {
            $q->where('group_id', $groupId)
              ->where('is_active', true);
        })->get();

        if ($students->isEmpty()) {
            return;
        }

        // إرسال الإشعارات عبر الخدمة المركزية (Reverb + FCM)
        app(\App\Domains\Notifications\Services\NotificationService::class)->sendToMany(
            $students,
            'student',
            'بدأت المحاضرة 🎓',
            $lecture->title,
            [
                'lecture_id' => $lecture->id,
                'teacher_name' => $lecture->teacher->name ?? '',
            ],
            'lecture_activation'
        );
    }
}
