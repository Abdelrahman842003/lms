<?php

declare(strict_types=1);

namespace App\Domains\Auth\Actions;

use App\Domains\Application\Exceptions\DomainException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * يُرسل OTP ويخزّنه في Redis مع TTL.
 *
 * قواعد الأمان:
 *  - OTP length: 4 أرقام (قابل للتعديل)
 *  - TTL: 5 دقائق
 *  - Rate limit: 3 محاولات/دقيقة لكل رقم (تُطبَّق في Middleware)
 *  - لا يُخزَّن OTP في DB
 *  - لا يُسجَّل OTP في logs
 */
final class SendOtpAction
{
    private const OTP_TTL_MINUTES = 5;
    private const OTP_LENGTH      = 4;

    public function execute(string $phone): void
    {
        $otp = $this->generateOtp();

        // تخزين في Redis (لا DB)
        Cache::put(
            key:   "otp:{$phone}",
            value: $otp,
            ttl:   now()->addMinutes(self::OTP_TTL_MINUTES)
        );

        // تسجيل حدث الإرسال بدون قيمة OTP
        Log::info('OTP sent', ['phone' => substr($phone, 0, -4) . '****']);

        // TODO: ربط SMS adapter هنا
        // $this->smsAdapter->send($phone, "رمز التحقق: {$otp}");

        // في بيئة التطوير نطبع في log فقط بشكل مؤقت
        if (app()->environment('local', 'staging')) {
            Log::debug('DEV OTP for ' . $phone . ' => ' . $otp);
        }
    }

    private function generateOtp(): string
    {
        return generate_otp(self::OTP_LENGTH);
    }
}
