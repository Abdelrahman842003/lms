<?php

declare(strict_types=1);

namespace App\Domains\Auth\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserType
{
    // Map role names to model classes
    private const ROLE_MODEL_MAP = [
        'teacher'   => \App\Domains\Auth\Models\Teacher::class,
        'student'   => \App\Domains\Auth\Models\Student::class,
        'academy'   => \App\Domains\Auth\Models\Academy::class,
        'guardian'  => \App\Domains\Auth\Models\Guardian::class,
        'secretary' => \App\Domains\Auth\Models\Secretary::class,
        'admin'     => \App\Domains\Auth\Models\Admin::class,
    ];

    public function handle(Request $request, Closure $next, string ...$allowedRoles): Response
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'status' => false,
                'status_code' => 401,
                'message' => 'غير مصرح لك.',
                'error' => 'UNAUTHENTICATED',
            ], 401);
        }

        $userClass = get_class($user);
        foreach ($allowedRoles as $role) {
            if (isset(self::ROLE_MODEL_MAP[$role]) && $userClass === self::ROLE_MODEL_MAP[$role]) {
                return $next($request);
            }
        }

        return response()->json([
            'status' => false,
            'status_code' => 403,
            'message' => 'غير مصرح لك بالوصول لهذا القسم.',
            'error' => 'WRONG_USER_TYPE',
        ], 403);
    }
}
