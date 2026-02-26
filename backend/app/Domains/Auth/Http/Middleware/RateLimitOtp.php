<?php

declare(strict_types=1);

namespace App\Domains\Auth\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Rate limit على إرسال OTP: 3 طلبات/دقيقة لكل رقم هاتف.
 * بعد 10 محاولات فاشلة → حظر 30 دقيقة.
 */
class RateLimitOtp
{
    private const MAX_PER_MINUTE = 3;
    private const LOCKOUT_ATTEMPTS = 10;
    private const LOCKOUT_MINUTES  = 30;

    public function handle(Request $request, Closure $next): Response
    {
        $phone = $request->input('phone');

        if (! $phone) {
            return $next($request);
        }

        $lockoutKey = "otp_lockout:{$phone}";
        $rateKey    = "otp_rate:{$phone}";

        // تحقق من الحظر الطويل
        if (Cache::has($lockoutKey)) {
            $seconds = Cache::get($lockoutKey . '_until', 0) - time();
            return response()->json([
                'status'      => false,
                'status_code' => 429,
                'message'     => 'تم حظرك مؤقتاً. حاول بعد ' . ceil($seconds / 60) . ' دقيقة.',
            ], 429);
        }

        // rate limit في الدقيقة
        $attempts = (int) Cache::get($rateKey, 0);

        if ($attempts >= self::MAX_PER_MINUTE) {
            // تراكم — هل نحتاج lockout؟
            $totalKey   = "otp_total:{$phone}";
            $totalCount = (int) Cache::increment($totalKey);
            Cache::put($totalKey, $totalCount, now()->addHour());

            if ($totalCount >= self::LOCKOUT_ATTEMPTS) {
                $until = now()->addMinutes(self::LOCKOUT_MINUTES);
                Cache::put($lockoutKey, true, $until);
                Cache::put($lockoutKey . '_until', $until->timestamp, $until);
            }

            return response()->json([
                'status'      => false,
                'status_code' => 429,
                'message'     => 'تجاوزت الحد المسموح به. انتظر دقيقة وحاول مجدداً.',
            ], 429);
        }

        // زيادة العداد بـ TTL = دقيقة
        Cache::put($rateKey, $attempts + 1, now()->addMinute());

        return $next($request);
    }
}
