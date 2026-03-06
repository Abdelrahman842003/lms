<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Academy;

use App\Domains\Auth\Models\Academy;
use App\Domains\Notifications\DTOs\NotificationData;
use App\Domains\Notifications\Services\NotificationSettingsService;
use App\Domains\Notifications\Services\NotificationService as RealtimeNotificationService;
use App\Domains\Notifications\Models\AcademyNotification;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use RuntimeException;

class NotificationService
{
    public function __construct(
        private NotificationSettingsService $notificationSettings,
        private RealtimeNotificationService $realtimeNotificationService,
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
    public function createNotification(Academy $academy, NotificationData $data, ?string $creatorId = null): AcademyNotification
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

        $dispatchMeta = $this->dispatchNotifications($academy, $data);

        return AcademyNotification::create([
            'academy_id' => $academy->id,
            'created_by' => $creatorId,
            'title' => $data->title,
            'message' => $data->message,
            'type' => $data->type,
            'target_type' => $data->target_type,
            'target_ids' => $dispatchMeta['target_ids'],
            'recipient_count' => $dispatchMeta['recipient_count'],
            'recipient_snapshot' => $dispatchMeta['recipient_snapshot'],
        ]);
    }

    /**
     * @return array{target_ids: array<int, string>, recipient_count: int, recipient_snapshot: array<int, array<string, mixed>>|null}
     */
    private function dispatchNotifications(Academy $academy, NotificationData $data): array
    {
        $targetIds = $this->normalizeTargetIds($data);

        $payload = [
            'academy_id' => $academy->id,
            'sender_role' => 'academy',
            'target_type' => $data->target_type,
        ];

        if (! empty($targetIds)) {
            $payload['target_ids'] = $targetIds;
        }

        if ($data->target_type === 'teachers') {
            $teachers = $this->resolveTeacherRecipients($academy, $targetIds);
            $this->realtimeNotificationService->sendToMany(
                $teachers,
                'teacher',
                $data->title,
                $data->message,
                $payload,
                $data->type
            );

            return [
                'target_ids' => $targetIds,
                'recipient_count' => $teachers->count(),
                'recipient_snapshot' => $this->buildRecipientSnapshot($teachers, 'teacher', ! empty($targetIds)),
            ];
        }

        if ($data->target_type === 'secretaries') {
            $secretaries = $this->resolveSecretaryRecipients($academy, $targetIds);
            $this->realtimeNotificationService->sendToMany(
                $secretaries,
                'secretary',
                $data->title,
                $data->message,
                $payload,
                $data->type
            );

            return [
                'target_ids' => $targetIds,
                'recipient_count' => $secretaries->count(),
                'recipient_snapshot' => $this->buildRecipientSnapshot($secretaries, 'secretary', ! empty($targetIds)),
            ];
        }

        $teachers = $this->resolveTeacherRecipients($academy, [], false);
        $secretaries = $this->resolveSecretaryRecipients($academy, [], false);

        if ($teachers->isEmpty() && $secretaries->isEmpty()) {
            throw new RuntimeException('لا يوجد مستلمون متاحون داخل الأكاديمية.');
        }

        if ($teachers->isNotEmpty()) {
            $this->realtimeNotificationService->sendToMany(
                $teachers,
                'teacher',
                $data->title,
                $data->message,
                $payload,
                $data->type
            );
        }

        if ($secretaries->isNotEmpty()) {
            $this->realtimeNotificationService->sendToMany(
                $secretaries,
                'secretary',
                $data->title,
                $data->message,
                $payload,
                $data->type
            );
        }

        return [
            'target_ids' => [],
            'recipient_count' => $teachers->count() + $secretaries->count(),
            'recipient_snapshot' => null,
        ];
    }

    /**
     * @return array<int, string>
     */
    private function normalizeTargetIds(NotificationData $data): array
    {
        $ids = $data->target_ids;

        if (is_string($data->target_id) && $data->target_id !== '' && ! in_array($data->target_id, $ids, true)) {
            $ids[] = $data->target_id;
        }

        return array_values(array_unique(array_filter($ids, static fn ($id) => is_string($id) && $id !== '')));
    }

    /**
     * @param array<int, string> $targetIds
     */
    private function resolveTeacherRecipients(Academy $academy, array $targetIds, bool $throwIfEmpty = true): Collection
    {
        $query = $academy->teachers()
            ->wherePivot('is_active', true)
            ->where('teachers.status', 'active');

        if (! empty($targetIds)) {
            $query->whereIn('teachers.id', $targetIds);
        }

        $teachers = $query->get();

        if (! empty($targetIds) && $teachers->count() !== count($targetIds)) {
            throw new RuntimeException('بعض المدرسين المحددين غير نشطين أو غير تابعين للأكاديمية.');
        }

        if ($throwIfEmpty && $teachers->isEmpty()) {
            throw new RuntimeException(! empty($targetIds)
                ? 'المدرسون المحددون غير نشطين أو غير تابعين للأكاديمية.'
                : 'لا يوجد مدرسون نشطون متاحون للإرسال.');
        }

        return $teachers;
    }

    /**
     * @param array<int, string> $targetIds
     */
    private function resolveSecretaryRecipients(Academy $academy, array $targetIds, bool $throwIfEmpty = true): Collection
    {
        $query = $academy->secretaries()
            ->wherePivot('is_active', true)
            ->where('secretaries.is_active', true);

        if (! empty($targetIds)) {
            $query->whereIn('secretaries.id', $targetIds);
        }

        $secretaries = $query->get();

        if (! empty($targetIds) && $secretaries->count() !== count($targetIds)) {
            throw new RuntimeException('بعض السكرتيرين المحددين غير نشطين أو غير تابعين للأكاديمية.');
        }

        if ($throwIfEmpty && $secretaries->isEmpty()) {
            throw new RuntimeException(! empty($targetIds)
                ? 'السكرتيرون المحددون غير نشطين أو غير تابعين للأكاديمية.'
                : 'لا يوجد سكرتيرون نشطون متاحون للإرسال.');
        }

        return $secretaries;
    }

    /**
     * @return array<int, array<string, mixed>>|null
     */
    private function buildRecipientSnapshot(Collection $recipients, string $recipientType, bool $includeSnapshot): ?array
    {
        if (! $includeSnapshot) {
            return null;
        }

        return $recipients->map(static function ($recipient) use ($recipientType) {
            return [
                'id' => (string) $recipient->id,
                'name' => (string) ($recipient->name ?? ''),
                'type' => $recipientType,
            ];
        })->values()->all();
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
        $data = new NotificationData(
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
        $data = new NotificationData(
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
