<?php

declare(strict_types=1);

namespace App\Domains\Auth\Http\Middleware;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Auth\Models\Secretary;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * يتحقق أن المستخدم المصادَق عليه لديه subscription نشطة.
 * يُطبَّق على routes تتطلب اشتراكاً فعالاً.
 */
class EnsureActiveSubscription
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        // التحقق فقط للمدرسين والمنظمات التي لديها subscriptions
        if ($user instanceof Teacher) {
            if (! $this->hasActiveSubscription($user)) {
                return response()->json([
                    'status'      => false,
                    'status_code' => 403,
                    'message'     => 'انتهت صلاحية اشتراكك. يرجى تجديد الاشتراك للمتابعة.',
                    'error'       => 'SUBSCRIPTION_EXPIRED',
                ], 403);
            }
        }

        return $next($request);
    }

    private function hasActiveSubscription(Teacher $teacher): bool
    {
        return \App\Domains\Auth\Models\TeacherSubscription::where('teacher_id', $teacher->id)
            ->where('status', 'active')
            ->where(function ($q) {
                $q->whereNull('ends_at')->orWhere('ends_at', '>=', now());
            })
            ->exists();
    }
}
