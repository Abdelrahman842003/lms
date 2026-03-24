<?php

use Illuminate\Support\Facades\Route;
use App\Domains\Application\Http\Controllers\Api\BroadcastAuthController;
use App\Domains\Application\Http\Controllers\Api\DeviceTokenController;
use App\Domains\Application\Http\Controllers\Api\PublicController;
use App\Domains\Application\Http\Controllers\Api\RefreshTokenController;
use App\Domains\Application\Http\Controllers\Api\MediaProxyController;

// ============================================
// API Version 1
// ============================================
Route::prefix('v1')->group(function () {

    // ============================================
    // Broadcasting Authentication Route
    // ============================================
    Route::middleware('auth:sanctum')->post('/broadcasting/auth',
        [\App\Domains\Application\Http\Controllers\Api\BroadcastAuthController::class, 'authenticate']
    );

    // ============================================
    // Academy Routes
    // ============================================
    require __DIR__.'/api/v1/academy.php';

    // ============================================
    // Teacher Routes
    // ============================================
    require __DIR__.'/api/v1/teacher.php';

    // ============================================
    // Student Routes
    // ============================================
    require __DIR__.'/api/v1/student.php';

    // ============================================
    // Guardian (Parent) Routes
    // ============================================
    require __DIR__.'/api/v1/guardian.php';

    // ============================================
    // Secretary Routes
    // ============================================
    require __DIR__.'/api/v1/secretary.php';

    // ============================================
    // Avatar Routes (All User Types) - Rate Limited
    // ============================================
    Route::middleware(['auth:sanctum', 'throttle:avatar-upload'])->group(function () {
        Route::post('/avatar/upload', [\App\Domains\Application\Http\Controllers\Media\AvatarController::class, 'upload']);
    });
    Route::middleware('auth:sanctum')->group(function () {
        Route::delete('/avatar', [\App\Domains\Application\Http\Controllers\Media\AvatarController::class, 'delete']);
        Route::get('/avatar', [\App\Domains\Application\Http\Controllers\Media\AvatarController::class, 'show']);
    });

    // ============================================
    // Token Management Routes - Rate Limited
    // ============================================
    Route::middleware('throttle:token-refresh')->post('/auth/refresh', [\App\Domains\Application\Http\Controllers\Api\RefreshTokenController::class, 'refresh']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [\App\Domains\Application\Http\Controllers\Api\RefreshTokenController::class, 'logout']);
        Route::post('/auth/logout-current', [\App\Domains\Auth\Http\Controllers\TokenController::class, 'logoutCurrent']);
        Route::post('/auth/logout-others', [\App\Domains\Auth\Http\Controllers\TokenController::class, 'logoutOtherDevices']);
        Route::get('/auth/token-info', [\App\Domains\Auth\Http\Controllers\TokenController::class, 'tokenInfo']);
    });

    // ============================================
    // Public Settings
    // ============================================
    Route::get('/public-settings', [\App\Domains\Application\Http\Controllers\Api\PublicController::class, 'publicSettings']);

    // ============================================
    // Media Proxy Routes (Stream files from R2) — auth:sanctum required to prevent unauthorized access
    // Rate limited to prevent abuse
    // ============================================
    Route::middleware(['auth:sanctum', 'throttle:video-stream'])->group(function () {
        Route::get('/media/voice/{path}', [\App\Domains\Application\Http\Controllers\Api\MediaProxyController::class, 'voice'])
            ->where('path', '.*');
        Route::get('/media/{path}', [\App\Domains\Application\Http\Controllers\Api\MediaProxyController::class, 'media'])
            ->where('path', '.*');
    });

    // ============================================
    // Fallback login route for unauthenticated API requests
    // ============================================
    Route::get('/login', function () {
        return response()->json(['message' => 'Unauthenticated.'], 401);
    })->name('login');
});
