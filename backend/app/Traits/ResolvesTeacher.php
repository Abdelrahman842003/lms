<?php

declare(strict_types=1);

namespace App\Traits;

use App\Models\Teacher;
use App\Models\Secretary;
use Illuminate\Http\Request;

trait ResolvesTeacher
{
    /**
     * Resolve the effective teacher from the request user.
     * 
     * @param Request $request
     * @return Teacher|null
     */
    protected function getTeacherFromRequest(Request $request): ?Teacher
    {
        $user = $request->user();

        if (!$user) {
            return null;
        }

        if ($user instanceof Teacher) {
            return $user;
        }

        if ($user instanceof Secretary) {
            // For now, return the first associated teacher.
            // In the future, if a secretary manages multiple teachers, 
            // we might need to check a header or query param.
            return $user->teachers()->first();
        }

        return null;
    }
}
