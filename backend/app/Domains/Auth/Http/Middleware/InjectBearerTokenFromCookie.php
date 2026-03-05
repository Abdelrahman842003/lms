<?php

declare(strict_types=1);

namespace App\Domains\Auth\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Bridge httpOnly access_token cookie to Authorization header.
 *
 * This allows Sanctum token guard (auth:sanctum) to authenticate
 * even after frontend refresh when the in-memory token is empty.
 */
class InjectBearerTokenFromCookie
{
    public function handle(Request $request, Closure $next): Response
    {
        $hasAuthorization = (bool) $request->bearerToken();

        if (!$hasAuthorization) {
            $accessToken = $request->cookie('access_token');

            if (is_string($accessToken) && trim($accessToken) !== '') {
                $request->headers->set('Authorization', 'Bearer '.$accessToken);
            }
        }

        return $next($request);
    }
}
