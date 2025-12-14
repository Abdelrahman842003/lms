<?php

namespace App\Services\Teacher;

use App\Models\Admin;
use App\Models\SentNotification;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Support\Collection;

class NotificationService
{
    public function getRecipients(Teacher $teacher, string $recipientType, ?string $gradeId = null, ?string $groupId = null): Collection
    {
        return match ($recipientType) {
            'all' => Student::whereHas('groups', function ($q) use ($teacher) {
                $q->where('teacher_id', $teacher->id);
            })->get(),
            'grade' => Student::whereHas('groups', function ($q) use ($teacher, $gradeId) {
                $q->where('teacher_id', $teacher->id)
                  ->where('grade_id', $gradeId);
            })->get(),
            'group' => Student::whereHas('groups', function ($q) use ($groupId) {
                $q->where('id', $groupId);
            })->get(),
            'admin' => Admin::all(),
            default => collect(),
        };
    }

    public function logNotification(Teacher $teacher, array $data, int $recipientCount): SentNotification
    {
        return SentNotification::create([
            'teacher_id' => $teacher->id,
            'title' => $data['title'],
            'message' => $data['message'],
            'recipient_type' => $data['recipient_type'],
            'recipient_count' => $recipientCount,
        ]);
    }
}
