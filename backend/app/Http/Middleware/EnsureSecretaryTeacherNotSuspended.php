<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSecretaryTeacherNotSuspended
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->teacher && $user->teacher->is_suspended) {
            return response()->json([
                'message' => 'عذراً، لا يمكن الدخول للنظام حالياً. يرجى التواصل مع الإدارة للمساعدة.',
                'error' => 'TEACHER_SUSPENDED'
            ], 403);
        }

        return $next($request);
    }
}
