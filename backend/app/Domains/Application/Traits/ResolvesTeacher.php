<?php

declare(strict_types=1);

namespace App\Domains\Application\Traits;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Auth\Models\Secretary;
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
            return $user->teachers()->first();
        }

        return null;
    }
}
