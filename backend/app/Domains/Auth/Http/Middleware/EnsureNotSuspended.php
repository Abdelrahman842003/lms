<?php

declare(strict_types=1);

namespace App\Domains\Auth\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Domains\Auth\Models\Teacher;

class EnsureNotSuspended
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string|null  $type The type of check: 'user', 'teacher', 'secretary_teacher'
     */
    public function handle(Request $request, Closure $next, ?string $type = 'user'): Response
    {
        return match ($type) {
            'user' => $this->handleUserCheck($request, $next),
            'teacher' => $this->handleTeacherCheck($request, $next),
            'secretary_teacher' => $this->handleSecretaryTeacherCheck($request, $next),
            default => $this->handleUserCheck($request, $next),
        };
    }

    /**
     * Check if the authenticated user is suspended.
     */
    protected function handleUserCheck(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        // Global Suspension Check
        if ($user->status === 'suspended') {
            return response()->json([
                'message' => 'Your account is suspended.',
                'error' => 'ACCOUNT_SUSPENDED'
            ], 403);
        }

        // Partial Suspension Check (Context-based)
        $academyId = $request->header('X-Academy-Id');

        if ($academyId === 'independent') {
            // Check Independent Status
            if (!$user->is_independent_active) {
                return response()->json([
                    'message' => 'حسابك كمستقل معلق حالياً.',
                    'error' => 'INDEPENDENT_ACCOUNT_SUSPENDED'
                ], 403);
            }
        } elseif ($academyId && is_numeric($academyId)) {
            // Check Academy Status
            $academy = $user->academies()->where('academy_id', $academyId)->first();

            if ($academy && !$academy->pivot->is_active) {
                return response()->json([
                    'message' => 'حسابك في هذه الأكاديمية معلق حالياً.',
                    'error' => 'ACADEMY_ACCOUNT_SUSPENDED'
                ], 403);
            }
        }

        if (!$user->is_approved) {
            return response()->json([
                'message' => 'حسابك قيد المراجعة ولم تتم الموافقة عليه بعد.',
                'error' => 'ACCOUNT_NOT_APPROVED'
            ], 403);
        }

        return $next($request);
    }

    /**
     * Check if a teacher (from request input or route param) is suspended.
     * Used for student access to teacher data.
     */
    protected function handleTeacherCheck(Request $request, Closure $next): Response
    {
        $teacherId = null;

        // 1. Check for 'teacher_id' in request input (query or body)
        if ($request->has('teacher_id')) {
            $teacherId = $request->input('teacher_id');
        }
        // 2. Check for 'teacher' route parameter
        elseif ($request->route('teacher')) {
            $teacherParam = $request->route('teacher');
            // Route param could be an ID string or a Model instance if binding is used
            $teacherId = $teacherParam instanceof Teacher ? $teacherParam->id : $teacherParam;
        }

        if ($teacherId) {
            $teacher = Teacher::find($teacherId);

            if ($teacher && $teacher->status === 'suspended') {
                return response()->json([
                    'message' => "عفواً، هذا المدرس ({$teacher->name}) معلق حالياً ولا يمكن الوصول لبياناته.",
                    'error' => 'TEACHER_SUSPENDED'
                ], 403);
            }
        }

        return $next($request);
    }

    /**
     * Check if the secretary's teacher is suspended.
     */
    protected function handleSecretaryTeacherCheck(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->teacher && $user->teacher->status === 'suspended') {
            return response()->json([
                'message' => 'عذراً، لا يمكن الدخول للنظام حالياً. يرجى التواصل مع الإدارة للمساعدة.',
                'error' => 'TEACHER_SUSPENDED'
            ], 403);
        }

        return $next($request);
    }
}
