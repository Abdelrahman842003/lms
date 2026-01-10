<?php

declare(strict_types=1);

namespace App\DTOs\Academy;

use Illuminate\Http\Request;

readonly class NotificationData
{
    public function __construct(
        public string $title,
        public string $message,
        public string $type,
        public string $target_type,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            title: $request->validated('title'),
            message: $request->validated('message'),
            type: $request->validated('type') ?? 'info',
            target_type: $request->validated('target_type') ?? 'all',
        );
    }

    public function toArray(): array
    {
        return [
            'title' => $this->title,
            'message' => $this->message,
            'type' => $this->type,
            'target_type' => $this->target_type,
        ];
    }
}
