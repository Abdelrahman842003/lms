<?php

namespace App\Services\Admin;

use App\Factories\NotificationFactory;
use App\Models\Secretary;
use App\Models\SentNotification;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

class NotificationService
{
    public function __construct(protected \App\Services\Notifications\BulkNotificationService $bulkService)
    {
    }

    public function sendNotification(array $data): SentNotification
    {
        $admin = Auth::user();
        $senderName = $admin ? $admin->name : 'System';
        $fcmData = [
            'sender_name' => $senderName,
            'sender_role' => 'admin',
        ];

        // Send via Bulk Service (FCM)
        switch ($data['recipient_type']) {
            case 'all_users':
                $this->bulkService->send(\App\Models\Teacher::query(), $data['title'], $data['message'], $fcmData);
                $this->bulkService->send(\App\Models\Student::query(), $data['title'], $data['message'], $fcmData);
                $this->bulkService->send(\App\Models\Secretary::query(), $data['title'], $data['message'], $fcmData);
                break;
            case 'all_teachers':
                $this->bulkService->send(\App\Models\Teacher::query(), $data['title'], $data['message'], $fcmData);
                break;
            case 'all_students':
                $this->bulkService->send(\App\Models\Student::query(), $data['title'], $data['message'], $fcmData);
                break;
            case 'all_secretaries':
                $this->bulkService->send(\App\Models\Secretary::query(), $data['title'], $data['message'], $fcmData);
                break;
        }

        // Calculate count for log
        $count = $this->countRecipients($data['recipient_type']);

        // Note: Database notifications are currently skipped in this bulk flow to prioritize FCM performance.
        // To support Database notifications in bulk, we should implement bulk insert in the Job.

        return $this->logNotification($admin->id, $data, $count);
    }

    private function countRecipients(string $type): int
    {
        return match ($type) {
            'all_users' => \App\Models\Teacher::count() + \App\Models\Student::count() + \App\Models\Secretary::count(),
            'all_teachers' => \App\Models\Teacher::count(),
            'all_students' => \App\Models\Student::count(),
            'all_secretaries' => \App\Models\Secretary::count(),
            default => 0,
        };
    }

    private function getRecipients(string $type): Collection
    {
        return match ($type) {
            'all_users' => Teacher::all()->concat(Student::all())->concat(Secretary::all()),
            'all_teachers' => Teacher::all(),
            'all_students' => Student::all(),
            'all_secretaries' => Secretary::all(),
            default => collect(),
        };
    }

    private function logNotification(string $adminId, array $data, int $count): SentNotification
    {
        return SentNotification::create([
            'admin_id' => $adminId,
            'title' => $data['title'],
            'message' => $data['message'],
            'recipient_type' => $data['recipient_type'],
            'recipient_count' => $count,
        ]);
    }
}
