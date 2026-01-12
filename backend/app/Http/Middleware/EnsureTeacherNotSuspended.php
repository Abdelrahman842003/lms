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
        if ($request->user() && $request->user()->status === 'suspended') {
            return response()->json([
                'message' => 'Your account is suspended.',
                'error' => 'ACCOUNT_SUSPENDED'
            ], 403);
        }

        if ($request->user() && !$request->user()->is_approved) {
            return response()->json([
                'message' => 'حسابك قيد المراجعة ولم تتم الموافقة عليه بعد.',
                'error' => 'ACCOUNT_NOT_APPROVED'
            ], 403);
        }

        return $next($request);
    }
}
