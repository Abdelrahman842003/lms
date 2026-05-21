<?php

declare(strict_types=1);

namespace App\Domains\Auth\Http\Middleware;

use App\Domains\Auth\Services\LoginAttemptService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LoginThrottleMiddleware
{
    protected LoginAttemptService $loginAttemptService;

    public function __construct(LoginAttemptService $loginAttemptService)
    {
        $this->loginAttemptService = $loginAttemptService;
    }

    /**
     * Handle an incoming request.
     * Check if the user is banned from login attempts
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Get identifier from request (phone or username)
        $identifier = $request->input('phone') 
            ?? $request->input('username');

        if (!$identifier) {
            return $next($request);
        }

        $ip = $request->ip();

        // Check if blocked
        if ($this->loginAttemptService->isBlocked($identifier, $ip)) {
            $remainingTime = $this->loginAttemptService->getRemainingBanTime($identifier, $ip);
            
            return response()->json([
                'status' => false,
                'status_code' => 429,
                'message' => 'تم حظرك مؤقتاً بسبب محاولات تسجيل دخول فاشلة متعددة',
                'data' => [
                    'retry_after' => $remainingTime,
                    'retry_after_formatted' => $this->formatSeconds($remainingTime),
                ]
            ], 429);
        }

        return $next($request);
    }

    /**
     * Format seconds to human readable Arabic format
     */
    protected function formatSeconds(?int $seconds): string
    {
        if ($seconds === null || $seconds <= 0) {
            return 'الآن';
        }

        if ($seconds < 60) {
            return $seconds . ' ثانية';
        }

        $minutes = ceil($seconds / 60);
        return $minutes . ' دقيقة';
    }
}
