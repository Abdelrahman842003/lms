<?php

use Illuminate\Support\Facades\Route;
use App\Domains\Application\Http\Controllers\Guardian\AuthController as GuardianAuthController;
use App\Domains\Application\Http\Controllers\Guardian\SummaryController;
use App\Domains\Application\Http\Controllers\Guardian\NotificationController;

// ============================================
// Guardian (Parent) Authentication Routes
// ============================================
Route::post('/login/parent', [GuardianAuthController::class, 'login'])
    ->middleware(['throttle.login', 'auth.cookies']);
Route::post('/parent/login', [GuardianAuthController::class, 'login'])
    ->middleware(['throttle.login', 'auth.cookies']);

Route::middleware('auth:sanctum')->prefix('parent')->name('parent.')->group(function () {
    Route::post('/logout', [GuardianAuthController::class, 'logout']);
    Route::get('/me', [GuardianAuthController::class, 'me']);
    Route::put('/profile', [GuardianAuthController::class, 'updateProfile']);
    Route::post('/change-password', [GuardianAuthController::class, 'changePassword']);
    Route::get('/children', [GuardianAuthController::class, 'children']);
    
    // Child Summary
    Route::get('/children/{studentId}/summary', [SummaryController::class, 'index']);
    
    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    
    // Device Tokens for FCM
    Route::post('/device-tokens', [\App\Domains\Application\Http\Controllers\Api\DeviceTokenController::class, 'store']);
});
