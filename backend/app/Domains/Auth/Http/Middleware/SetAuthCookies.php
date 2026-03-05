<?php

declare(strict_types=1);

namespace App\Domains\Auth\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to set authentication tokens as httpOnly cookies
 * This improves security by preventing XSS attacks from accessing tokens
 */
class SetAuthCookies
{
    /**
     * Handle an incoming request.
     * Sets auth tokens as httpOnly, secure, sameSite cookies
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        $domain = config('session.domain');
        $secure = $this->shouldUseSecureCookie($request);
        $sameSite = config('session.same_site') ?: 'lax';

        // Only process successful JSON responses with token data
        $contentType = $response->headers->get('content-type');
        if (!$contentType || !str_contains($contentType, 'application/json')) {
            return $response;
        }

        if ($response->status() > 299) {
            return $response;
        }

        // Get response content to check for tokens
        $content = $response->getContent();
        if (!$content) {
            return $response;
        }

        $data = json_decode($content, true);
        if (!is_array($data) || !isset($data['data'])) {
            return $response;
        }

        $tokenData = $data['data'];

        // Set access token as httpOnly cookie (short-lived)
        if (isset($tokenData['token'])) {
            $response->withCookie(cookie(
                'access_token',
                $tokenData['token'],
                60, // 60 minutes
                '/',
                $domain,
                $secure, // secure only when request/session config requires it
                true, // httpOnly (not accessible via JavaScript)
                false, // raw
                $sameSite
            ));
        }

        // Set refresh token as httpOnly cookie (long-lived)
        if (isset($tokenData['refresh_token'])) {
            $response->withCookie(cookie(
                'refresh_token',
                $tokenData['refresh_token'],
                525600, // 365 days
                '/',
                $domain,
                $secure, // secure only when request/session config requires it
                true, // httpOnly
                false, // raw
                $sameSite
            ));
        }

        return $response;
    }

    /**
     * Clear auth cookies
     */
    public static function clearCookies(Response $response): Response
    {
        $domain = config('session.domain');
        $secure = (bool) (config('session.secure') ?? app()->environment('production'));
        $sameSite = config('session.same_site') ?: 'lax';

        return $response
            ->withCookie(cookie(
                'access_token',
                null,
                -2628000,
                '/',
                $domain,
                $secure,
                true,
                false,
                $sameSite
            ))
            ->withCookie(cookie(
                'refresh_token',
                null,
                -2628000,
                '/',
                $domain,
                $secure,
                true,
                false,
                $sameSite
            ));
    }

    private function shouldUseSecureCookie(Request $request): bool
    {
        $sessionSecure = config('session.secure');
        if ($sessionSecure !== null) {
            return (bool) $sessionSecure;
        }

        return $request->isSecure() || app()->environment('production');
    }
}
