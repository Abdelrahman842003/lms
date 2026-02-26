<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Admin;

use App\Domains\Notifications\Factories\NotificationFactory;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Notifications\Models\SentNotification;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

class NotificationService
{
    public function __construct(protected \App\Domains\Notifications\Services\BulkNotificationService $bulkService)
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
                $this->bulkService->send(\App\Domains\Auth\Models\Teacher::query(), $data['title'], $data['message'], $fcmData);
                $this->bulkService->send(\App\Domains\Auth\Models\Student::query(), $data['title'], $data['message'], $fcmData);
                $this->bulkService->send(\App\Domains\Auth\Models\Secretary::query(), $data['title'], $data['message'], $fcmData);
                break;
            case 'all_teachers':
                $this->bulkService->send(\App\Domains\Auth\Models\Teacher::query(), $data['title'], $data['message'], $fcmData);
                break;
            case 'all_students':
                $this->bulkService->send(\App\Domains\Auth\Models\Student::query(), $data['title'], $data['message'], $fcmData);
                break;
            case 'all_secretaries':
                $this->bulkService->send(\App\Domains\Auth\Models\Secretary::query(), $data['title'], $data['message'], $fcmData);
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
            'all_users' => \App\Domains\Auth\Models\Teacher::count() + \App\Domains\Auth\Models\Student::count() + \App\Domains\Auth\Models\Secretary::count(),
            'all_teachers' => \App\Domains\Auth\Models\Teacher::count(),
            'all_students' => \App\Domains\Auth\Models\Student::count(),
            'all_secretaries' => \App\Domains\Auth\Models\Secretary::count(),
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
