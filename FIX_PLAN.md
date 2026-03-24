# 🔧 خطة الإصلاح

---

## 🔴 Issue 1: Rate Limiter Security Bypass (Critical)

**الملف:** `backend/app/Domains/Application/Http/Middleware/ApiRateLimiter.php`

### التغيير المطلوب:

**قبل:**
```php
<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiRateLimiter
{
    public function handle(Request $request, Closure $next, string $limiter = 'api'): Response
    {
        // Allow internal requests to bypass rate limiting
        // This is useful for internal service-to-service communication
        if ($request->hasHeader('X-Internal-Request')) {
            return $next($request);
        }

        // Allow webhooks from trusted services to bypass rate limiting
        if ($this->isTrustedWebhook($request)) {
            return $next($request);
        }

        // Delegate to Laravel's throttle middleware
        return app(\Illuminate\Routing\Middleware\ThrottleRequests::class)
            ->handle($request, $next, $limiter);
    }

    protected function isTrustedWebhook(Request $request): bool
    {
        // Check for webhook signature headers from payment providers
        $webhookSignatures = [
            'X-Stripe-Signature',
            'X-Paymob-Signature',
            'X-Webhook-Signature',
        ];

        foreach ($webhookSignatures as $header) {
            if ($request->hasHeader($header)) {
                // Verify the webhook is coming to a webhook endpoint
                if (str_contains($request->path(), 'webhook')) {
                    return true;
                }
            }
        }

        return false;
    }
}
```

**بعد:**
```php
<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiRateLimiter
{
    public function handle(Request $request, Closure $next, string $limiter = 'api'): Response
    {
        return app(\Illuminate\Routing\Middleware\ThrottleRequests::class)
            ->handle($request, $next, $limiter);
    }
}
```

---

## 🟠 Issue 2: Extension Spoofing Map (Medium)

**الملف:** `backend/app/Domains/Support/Services/FileUploadValidator.php`

### التغيير المطلوب (سطر 128-139):

**قبل:**
```php
$extensionMimeMap = [
    'jpg' => ['image/jpeg'],
    'jpeg' => ['image/jpeg'],
    'png' => ['image/png'],
    'gif' => ['image/gif'],
    'webp' => ['image/webp'],
    'mp4' => ['video/mp4'],
    'mov' => ['video/quicktime'],
    'pdf' => ['application/pdf'],
    'doc' => ['application/msword'],
    'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
];
```

**بعد:**
```php
$extensionMimeMap = [
    // Images
    'jpg' => ['image/jpeg'],
    'jpeg' => ['image/jpeg'],
    'png' => ['image/png'],
    'gif' => ['image/gif'],
    'webp' => ['image/webp'],
    // Videos
    'mp4' => ['video/mp4'],
    'mov' => ['video/quicktime'],
    'avi' => ['video/x-msvideo'],
    'webm' => ['video/webm'],
    // Audio
    'mp3' => ['audio/mpeg'],
    'wav' => ['audio/wav'],
    'ogg' => ['audio/ogg'],
    'weba' => ['audio/webm'],
    // Documents
    'pdf' => ['application/pdf'],
    'doc' => ['application/msword'],
    'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
];
```

---

## 📄 ملخص التغييرات

| الملف | نوع التغيير |
|-------|-------------|
| `ApiRateLimiter.php` | حذف bypass logic + دالة `isTrustedWebhook()` |
| `FileUploadValidator.php` | إضافة 5 أنواع جديدة للـ extension map |

---

## ✅ النتيجة المتوقعة

1. **Rate Limiter** - كل الـ requests هتمر بـ rate limiting بدون أي bypass
2. **File Upload** - حماية أفضل من extension spoofing لكل أنواع الملفات
