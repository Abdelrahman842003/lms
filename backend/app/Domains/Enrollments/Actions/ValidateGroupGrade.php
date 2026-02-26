<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\Actions;

use App\Domains\Enrollments\Models\Group;

class ValidateGroupGrade
{
    public function execute(?string $groupId, ?string $gradeId): bool
    {
        if (!$groupId || !$gradeId) {
            return true; // No validation needed if either is null
        }

        $group = Group::find($groupId);
        
        if (!$group) {
            return false;
        }

        return $group->grade_id == $gradeId;
    }
}
