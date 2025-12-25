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
            \App\Http\Middleware\CheckMaintenanceMode::class,
        ]);

        $middleware->append(\Illuminate\Http\Middleware\HandleCors::class);
        
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
        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\HttpException $e, $request) {
            if ($e->getStatusCode() === 419) {
                return response()->json([
                    'message' => 'انتهت صلاحية الجلسة. يرجى إعادة تحميل الصفحة والمحاولة مرة أخرى.'
                ], 419);
            }
        });
    })->create();
