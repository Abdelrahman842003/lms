<?php

namespace App\Actions\Teacher;

use App\Models\Group;

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
