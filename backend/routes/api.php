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
    require __DIR__.'/academy.php';

    // ============================================
    // Teacher Routes
    // ============================================
    require __DIR__.'/teacher.php';

    // ============================================
    // Student Routes
    // ============================================
    require __DIR__.'/student.php';

    // ============================================
    // Guardian (Parent) Routes
    // ============================================
    require __DIR__.'/guardian.php';

    // ============================================
    // Secretary Routes
    // ============================================
    require __DIR__.'/secretary.php';

    // ============================================
    // Avatar Routes (All User Types)
    // ============================================
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/avatar/upload', [\App\Domains\Application\Http\Controllers\Media\AvatarController::class, 'upload']);
        Route::delete('/avatar', [\App\Domains\Application\Http\Controllers\Media\AvatarController::class, 'delete']);
        Route::get('/avatar', [\App\Domains\Application\Http\Controllers\Media\AvatarController::class, 'show']);
    });

    // ============================================
    // Public Settings
    // ============================================
    Route::get('/public-settings', [\App\Domains\Application\Http\Controllers\Api\PublicController::class, 'publicSettings']);

    // ============================================
    // Media Proxy Routes (Stream files from R2) — auth:sanctum required to prevent unauthorized access
    // ============================================
    Route::middleware('auth:sanctum')->group(function () {
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
