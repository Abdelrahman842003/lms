<?php

declare(strict_types=1);

namespace App\Domains\Auth\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserNotSuspended
{
    /**
     * Cache TTL for suspension status (5 minutes)
     */
    private const TTL = 300;

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string|null  $guard The guard to check (teacher, secretary, student)
     */
    public function handle(Request $request, Closure $next, ?string $guard = null): Response
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        // 1. Global Suspension Check (with Cache)
        $cacheKey = "user:{$user->id}:suspension_status";
        $suspensionStatus = Cache::remember($cacheKey, self::TTL, function () use ($user) {
            return [
                'is_suspended' => $user->status === 'suspended',
                'is_approved' => $user->is_approved,
                'is_independent_active' => $user->is_independent_active ?? false,
            ];
        });

        if ($suspensionStatus['is_suspended']) {
            return response()->json([
                'message' => 'Your account is suspended.',
                'error' => 'ACCOUNT_SUSPENDED'
            ], 403);
        }

        if (!$suspensionStatus['is_approved']) {
            return response()->json([
                'message' => 'حسابك قيد المراجعة ولم تتم الموافقة عليه بعد.',
                'error' => 'ACCOUNT_NOT_APPROVED'
            ], 403);
        }

        // 2. Guard-Specific Checks
        return match($guard) {
            'teacher' => $this->handleTeacherCheck($request, $next, $user, $cacheKey),
            'secretary' => $this->handleSecretaryCheck($request, $next, $user),
            default => $next($request),
        };
    }

    /**
     * Handle teacher-specific suspension checks
     */
    private function handleTeacherCheck(Request $request, Closure $next, mixed $user, string $cacheKey): Response
    {
        $academyId = $request->header('X-Academy-Id');

        if ($academyId === 'independent') {
            // Check Independent Status (cached)
            if (!$user->is_independent_active) {
                return response()->json([
                    'message' => 'حسابك كمستقل معلق حالياً.',
                    'error' => 'INDEPENDENT_ACCOUNT_SUSPENDED'
                ], 403);
            }
        } elseif ($academyId && is_numeric($academyId)) {
            // Check Academy Status (cached per academy)
            $academyCacheKey = "user:{$user->id}:academy:{$academyId}:is_active";
            $isActive = Cache::remember($academyCacheKey, self::TTL, function () use ($user, $academyId) {
                $academy = $user->academies()->where('academy_id', $academyId)->first();
                return $academy ? $academy->pivot->is_active : true;
            });

            if (!$isActive) {
                return response()->json([
                    'message' => 'حسابك في هذه الأكاديمية معلق حالياً.',
                    'error' => 'ACADEMY_ACCOUNT_SUSPENDED'
                ], 403);
            }
        }

        return $next($request);
    }

    /**
     * Handle secretary-specific suspension checks
     */
    private function handleSecretaryCheck(Request $request, Closure $next, mixed $user): Response
    {
        // For secretaries with associated teacher account
        if ($user->teacher && $user->teacher->status === 'suspended') {
            return response()->json([
                'message' => 'عذراً، لا يمكن الدخول للنظام حالياً. يرجى التواصل مع الإدارة للمساعدة.',
                'error' => 'TEACHER_SUSPENDED'
            ], 403);
        }

        return $next($request);
    }
}
