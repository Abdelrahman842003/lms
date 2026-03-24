<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Custom API Rate Limiter Middleware.
 *
 * This middleware provides flexible rate limiting for API endpoints with
 * the ability to bypass rate limiting for internal requests.
 *
 * Usage:
 * - Route::middleware('throttle:api')->group(...)
 * - Route::middleware('throttle:auth')->group(...)
 * - Route::middleware('throttle:payments')->group(...)
 */
class ApiRateLimiter
{
    /**
     * Handle an incoming request.
     *
     * @param Request $request
     * @param Closure $next
     * @param string $limiter The name of the rate limiter to use
     * @return Response
     */
    public function handle(Request $request, Closure $next, string $limiter = 'api'): Response
    {
        return app(\Illuminate\Routing\Middleware\ThrottleRequests::class)
            ->handle($request, $next, $limiter);
    }
}
