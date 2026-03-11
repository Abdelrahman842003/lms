<?php

use Illuminate\Support\Facades\Route;
use App\Domains\Application\Http\Controllers\Secretary\AuthController as SecretaryAuthController;
use App\Domains\Application\Http\Controllers\Secretary\NotificationController;

// ============================================
// Secretary Authentication Routes
// ============================================
Route::post('/login/secretary', [SecretaryAuthController::class, 'login'])
    ->middleware(['throttle.login', 'auth.cookies']);

// NOTE: Secretary routes do not currently have EnsureSecretaryIsActive middleware.
// The Secretary model has an is_active boolean field that should be checked.
// TODO: Add EnsureSecretaryIsActive middleware to prevent inactive secretaries from accessing the API.
Route::middleware('auth:sanctum')->prefix('secretary')->name('secretary.')->group(function () {
    Route::post('/logout', [SecretaryAuthController::class, 'logout']);
    Route::get('/me', [SecretaryAuthController::class, 'me']);
    Route::post('/change-password', [SecretaryAuthController::class, 'changePassword']);
    
    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications', [NotificationController::class, 'store']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
});
