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
            'all' => Student::whereHas('enrollments', function ($q) use ($teacher) {
                $q->where('teacher_id', $teacher->id);
            })->get(),
            'grade' => Student::whereHas('enrollments', function ($q) use ($teacher, $gradeId) {
                $q->where('teacher_id', $teacher->id)
                  ->where('grade_id', $gradeId);
            })->get(),
            'group' => Student::whereHas('enrollments', function ($q) use ($groupId) {
                $q->where('group_id', $groupId);
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

    public function sendToParents(Collection $students, Teacher $teacher, array $data): void
    {
        foreach ($students as $student) {
            if ($student->guardian) {
                try {
                    $student->guardian->notify(new \App\Notifications\ParentNotification(
                        $student->guardian->id,
                        $data['title'],
                        $data['message'],
                        $teacher->name,
                        $student->name,
                        'general',
                        array_merge($data, ['sender_name' => $teacher->name])
                    ));
                } catch (\Exception $e) {
                    // Log error but continue sending to others
                    \Illuminate\Support\Facades\Log::error('Failed to send parent notification', [
                        'guardian_id' => $student->guardian->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }
        }
    }
}
