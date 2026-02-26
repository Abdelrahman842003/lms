<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(prepend: [
            // \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            \App\Domains\Support\Http\Middleware\CheckMaintenanceMode::class,
        ]);

        $middleware->append(\Illuminate\Http\Middleware\HandleCors::class);

        // Register middleware aliases
        $middleware->alias([
            'auth.cookies' => \App\Domains\Auth\Http\Middleware\SetAuthCookies::class,
            'throttle.login' => \App\Domains\Auth\Http\Middleware\LoginThrottleMiddleware::class,
        ]);
        
        $middleware->validateCsrfTokens(except: [
            'api/student/attend',
            'api/teacher/lectures/*/attendance',
            'api/teacher/lectures/*/qr-code',
            'api/teacher/lectures/*/toggle-active',
            'api/broadcasting/auth',
            'api/teacher/lectures',
        ]);
    })

    ->withExceptions(function (Exceptions $exceptions): void {
        // معالجة ValidationException
        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, $request) {
            return response()->json([
                'status' => false,
                'status_code' => 422,
                'message' => 'البيانات المدخلة غير صالحة',
                'errors' => $e->errors(),
            ], 422);
        });

        // معالجة ModelNotFoundException (firstOrFail, findOrFail)
        $exceptions->render(function (\Illuminate\Database\Eloquent\ModelNotFoundException $e, $request) {
            $model = class_basename($e->getModel());
            $messages = [
                'Student' => 'الطالب غير موجود',
                'Enrollment' => 'الطالب غير مسجل',
                'Teacher' => 'المدرس غير موجود',
                'Lecture' => 'المحاضرة غير موجودة',
                'Exam' => 'الامتحان غير موجود',
                'Grade' => 'الصف الدراسي غير موجود',
                'Group' => 'المجموعة غير موجودة',
                'Secretary' => 'السكرتير غير موجود',
                'PaymentLog' => 'عملية الدفع غير موجودة',
                'Question' => 'السؤال غير موجود',
                'ExamResult' => 'نتيجة الامتحان غير موجودة',
                'Attendance' => 'سجل الحضور غير موجود',
                'QrCode' => 'رمز QR غير موجود',
                'SyncError' => 'خطأ المزامنة غير موجود',
            ];
            
            return response()->json([
                'status' => false,
                'status_code' => 404,
                'message' => $messages[$model] ?? 'العنصر المطلوب غير موجود',
            ], 404);
        });

        // معالجة AuthenticationException
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            // Only return JSON for API requests; let Filament/web handle its own redirects
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'status' => false,
                    'status_code' => 401,
                    'message' => 'غير مصرح لك بالدخول. يرجى تسجيل الدخول.',
                ], 401);
            }
        });

        // معالجة AuthorizationException
        $exceptions->render(function (\Illuminate\Auth\Access\AuthorizationException $e, $request) {
            return response()->json([
                'status' => false,
                'status_code' => 403,
                'message' => 'غير مصرح لك بهذا الإجراء',
            ], 403);
        });

        // معالجة HttpException (419, 403, 404, 429, 500, etc.)
        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\HttpException $e, $request) {
            $messages = [
                400 => 'طلب غير صالح',
                401 => 'غير مصرح لك بالدخول. يرجى تسجيل الدخول.',
                403 => 'غير مصرح لك بهذا الإجراء',
                404 => 'الصفحة المطلوبة غير موجودة',
                405 => 'طريقة الطلب غير مسموحة',
                419 => 'انتهت صلاحية الجلسة. يرجى إعادة تحميل الصفحة.',
                422 => 'البيانات المدخلة غير صالحة',
                429 => 'تم تجاوز الحد المسموح من الطلبات. يرجى الانتظار.',
                500 => 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.',
                503 => 'الخدمة غير متاحة حالياً. يرجى المحاولة لاحقاً.',
            ];

            $code = $e->getStatusCode();
            $message = $messages[$code] ?? 'حدث خطأ غير متوقع';

            return response()->json([
                'status' => false,
                'status_code' => $code,
                'message' => $message,
            ], $code);
        });

        // معالجة QueryException (أخطاء قاعدة البيانات)
        $exceptions->render(function (\Illuminate\Database\QueryException $e, $request) {
            \Log::error('Database Error: ' . $e->getMessage(), [
                'sql' => $e->getSql() ?? 'N/A',
                'bindings' => $e->getBindings() ?? [],
            ]);
            
            // التحقق من الأخطاء الشائعة
            if (str_contains($e->getMessage(), 'Duplicate entry')) {
                return response()->json([
                    'status' => false,
                    'status_code' => 422,
                    'message' => 'هذا العنصر موجود بالفعل',
                ], 422);
            }

            if (str_contains($e->getMessage(), 'foreign key constraint')) {
                return response()->json([
                    'status' => false,
                    'status_code' => 422,
                    'message' => 'لا يمكن حذف هذا العنصر لارتباطه ببيانات أخرى',
                ], 422);
            }

            return response()->json([
                'status' => false,
                'status_code' => 500,
                'message' => 'حدث خطأ في قاعدة البيانات. يرجى المحاولة لاحقاً.',
            ], 500);
        });

        // معالجة أي Exception آخر (يجب أن يكون آخر render)
        $exceptions->render(function (\Throwable $e, $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                \Log::error('Unhandled Exception: ' . $e->getMessage(), [
                    'exception' => get_class($e),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ]);
                
                return response()->json([
                    'status' => false,
                    'status_code' => 500,
                    'message' => 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
                ], 500);
            }
        });
    })->create();
