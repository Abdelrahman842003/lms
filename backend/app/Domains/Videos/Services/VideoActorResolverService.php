<?php

declare(strict_types=1);

namespace App\Domains\Videos\Services;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Videos\DTOs\VideoActorContext;
use App\Domains\Videos\Enums\VideoOwnerType;
use Illuminate\Auth\Access\AuthorizationException;

class VideoActorResolverService
{
    /**
     * Resolve upload ownership for independent teacher uploads.
     */
    public function resolveIndependentTeacher(Teacher $teacher): VideoActorContext
    {
        if (! $teacher->is_independent_active) {
            throw new AuthorizationException('المعلم غير مفعل كمعلم مستقل.');
        }

        return new VideoActorContext(
            ownerType: VideoOwnerType::INDEPENDENT_TEACHER,
            ownerId: (string) $teacher->id,
            academyId: null,
            uploader: $teacher,
            teacherReference: $teacher,
        );
    }

    /**
     * Resolve upload ownership for academy-owned videos.
     */
    public function resolveAcademyUpload(
        Academy|Secretary $actor,
        ?string $academyId = null,
        ?string $teacherReferenceId = null
    ): VideoActorContext {
        $academy = $actor instanceof Academy
            ? $actor
            : $this->resolveSecretaryAcademy($actor, $academyId);

        if (! $academy) {
            throw new AuthorizationException('لا توجد أكاديمية صالحة للحساب الحالي.');
        }

        if ($actor instanceof Secretary && ! $this->secretaryCan($actor, 'create videos', (string) $academy->id)) {
            throw new AuthorizationException('لا تملك صلاحية رفع الفيديوهات.');
        }

        $teacherReference = null;
        if ($teacherReferenceId) {
            $teacherReference = Teacher::query()
                ->whereKey($teacherReferenceId)
                ->whereHas('academies', function ($query) use ($academy): void {
                    $query->where('academies.id', $academy->id)
                        ->where('academy_teacher.is_active', true);
                })
                ->first();

            if (! $teacherReference) {
                throw new AuthorizationException('المدرس المرجعي غير مرتبط بهذه الأكاديمية.');
            }
        }

        return new VideoActorContext(
            ownerType: VideoOwnerType::ACADEMY,
            ownerId: (string) $academy->id,
            academyId: (string) $academy->id,
            uploader: $actor,
            teacherReference: $teacherReference,
        );
    }

    public function resolveAcademyContext(Academy|Secretary $actor, ?string $academyId = null): VideoActorContext
    {
        $academy = $actor instanceof Academy
            ? $actor
            : $this->resolveSecretaryAcademy($actor, $academyId);

        if (! $academy) {
            throw new AuthorizationException('لا توجد أكاديمية صالحة للحساب الحالي.');
        }

        return new VideoActorContext(
            ownerType: VideoOwnerType::ACADEMY,
            ownerId: (string) $academy->id,
            academyId: (string) $academy->id,
            uploader: $actor,
            teacherReference: null,
        );
    }

    public function secretaryCan(Secretary $secretary, string $permission, ?string $academyId = null): bool
    {
        try {
            if ($secretary->hasPermissionTo($permission, 'secretary')) {
                return true;
            }
        } catch (\Throwable) {
            // Fallback to pivot permissions arrays.
        }

        $academyQuery = $secretary->academies();
        if ($academyId) {
            $academyQuery->where('academies.id', $academyId);
        }

        $academy = $academyQuery->first();
        $academyPermissions = (array) ($academy?->pivot?->permissions ?? []);

        if (in_array($permission, $academyPermissions, true)) {
            return true;
        }

        $teacher = $secretary->teachers()->first();
        $teacherPermissions = (array) ($teacher?->pivot?->permissions ?? []);

        return in_array($permission, $teacherPermissions, true);
    }

    private function resolveSecretaryAcademy(Secretary $secretary, ?string $academyId): ?Academy
    {
        $query = $secretary->academies()->where('academy_secretary.is_active', true);

        if ($academyId) {
            $query->where('academies.id', $academyId);
        }

        /** @var Academy|null $academy */
        $academy = $query->first();

        return $academy;
    }
}
