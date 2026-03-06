<?php

declare(strict_types=1);

namespace App\Domains\Notifications\DTOs;

use Illuminate\Http\Request;

readonly class NotificationData
{
    public function __construct(
        public string $title,
        public string $message,
        public string $type,
        public string $target_type,
        public ?string $target_id = null,
        /** @var array<int, string> */
        public array $target_ids = [],
    ) {}

    public static function fromRequest(Request $request): self
    {
        $targetIds = $request->validated('target_ids') ?? [];
        $targetId = $request->validated('target_id');

        if (is_string($targetId) && $targetId !== '' && ! in_array($targetId, $targetIds, true)) {
            $targetIds[] = $targetId;
        }

        return new self(
            title: $request->validated('title'),
            message: $request->validated('message'),
            type: $request->validated('type') ?? 'info',
            target_type: $request->validated('target_type') ?? 'all',
            target_id: $targetId ?? ($targetIds[0] ?? null),
            target_ids: array_values(array_unique(array_filter($targetIds, static fn ($id) => is_string($id) && $id !== ''))),
        );
    }

    public function toArray(): array
    {
        return [
            'title' => $this->title,
            'message' => $this->message,
            'type' => $this->type,
            'target_type' => $this->target_type,
            'target_id' => $this->target_id,
            'target_ids' => $this->target_ids,
        ];
    }
}
