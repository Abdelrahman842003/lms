<?php

use App\Http\Controllers\Admin\AuthController as AdminAuthController;
use App\Http\Controllers\Teacher\AuthController as TeacherAuthController;
use App\Http\Controllers\Student\AuthController as StudentAuthController;
use App\Http\Controllers\Secretary\AuthController as SecretaryAuthController;
use App\Http\Controllers\Teacher\ExamController;
use App\Http\Controllers\Teacher\LectureController;
use App\Http\Controllers\Teacher\TeacherController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// ============================================
// Broadcasting Authentication Route
// ============================================
Route::middleware('auth:sanctum')->post('/broadcasting/auth', 
    [\App\Http\Controllers\Api\BroadcastAuthController::class, 'authenticate']
);

// ============================================
// Admin Authentication Routes (Central DB)
// ============================================
Route::prefix('admin')->name('admin.')->group(function () {
    Route::post('/login', [AdminAuthController::class, 'login']);
    Route::post('/register', [AdminAuthController::class, 'register']);
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AdminAuthController::class, 'logout']);
        Route::get('/me', [AdminAuthController::class, 'me']);
        Route::put('/profile', [AdminAuthController::class, 'updateProfile']);
        Route::post('/change-password', [AdminAuthController::class, 'changePassword']);
        Route::get('/teachers', [AdminAuthController::class, 'getTeachers']);
        Route::post('/teachers', [\App\Http\Controllers\Teacher\TeacherController::class, 'store']);
        Route::put('/teachers/{teacher}', [\App\Http\Controllers\Teacher\TeacherController::class, 'update']);
        Route::get('/teachers/{teacher}', [\App\Http\Controllers\Teacher\TeacherController::class, 'show']);
        Route::get('/teachers/{teacher}', [\App\Http\Controllers\Teacher\TeacherController::class, 'show']);
        Route::post('/teachers/{teacher}/login', [\App\Http\Controllers\Admin\TeacherController::class, 'loginAsTeacher']);
        Route::put('/teachers/{teacher}/toggle-status', [\App\Http\Controllers\Admin\TeacherController::class, 'toggleStatus']);
        Route::get('/students', [AdminAuthController::class, 'getStudents']);
        Route::put('/students/{student}', [AdminAuthController::class, 'updateStudent']);
        Route::put('/exams/{exam}/toggle-status', [ExamController::class, 'toggleStatus']);
        Route::put('/exams/{exam}/end', [ExamController::class, 'endExam']);
        Route::get('/dashboard/stats', [AdminAuthController::class, 'dashboardStats']);
        
        // Roles and Permissions
        Route::apiResource('roles', \App\Http\Controllers\Admin\RoleController::class);
        Route::apiResource('permissions', \App\Http\Controllers\Admin\PermissionController::class);

        // Notifications
        Route::get('/notifications', [\App\Http\Controllers\Admin\NotificationController::class, 'index']);
        Route::post('/notifications', [\App\Http\Controllers\Admin\NotificationController::class, 'store']);
        Route::post('/notifications/{id}/read', [\App\Http\Controllers\Admin\NotificationController::class, 'markAsRead']);

        // Settings
        Route::get('/settings', [\App\Http\Controllers\Admin\SettingsController::class, 'index']);
        Route::post('/settings', [\App\Http\Controllers\Admin\SettingsController::class, 'update']);

        // Reports
        Route::get('/reports/teachers', [\App\Http\Controllers\Admin\ReportController::class, 'teachersList']);
        Route::get('/reports/teacher/{teacher}', [\App\Http\Controllers\Admin\ReportController::class, 'teacherReport']);
        Route::get('/reports/teacher/{teacher}/pdf', [\App\Http\Controllers\Admin\ReportController::class, 'teacherReportPdf']);
        Route::get('/reports/admin', [\App\Http\Controllers\Admin\ReportController::class, 'adminReport']);
        Route::get('/reports/admin/pdf', [\App\Http\Controllers\Admin\ReportController::class, 'adminReportPdf']);
    });
});

// ============================================
// Teacher Authentication Routes (Central DB)
// ============================================
Route::post('/register/teacher', [\App\Http\Controllers\Teacher\TeacherController::class, 'register']);
Route::post('/login/teacher', [TeacherAuthController::class, 'login']);

Route::middleware(['auth:sanctum', \App\Http\Middleware\EnsureTeacherNotSuspended::class])->prefix('teacher')->name('teacher.')->group(function () {
    Route::post('/logout', [TeacherAuthController::class, 'logout']);
    Route::get('/me', [TeacherAuthController::class, 'me']);
    
    // Dashboard routes
    Route::get('/dashboard/stats', [\App\Http\Controllers\Teacher\DashboardController::class, 'getStats']);
    Route::get('/dashboard/students', [\App\Http\Controllers\Teacher\DashboardController::class, 'getRecentStudents']);
    Route::get('/dashboard/lectures', [\App\Http\Controllers\Teacher\DashboardController::class, 'getUpcomingLectures']);
    
    // Student Management
    Route::get('students/statistics', [\App\Http\Controllers\Teacher\StudentController::class, 'statistics']);
    Route::get('students/search-phone', [\App\Http\Controllers\Teacher\StudentController::class, 'searchByPhone']);
    Route::put('students/{student}/permissions', [\App\Http\Controllers\Teacher\StudentController::class, 'updatePermissions']);
    Route::put('students/{student}/toggle-status', [\App\Http\Controllers\Teacher\StudentController::class, 'toggleStatus']);
    Route::put('students/{student}/activate', [\App\Http\Controllers\Teacher\StudentController::class, 'activate']);
    Route::apiResource('students', \App\Http\Controllers\Teacher\StudentController::class);
    
    Route::apiResource('grades', \App\Http\Controllers\Teacher\GradeController::class);
    Route::apiResource('groups', \App\Http\Controllers\Teacher\GroupController::class);
    Route::apiResource('lectures', \App\Http\Controllers\Teacher\LectureController::class);
    Route::get('exams/{exam}/results', [\App\Http\Controllers\Teacher\ExamController::class, 'results']);
    Route::put('exams/{exam}/toggle-status', [\App\Http\Controllers\Teacher\ExamController::class, 'toggleStatus']);
    Route::put('exams/{exam}/end', [\App\Http\Controllers\Teacher\ExamController::class, 'endExam']);
    Route::apiResource('exams', \App\Http\Controllers\Teacher\ExamController::class);
    Route::post('/lectures/{lecture}/qr-code', [\App\Http\Controllers\Teacher\LectureAttendanceController::class, 'generateQrCode']);
    Route::post('/lectures/{lecture}/attendance', [\App\Http\Controllers\Teacher\LectureAttendanceController::class, 'recordAttendance']);
    Route::put('/lectures/{lecture}/toggle-active', [\App\Http\Controllers\Teacher\LectureController::class, 'toggleActive']);
    Route::post('/lectures/{lecture}/end', [\App\Http\Controllers\Teacher\LectureController::class, 'endLecture']);
    
    // Secretary Management
    Route::put('secretaries/{secretary}/permissions', [\App\Http\Controllers\Teacher\SecretaryController::class, 'updatePermissions']);
    Route::put('secretaries/{secretary}/toggle-status', [\App\Http\Controllers\Teacher\SecretaryController::class, 'toggleStatus']);
    Route::apiResource('secretaries', \App\Http\Controllers\Teacher\SecretaryController::class);
    
    // Notifications
    Route::get('/notifications', [\App\Http\Controllers\Teacher\NotificationController::class, 'index']);
    Route::post('/notifications', [\App\Http\Controllers\Teacher\NotificationController::class, 'store']);
    Route::post('/notifications/{id}/read', [\App\Http\Controllers\Teacher\NotificationController::class, 'markAsRead']);

    // Roles and Permissions
    Route::apiResource('permissions', \App\Http\Controllers\Teacher\PermissionController::class);

    // Gamification
    Route::get('/leaderboard', [\App\Http\Controllers\Teacher\GamificationController::class, 'leaderboard']);
    Route::get('/gamification/settings', [\App\Http\Controllers\Teacher\GamificationController::class, 'settings']);
    Route::put('/gamification/settings', [\App\Http\Controllers\Teacher\GamificationController::class, 'updateSettings']);
    Route::post('/gamification/bonus', [\App\Http\Controllers\Teacher\GamificationController::class, 'awardBonus']);
    Route::get('/students/{student}/points', [\App\Http\Controllers\Teacher\GamificationController::class, 'studentPoints']);

    // Payment Logs
    Route::get('payments', [\App\Http\Controllers\Teacher\PaymentLogController::class, 'index']);
    Route::post('payments', [\App\Http\Controllers\Teacher\PaymentLogController::class, 'store']);
    Route::post('payments/sync', [\App\Http\Controllers\Teacher\PaymentLogController::class, 'syncBatch']);
    Route::get('payments/pending', [\App\Http\Controllers\Teacher\PaymentLogController::class, 'pending']);
    Route::get('payments/statistics', [\App\Http\Controllers\Teacher\PaymentLogController::class, 'statistics']);
    Route::get('payments/{payment}', [\App\Http\Controllers\Teacher\PaymentLogController::class, 'show']);
    Route::post('payments/{payment}/cancel', [\App\Http\Controllers\Teacher\PaymentLogController::class, 'cancel']);

    // Sync Errors
    Route::get('sync-errors', [\App\Http\Controllers\Teacher\SyncErrorController::class, 'index']);
    Route::get('sync-errors/count', [\App\Http\Controllers\Teacher\SyncErrorController::class, 'unresolvedCount']);
    Route::get('sync-errors/{error}', [\App\Http\Controllers\Teacher\SyncErrorController::class, 'show']);
    Route::post('sync-errors/{error}/resolve', [\App\Http\Controllers\Teacher\SyncErrorController::class, 'resolve']);
    Route::post('sync-errors/bulk-resolve', [\App\Http\Controllers\Teacher\SyncErrorController::class, 'bulkResolve']);
});

// ============================================
// Student Authentication Routes
// ============================================
Route::post('/login/student', [StudentAuthController::class, 'login']);

Route::middleware(['auth:sanctum', \App\Http\Middleware\EnsureTeacherNotSuspendedForStudent::class])->prefix('student')->group(function () {
    Route::post('/logout', [StudentAuthController::class, 'logout']);
    Route::get('/me', [StudentAuthController::class, 'me']);
    Route::post('/attend', [\App\Http\Controllers\Student\StudentAttendanceController::class, 'markAttendance']);
    Route::get('/exams', [\App\Http\Controllers\Student\StudentExamController::class, 'index']);
    Route::get('/lectures', [\App\Http\Controllers\Student\StudentLectureController::class, 'index']);
    Route::get('/attendance', [\App\Http\Controllers\Student\StudentAttendanceController::class, 'index']);
    Route::get('/dashboard', [\App\Http\Controllers\Student\StudentDashboardController::class, 'index']);
    
    // Exam Taking Routes
    Route::get('/exams/{exam}', [\App\Http\Controllers\Student\StudentExamController::class, 'show']);
    Route::post('/exams/{exam}/start', [\App\Http\Controllers\Student\StudentExamController::class, 'start']);
    Route::post('/exams/attempts/{attempt}/answer', [\App\Http\Controllers\Student\StudentExamController::class, 'submitAnswer']);
    Route::post('/exams/attempts/{attempt}/skip', [\App\Http\Controllers\Student\StudentExamController::class, 'skipQuestion']);
    Route::post('/exams/attempts/{attempt}/terminate', [\App\Http\Controllers\Student\StudentExamController::class, 'terminate']);
    Route::get('/exams/attempts/{attempt}/status', [\App\Http\Controllers\Student\StudentExamController::class, 'attemptStatus']);
    Route::get('/exams/{exam}/result', [\App\Http\Controllers\Student\StudentExamController::class, 'result']);
    
    // Teacher Selection & Dashboard
    Route::get('/teachers', [StudentAuthController::class, 'teachers']);
    Route::get('/teachers/{teacher}/dashboard', [StudentAuthController::class, 'teacherDashboard']);
    
    // Notifications
    Route::get('/notifications', [\App\Http\Controllers\Student\NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [\App\Http\Controllers\Student\NotificationController::class, 'markAsRead']);

    // Gamification
    Route::get('/points', [\App\Http\Controllers\Student\GamificationController::class, 'index']);
    Route::get('/points/{teacher}', [\App\Http\Controllers\Student\GamificationController::class, 'show']);
    Route::get('/points/{teacher}/history', [\App\Http\Controllers\Student\GamificationController::class, 'history']);
    Route::get('/leaderboard/{teacher}', [\App\Http\Controllers\Student\GamificationController::class, 'leaderboard']);

    // Mistakes (Smart Mistakes Notebook)
    Route::get('/mistakes', [\App\Http\Controllers\Student\MistakesController::class, 'index']);
    Route::post('/mistakes/{id}/mastered', [\App\Http\Controllers\Student\MistakesController::class, 'markAsMastered']);
    Route::get('/mistakes/quiz', [\App\Http\Controllers\Student\MistakesController::class, 'quiz']);
    Route::post('/mistakes/quiz/{failedQuestionId}/answer', [\App\Http\Controllers\Student\MistakesController::class, 'submitQuizAnswer']);

    // Payment Confirmation (Rate Limited)
    Route::post('payments/confirm', [\App\Http\Controllers\Student\PaymentConfirmationController::class, 'confirm']);
    Route::get('payments/pending', [\App\Http\Controllers\Student\PaymentConfirmationController::class, 'pending']);
    Route::get('payments/history', [\App\Http\Controllers\Student\PaymentConfirmationController::class, 'history']);
});

// ============================================
// Secretary Authentication Routes
// ============================================
Route::post('/login/secretary', [SecretaryAuthController::class, 'login']);

Route::middleware(['auth:sanctum', \App\Http\Middleware\EnsureSecretaryTeacherNotSuspended::class])->prefix('secretary')->group(function () {
    Route::post('/logout', [SecretaryAuthController::class, 'logout']);
    Route::get('/me', [SecretaryAuthController::class, 'me']);

    // Notifications
    Route::get('/notifications', [\App\Http\Controllers\Secretary\NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [\App\Http\Controllers\Secretary\NotificationController::class, 'markAsRead']);
});

// ============================================
// Avatar Routes (All User Types)
// ============================================
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/avatar/upload', [\App\Http\Controllers\Media\AvatarController::class, 'upload']);
    Route::delete('/avatar', [\App\Http\Controllers\Media\AvatarController::class, 'delete']);
    Route::get('/avatar', [\App\Http\Controllers\Media\AvatarController::class, 'show']);
    Route::post('/refresh-token', [\App\Http\Controllers\Api\RefreshTokenController::class, 'refresh']);
    Route::post('/device-tokens', [\App\Http\Controllers\Api\DeviceTokenController::class, 'store']);
});

// Public Settings
Route::get('/public-settings', [\App\Http\Controllers\Admin\SettingsController::class, 'getPublicSettings']);       
