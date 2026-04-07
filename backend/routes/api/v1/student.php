<?php

use Illuminate\Support\Facades\Route;
use App\Domains\Application\Http\Controllers\Student\AuthController as StudentAuthController;
use App\Domains\Application\Http\Controllers\Student\StudentAttendanceController;
use App\Domains\Application\Http\Controllers\Student\StudentExamController;
use App\Domains\Application\Http\Controllers\Student\StudentLectureController;
use App\Domains\Application\Http\Controllers\Student\NotificationController;
use App\Domains\Application\Http\Controllers\Student\GamificationController;
use App\Domains\Application\Http\Controllers\Student\AchievementController;
use App\Domains\Application\Http\Controllers\Student\MistakesController;
use App\Domains\Application\Http\Controllers\Student\VideoController;
use App\Domains\Application\Http\Controllers\Student\StudentVideoQuizController;
use App\Domains\Application\Http\Controllers\Student\StudentDashboardController;
use App\Domains\Auth\Http\Middleware\EnsureTeacherNotSuspendedForStudent;

// ============================================
// Student Authentication Routes
// ============================================
Route::post('/login/student', [StudentAuthController::class, 'login'])
    ->middleware(['throttle:auth', 'auth.cookies']);

Route::middleware(['auth:sanctum', EnsureTeacherNotSuspendedForStudent::class])->prefix('student')->group(function () {
    Route::post('/logout', [StudentAuthController::class, 'logout']);
    Route::get('/me', [StudentAuthController::class, 'me']);
    Route::post('/change-password', [StudentAuthController::class, 'changePassword']);
    
    // Attendance - Rate limited to prevent spam
    Route::middleware('throttle:attendance')->post('/attend', [StudentAttendanceController::class, 'markAttendance']);
    Route::get('/exams', [StudentExamController::class, 'index']);
    Route::get('/lectures', [StudentLectureController::class, 'index']);
    Route::get('/attendance', [StudentAttendanceController::class, 'index']);
    Route::get('/dashboard', [StudentDashboardController::class, 'getDashboard']);
    
    // Exam Taking Routes - Rate limited answer submission
    Route::get('/exams/{exam}', [StudentExamController::class, 'show']);
    Route::post('/exams/{exam}/start', [StudentExamController::class, 'start']);
    Route::middleware('throttle:exam-submit')->group(function () {
        Route::post('/exams/attempts/{attempt}/answer', [StudentExamController::class, 'submitAnswer']);
        Route::post('/exams/attempts/{attempt}/skip', [StudentExamController::class, 'skipQuestion']);
    });
    Route::post('/exams/attempts/{attempt}/terminate', [StudentExamController::class, 'terminate']);
    Route::get('/exams/attempts/{attempt}/status', [StudentExamController::class, 'attemptStatus']);
    Route::get('/exams/{exam}/result', [StudentExamController::class, 'result']);
    
    // Teacher Selection & Dashboard
    Route::get('/teachers', [StudentAuthController::class, 'teachers']);
    Route::get('/teachers/{teacher}/dashboard', [StudentAuthController::class, 'teacherDashboard']);
    
    // Notifications - Rate limited
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::middleware('throttle:notifications')->group(function () {
        Route::post('/notifications', [NotificationController::class, 'store']);
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    });
    
    // Gamification
    Route::get('/points', [GamificationController::class, 'index']);
    Route::get('/points/{teacher}', [GamificationController::class, 'show']);
    Route::get('/points/{teacher}/history', [GamificationController::class, 'history']);
    Route::get('/leaderboard/{teacher}', [GamificationController::class, 'leaderboard']);
    
    // Achievements (إنجازاتي)
    Route::get('/achievements', [AchievementController::class, 'index']);
    Route::get('/achievements/certificate/{history}/download', [AchievementController::class, 'downloadCertificate']);
    
    // Mistakes (Smart Mistakes Notebook)
    Route::get('/mistakes', [MistakesController::class, 'index']);
    Route::post('/mistakes/{id}/mastered', [MistakesController::class, 'markAsMastered']);
    
    // Educational Videos
    Route::get('/videos', [VideoController::class, 'index']);
    Route::get('/videos/{video}', [VideoController::class, 'show']);
    Route::post('/videos/{video}/playback-token', [VideoController::class, 'issuePlaybackToken'])
        ->middleware('throttle:video-playback');
    Route::get('/videos/{video}/stream-url', [VideoController::class, 'streamUrl'])
        ->middleware('throttle:video-playback');
    Route::get('/videos/{video}/thumbnail', [VideoController::class, 'thumbnail']);
    Route::get('/videos/{video}/attachments/{attachmentId}', [VideoController::class, 'downloadAttachment']);
    Route::get('/videos/{video}/attachments/{attachmentId}/view-url', [VideoController::class, 'attachmentViewUrl']);
    Route::post('/videos/{video}/progress', [VideoController::class, 'updateProgress']);
    Route::post('/videos/{video}/like', [VideoController::class, 'toggleLike']);
    
    // Video Quiz
    Route::get('/videos/{video}/quiz', [StudentVideoQuizController::class, 'show']);
    Route::post('/videos/{video}/quiz/submit', [StudentVideoQuizController::class, 'submit']);
    Route::get('/videos/{video}/quiz/attempts', [StudentVideoQuizController::class, 'attempts']);
});
