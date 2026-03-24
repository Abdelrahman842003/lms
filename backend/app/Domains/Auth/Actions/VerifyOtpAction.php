<?php

declare(strict_types=1);

namespace App\Domains\Auth\Actions;

use App\Domains\Auth\DTOs\LoginDTO;
use App\Domains\Application\Exceptions\DomainException;
use Illuminate\Support\Facades\Cache;

/**
 * يتحقق من صحة OTP المُرسل ويُعيد بيانات المصادقة.
 *
 * قواعد الأمان:
 *  - OTP يُحذف فوراً بعد الاستخدام الناجح (single-use)
 *  - انتهاء الصلاحية يُعالَج بـ Cache TTL
 *  - عدد المحاولات يُعالَج في Middleware
 */
final class VerifyOtpAction
{
    public function execute(string $phone, string $otp): bool
    {
        $cachedOtp = Cache::get("otp:{$phone}");

        if ($cachedOtp === null) {
            throw new DomainException('انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.');
        }

        if ($cachedOtp !== $otp) {
            throw new DomainException('رمز التحقق غير صحيح.');
        }

        // حذف OTP فوراً بعد الاستخدام الناجح
        Cache::forget("otp:{$phone}");

        return true;
    }
}
