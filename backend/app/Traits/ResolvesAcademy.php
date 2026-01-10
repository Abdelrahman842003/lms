<?php

declare(strict_types=1);

namespace App\Traits;

use App\Models\Academy;
use App\Models\Secretary;
use Illuminate\Http\Request;

trait ResolvesAcademy
{
    /**
     * Resolve the effective academy from the request user.
     * 
     * @param Request $request
     * @return Academy|null
     */
    protected function getAcademy(Request $request): ?Academy
    {
        $user = $request->user();

        if (!$user) {
            return null;
        }

        if ($user instanceof Academy) {
            return $user;
        }

        if ($user instanceof Secretary) {
            // Secretary belongs to an academy
            return $user->academy;
        }

        return null;
    }
}
