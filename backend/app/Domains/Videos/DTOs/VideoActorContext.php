<?php

declare(strict_types=1);

namespace App\Domains\Videos\DTOs;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Videos\Enums\VideoOwnerType;

final readonly class VideoActorContext
{
    public function __construct(
        public VideoOwnerType $ownerType,
        public string $ownerId,
        public ?string $academyId,
        public object $uploader,
        public ?Teacher $teacherReference,
    ) {}

    public function isAcademyOwner(): bool
    {
        return $this->ownerType === VideoOwnerType::ACADEMY;
    }

    public function isTeacherOwner(): bool
    {
        return $this->ownerType === VideoOwnerType::INDEPENDENT_TEACHER;
    }

    public function uploaderMorphType(): string
    {
        if (method_exists($this->uploader, 'getMorphClass')) {
            /** @var string $morphClass */
            $morphClass = $this->uploader->getMorphClass();
            return $morphClass;
        }

        return $this->uploader::class;
    }

    public function uploaderId(): string
    {
        return (string) $this->uploader->id;
    }
}
