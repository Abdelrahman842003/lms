<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTeacherNotSuspended
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && $request->user()->is_suspended) {
            return response()->json([
                'message' => 'عفواً، تم تعليق حسابك. يرجى التواصل مع الإدارة.',
                'error' => 'ACCOUNT_SUSPENDED'
            ], 403);
        }

        return $next($request);
    }
}
