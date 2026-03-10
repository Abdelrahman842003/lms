<?php

declare(strict_types=1);

use App\Domains\Support\Exceptions\DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

if (! function_exists('rescue_api')) {
    /**
     * Wraps a callable in a try/catch and returns a JsonResponse.
     * يُستخدم في Controllers لتبسيط error handling.
     *
     * مثال:
     *   return rescue_api(fn() => $this->ok($action->execute($dto)));
     */
    function rescue_api(callable $callback, string $fallbackMessage = 'حدث خطأ غير متوقع.'): JsonResponse
    {
        try {
            return $callback();
        } catch (DomainException $e) {
            return response()->json([
                'status'      => false,
                'status_code' => $e->getStatusCode(),
                'message'     => $e->getMessage(),
            ], $e->getStatusCode());
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status'      => false,
                'status_code' => 422,
                'message'     => 'بيانات غير صالحة',
                'errors'      => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('rescue_api caught unexpected error', [
                'message' => $e->getMessage(),
                'file'    => $e->getFile(),
                'line'    => $e->getLine(),
            ]);

            return response()->json([
                'status'      => false,
                'status_code' => 500,
                'message'     => app()->isProduction() ? $fallbackMessage : $e->getMessage(),
            ], 500);
        }
    }
}

if (! function_exists('format_arabic_number')) {
    /**
     * تحويل أرقام إنجليزية إلى عربية
     *
     * مثال: format_arabic_number(2026) → '٢٠٢٦'
     */
    function format_arabic_number(int|float $number): string
    {
        if (!class_exists('NumberFormatter')) {
            // Fallback if intl extension is not available
            $western = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
            $eastern = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
            return (string) str_replace($western, $eastern, (string) $number);
        }

        return (string) (new NumberFormatter('ar-EG', NumberFormatter::DECIMAL))->format($number);
    }
}

if (! function_exists('generate_otp')) {
    /**
     * توليد OTP رقمي عشوائي
     *
     * @param int $length طول الرقم (الافتراضي 4)
     * @return string رقم OTP
     */
    function generate_otp(int $length = 4): string
    {
        $min = (int) ('1' . str_repeat('0', $length - 1));
        $max = (int) str_repeat('9', $length);

        return (string) random_int($min, $max);
    }
}
