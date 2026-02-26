<?php

declare(strict_types=1);

namespace App\Domains\Auth\Http\Middleware;

use App\Domains\Auth\Models\Student;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * يتحقق أن الطالب لديه enrollment نشطة.
 * يُطبَّق على routes الطالب التي تتطلب اشتراكاً فعالاً.
 */
class EnsureActiveEnrollment
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user instanceof Student) {
            return $next($request);
        }

        // التحقق من enrollment نشطة
        $hasActiveEnrollment = \App\Domains\Enrollments\Models\Enrollment::where('student_id', $user->id)
            ->where('status', 'active')
            ->exists();

        if (! $hasActiveEnrollment) {
            return response()->json([
                'status'      => false,
                'status_code' => 403,
                'message'     => 'ليس لديك اشتراك نشط. يرجى التواصل مع معلمك.',
                'error'       => 'ENROLLMENT_INACTIVE',
            ], 403);
        }

        return $next($request);
    }
}
