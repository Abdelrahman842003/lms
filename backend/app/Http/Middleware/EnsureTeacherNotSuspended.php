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
        // 1. Global Suspension Check
        if ($request->user() && $request->user()->status === 'suspended') {
            return response()->json([
                'message' => 'Your account is suspended.',
                'error' => 'ACCOUNT_SUSPENDED'
            ], 403);
        }

        // 2. Partial Suspension Check (Context-based)
        if ($request->user()) {
            $academyId = $request->header('X-Academy-Id');
            
            if ($academyId === 'independent') {
                // Check Independent Status
                if (!$request->user()->is_independent_active) {
                    return response()->json([
                        'message' => 'حسابك كمستقل معلق حالياً.',
                        'error' => 'INDEPENDENT_ACCOUNT_SUSPENDED'
                    ], 403);
                }
            } elseif ($academyId && is_numeric($academyId)) {
                // Check Academy Status
                // We need to check the pivot status for this specific academy
                $academy = $request->user()->academies()->where('academy_id', $academyId)->first();
                
                if ($academy && !$academy->pivot->is_active) {
                    return response()->json([
                        'message' => 'حسابك في هذه الأكاديمية معلق حالياً.',
                        'error' => 'ACADEMY_ACCOUNT_SUSPENDED'
                    ], 403);
                }
            }
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
