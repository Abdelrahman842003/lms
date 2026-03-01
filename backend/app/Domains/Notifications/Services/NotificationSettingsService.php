<?php

declare(strict_types=1);

namespace App\Domains\Notifications\Services;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Guardian;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Notifications\Channels\FcmChannelStrategy;
use App\Domains\Support\Models\Setting;
use Illuminate\Support\Collection;

class NotificationSettingsService
{
    public const INTERNAL_ENABLED_KEY = 'notifications_internal_enabled';
    public const EXTERNAL_ENABLED_KEY = 'notifications_external_enabled';
    public const DISABLED_CATEGORIES_KEY = 'notifications_disabled_categories';
    public const DISABLED_RECIPIENTS_KEY = 'notifications_disabled_recipients';
    public const MAX_BATCH_SIZE_KEY = 'notifications_max_batch_size';

    public function isInternalEnabled(): bool
    {
        return $this->toBoolean(Setting::getValue(self::INTERNAL_ENABLED_KEY, '1'), true);
    }

    public function isExternalEnabled(): bool
    {
        return $this->toBoolean(Setting::getValue(self::EXTERNAL_ENABLED_KEY, '1'), true);
    }

    public function maxBatchSize(): int
    {
        $value = (int) Setting::getValue(self::MAX_BATCH_SIZE_KEY, '500');

        return min(max($value, 1), 5000);
    }

    /**
     * @return list<string>
     */
    public function disabledCategories(): array
    {
        $raw = $this->decodeArray(Setting::getValue(self::DISABLED_CATEGORIES_KEY, '[]'));

        $normalized = array_map(
            fn (mixed $category): string => $this->normalizeType((string) $category),
            $raw
        );

        return array_values(array_unique(array_filter($normalized)));
    }

    /**
     * @return list<string>
     */
    public function disabledRecipients(): array
    {
        $raw = $this->decodeArray(Setting::getValue(self::DISABLED_RECIPIENTS_KEY, '[]'));

        $normalized = [];

        foreach ($raw as $item) {
            if (! is_string($item) || ! str_contains($item, ':')) {
                continue;
            }

            [$type, $id] = explode(':', $item, 2);
            $type = $this->normalizeType($type);
            $id = trim($id);

            if ($type === '' || $id === '') {
                continue;
            }

            $normalized[] = "{$type}:{$id}";
        }

        return array_values(array_unique($normalized));
    }

    public function isTypeBlocked(string $type): bool
    {
        return in_array($this->normalizeType($type), $this->disabledCategories(), true);
    }

    public function isRecipientBlocked(object $recipient): bool
    {
        $type = $this->resolveTypeFromRecipient($recipient);

        if ($type === null) {
            return false;
        }

        if ($this->isTypeBlocked($type)) {
            return true;
        }

        $id = (string) ($recipient->id ?? '');

        if ($id === '') {
            return false;
        }

        $recipientKey = $this->buildRecipientKey($type, $id);

        return in_array($recipientKey, $this->disabledRecipients(), true);
    }

    /**
     * @param iterable<mixed> $recipients
     * @return Collection<int, mixed>
     */
    public function filterRecipients(iterable $recipients): Collection
    {
        return collect($recipients)
            ->filter(fn ($recipient): bool => is_object($recipient) && ! $this->isRecipientBlocked($recipient))
            ->values();
    }

    /**
     * @param list<string> $internalChannels
     * @return list<string>
     */
    public function channelsFor(
        object $recipient,
        array $internalChannels = ['database', 'broadcast'],
        bool $allowExternal = true
    ): array {
        if ($this->isRecipientBlocked($recipient)) {
            return [];
        }

        $channels = [];

        if ($this->isInternalEnabled()) {
            $channels = array_values(array_unique($internalChannels));
        }

        if ($allowExternal && $this->isExternalEnabled()) {
            $channels[] = FcmChannelStrategy::class;
        }

        return array_values(array_unique($channels));
    }

    public function buildRecipientKey(string $type, string $id): string
    {
        return $this->normalizeType($type) . ':' . trim($id);
    }

    private function resolveTypeFromRecipient(object $recipient): ?string
    {
        return match (true) {
            $recipient instanceof Teacher => 'teacher',
            $recipient instanceof Student => 'student',
            $recipient instanceof Guardian => 'guardian',
            $recipient instanceof Secretary => 'secretary',
            $recipient instanceof Admin => 'admin',
            $recipient instanceof Academy => 'academy',
            default => null,
        };
    }

    /**
     * @return list<mixed>
     */
    private function decodeArray(mixed $value): array
    {
        if (is_array($value)) {
            return array_values($value);
        }

        if (! is_string($value) || trim($value) === '') {
            return [];
        }

        $decoded = json_decode($value, true);

        return is_array($decoded) ? array_values($decoded) : [];
    }

    private function normalizeType(string $type): string
    {
        return match (strtolower(trim($type))) {
            'teacher', 'teachers' => 'teacher',
            'student', 'students' => 'student',
            'guardian', 'guardians', 'parent', 'parents' => 'guardian',
            'secretary', 'secretaries' => 'secretary',
            'admin', 'admins' => 'admin',
            'academy', 'academies' => 'academy',
            default => strtolower(trim($type)),
        };
    }

    private function toBoolean(mixed $value, bool $default): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        if (is_null($value)) {
            return $default;
        }

        if (is_numeric($value)) {
            return ((int) $value) === 1;
        }

        $normalized = strtolower(trim((string) $value));

        return match ($normalized) {
            '1', 'true', 'on', 'yes' => true,
            '0', 'false', 'off', 'no', '' => false,
            default => $default,
        };
    }
}

