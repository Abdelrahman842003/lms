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

        // جمع FCM tokens لطلاب المجموعة النشطين
        $studentIds = \App\Domains\Enrollments\Models\Enrollment::where('group_id', $groupId)
            ->where('is_active', true)
            ->pluck('student_id');

        $tokens = DeviceToken::whereIn('tokenable_id', $studentIds)
            ->where('tokenable_type', \App\Domains\Auth\Models\Student::class)
            ->pluck('token');

        if ($tokens->isEmpty()) {
            return;
        }

        // إرسال batch notifications
        // TODO: ربط FCM/Firebase adapter
        // FCMService::sendToTokens($tokens, [
        //     'title' => 'بدأت المحاضرة 🎓',
        //     'body'  => $lecture->title,
        //     'data'  => ['lecture_id' => $lecture->id],
        // ]);
    }
}
