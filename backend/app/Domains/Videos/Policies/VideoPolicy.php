<?php

declare(strict_types=1);

namespace App\Domains\Videos\Policies;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Videos\Enums\VideoOwnerType;
use App\Domains\Videos\Models\Video;

class VideoPolicy
{
    public function viewAny(Admin|Teacher|Academy|Secretary $user): bool
    {
        return true;
    }

    public function createIndependent(Admin|Teacher $user): bool
    {
        if ($user instanceof Admin) {
            return true;
        }

        return (bool) $user->is_independent_active;
    }

    public function createAcademy(Admin|Academy|Secretary $user, ?string $academyId = null): bool
    {
        if ($user instanceof Admin) {
            return true;
        }

        if ($user instanceof Academy) {
            return true;
        }

        if (! $user instanceof Secretary) {
            return false;
        }

        return $this->secretaryCan($user, 'create videos', $academyId);
    }

    public function view(Admin|Teacher|Academy|Secretary $user, Video $video): bool
    {
        if ($user instanceof Admin) {
            return true;
        }

        if ($user instanceof Teacher) {
            return $video->owner_type === VideoOwnerType::INDEPENDENT_TEACHER
                && $video->owner_id === $user->id;
        }

        if ($user instanceof Academy) {
            return $video->owner_type === VideoOwnerType::ACADEMY
                && $video->owner_id === $user->id;
        }

        if (! $user instanceof Secretary) {
            return false;
        }

        if ($video->owner_type !== VideoOwnerType::ACADEMY || ! $video->academy_id) {
            return false;
        }

        return $this->secretaryBelongsToAcademy($user, $video->academy_id);
    }

    public function update(Admin|Teacher|Academy|Secretary $user, Video $video): bool
    {
        if (! $this->view($user, $video)) {
            return false;
        }

        if ($user instanceof Secretary) {
            return $this->secretaryCan($user, 'edit videos', $video->academy_id);
        }

        return true;
    }

    public function delete(Admin|Teacher|Academy|Secretary $user, Video $video): bool
    {
        if ($user instanceof Admin) {
            return true;
        }

        if (! $this->view($user, $video)) {
            return false;
        }

        if ($user instanceof Secretary) {
            return $this->secretaryCan($user, 'delete videos', $video->academy_id);
        }

        return true;
    }

    public function publish(Admin|Teacher|Academy|Secretary $user, Video $video): bool
    {
        if (! $this->update($user, $video)) {
            return false;
        }

        if ($user instanceof Secretary) {
            return $this->secretaryCan($user, 'publish videos', $video->academy_id);
        }

        return true;
    }

    public function manageComments(Admin|Teacher|Academy|Secretary $user, Video $video): bool
    {
        return $this->view($user, $video);
    }

    private function secretaryCan(Secretary $secretary, string $permission, ?string $academyId = null): bool
    {
        try {
            if ($secretary->hasPermissionTo($permission, 'secretary')) {
                return true;
            }
        } catch (\Throwable) {
            // Fall back to JSON permissions from pivot.
        }

        $academyQuery = $secretary->academies();
        if ($academyId) {
            $academyQuery->where('academies.id', $academyId);
        }

        $academyRecord = $academyQuery->first();
        $academyPermissions = (array) ($academyRecord?->pivot?->permissions ?? []);
        if (in_array($permission, $academyPermissions, true)) {
            return true;
        }

        $teacherRecord = $secretary->teachers()->first();
        $teacherPermissions = (array) ($teacherRecord?->pivot?->permissions ?? []);

        return in_array($permission, $teacherPermissions, true);
    }

    private function secretaryBelongsToAcademy(Secretary $secretary, string $academyId): bool
    {
        return $secretary->academies()
            ->where('academies.id', $academyId)
            ->where('academy_secretary.is_active', true)
            ->exists();
    }
}
