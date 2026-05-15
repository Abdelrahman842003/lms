<?php

use Illuminate\Support\Facades\Route;
use App\Domains\Application\Http\Controllers\Academy\AuthController as AcademyAuthController;
use App\Domains\Application\Http\Controllers\Academy\DashboardController;
use App\Domains\Application\Http\Controllers\Academy\TeacherController;
use App\Domains\Application\Http\Controllers\Academy\SecretaryController;
use App\Domains\Application\Http\Controllers\Academy\AttendanceController;
use App\Domains\Application\Http\Controllers\Academy\NotificationController;
use App\Domains\Application\Http\Controllers\Academy\ReportController;
use App\Domains\Application\Http\Controllers\Academy\AcademyReportController;
use App\Domains\Application\Http\Controllers\Academy\PermissionController;
use App\Domains\Application\Http\Controllers\Academy\LectureController;
use App\Domains\Application\Http\Controllers\Academy\GradeController;
use App\Domains\Application\Http\Controllers\Academy\GroupController;
use App\Domains\Application\Http\Controllers\Academy\StudentController;
use App\Domains\Application\Http\Controllers\Academy\PaymentController;
use App\Domains\Application\Http\Controllers\Academy\SubscriptionController;
use App\Domains\Application\Http\Controllers\Academy\GamificationController;
use App\Domains\Application\Http\Controllers\Academy\ExamController;
use App\Domains\Application\Http\Controllers\Academy\VideoController;
use App\Domains\Application\Http\Controllers\Academy\VideoUploadController;
use App\Domains\Application\Http\Controllers\Academy\VideoQuizController;
use App\Domains\Application\Http\Controllers\Api\LectureSessionController;
use App\Domains\Auth\Http\Middleware\EnsureActiveSubscription;

// ============================================
// Academy Authentication Routes
// ============================================
Route::prefix('academy')->name('academy.')->group(function () {
    Route::post('/login', [AcademyAuthController::class, 'login'])
        ->middleware(['throttle:auth', 'auth.cookies']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AcademyAuthController::class, 'logout']);
        Route::get('/me', [AcademyAuthController::class, 'me']);
        Route::put('/profile', [AcademyAuthController::class, 'updateProfile']);
        Route::post('/change-password', [AcademyAuthController::class, 'changePassword']);
    });
});

// ============================================
// Academy Routes (Secretary Access)
// ============================================
Route::middleware(['auth:sanctum', EnsureActiveSubscription::class])->prefix('academy')->name('academy.')->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'getStats']);
    
    // Teachers Management
    Route::post('/check-teacher-phone', [TeacherController::class, 'checkPhone']);
    Route::apiResource('teachers', TeacherController::class);
    Route::put('/teachers/{teacher}/toggle-status', [TeacherController::class, 'toggleStatus']);
    
    // Secretaries Management
    Route::post('secretaries/check-phone', [SecretaryController::class, 'checkPhone']);
    Route::put('secretaries/{secretary}/permissions', [SecretaryController::class, 'updatePermissions']);
    Route::put('secretaries/{secretary}/toggle-status', [SecretaryController::class, 'toggleStatus']);
    Route::apiResource('secretaries', SecretaryController::class);
    
    // Attendance Management
    Route::get('attendance', [AttendanceController::class, 'index']);
    Route::get('attendance/today', [AttendanceController::class, 'todayAttendance']);
    Route::post('attendance/mark-absent', [AttendanceController::class, 'markAbsent']);
    Route::put('attendance/{log}/notes', [AttendanceController::class, 'updateNotes']);
    Route::get('attendance/stats', [AttendanceController::class, 'stats']);
    
    // Notifications - Rate limited to prevent spam
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::get('notifications/voice-limit', [NotificationController::class, 'checkVoiceLimit']);
    Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::middleware('throttle:notifications')->group(function () {
        Route::post('notifications', [NotificationController::class, 'store']);
        Route::post('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('notifications/send-to-teachers', [NotificationController::class, 'sendToTeachers']);
    });
    Route::middleware('throttle:voice-notifications')->post('notifications/voice', [NotificationController::class, 'storeVoice']);
    
    // Reports
    Route::get('reports/attendance', [ReportController::class, 'attendanceReport']);
    Route::get('reports/teachers', [ReportController::class, 'teachersReport']);
    Route::get('reports/monthly', [ReportController::class, 'monthlyReport']);

    // New Academy Reports (Reporting Foundation)
    Route::get('reports/snapshot', [AcademyReportController::class, 'snapshot']);
    Route::get('reports/student-distribution', [AcademyReportController::class, 'studentDistribution']);
    Route::get('reports/teacher-performance', [AcademyReportController::class, 'teacherPerformance']);
    Route::get('reports/attendance-quality', [AcademyReportController::class, 'attendanceQuality']);
    Route::get('reports/session-execution', [AcademyReportController::class, 'sessionExecution']);
    Route::get('reports/subscription-usage', [AcademyReportController::class, 'subscriptionUsage']);
    Route::get('reports/time-comparison', [AcademyReportController::class, 'timeComparison']);
    Route::get('reports/alerts', [AcademyReportController::class, 'alerts']);
    Route::get('reports/overview', [AcademyReportController::class, 'overview']);
    
    // Permissions
    Route::get('permissions', [PermissionController::class, 'index']);
    
    // Lectures Management (Student Attendance)
    Route::get('lectures/teachers', [LectureController::class, 'getTeachers']);
    Route::apiResource('lectures', LectureController::class);
    Route::put('lectures/{lecture}/toggle-active', [LectureController::class, 'toggleActive']);
    Route::post('lectures/{lecture}/end', [LectureController::class, 'endLecture']);
    Route::post('lectures/{lecture}/cancel-session', [LectureController::class, 'cancelSession']);
    Route::post('lectures/{lecture}/qr-code', [LectureController::class, 'generateQrCode']);
    Route::post('lectures/{lecture}/attendance', [LectureController::class, 'recordAttendance']);
    Route::get('lectures/{lecture}/attendees', [LectureController::class, 'getAttendees']);
    Route::get('lectures/{lecture}/sessions', [LectureSessionController::class, 'index']);
    Route::post('lectures/{lecture}/sessions', [LectureSessionController::class, 'store']);
    
    // Grades & Groups Management
    Route::put('grades/bulk-update-name', [GradeController::class, 'bulkUpdateName']);
    Route::post('grades/bulk-delete', [GradeController::class, 'bulkDelete']);
    Route::apiResource('grades', GradeController::class);
    Route::apiResource('groups', GroupController::class);
    
    // Students Management
    Route::get('students/statistics', [StudentController::class, 'statistics']);
    Route::get('students/search-phone', [StudentController::class, 'searchByPhone']);
    Route::put('students/{id}/toggle-status', [StudentController::class, 'toggleStatus']);
    Route::apiResource('students', StudentController::class);
    
    // Payments - Rate limited to prevent duplicate charges
    Route::middleware('throttle:payments')->group(function () {
        Route::post('payments', [PaymentController::class, 'store']);
    });
    
    // Subscription
    Route::get('subscription', [SubscriptionController::class, 'show']);
    Route::middleware('throttle:payments')->post('subscription/renew', [SubscriptionController::class, 'requestRenewal']);
    
    // Gamification
    Route::get('/leaderboard', [GamificationController::class, 'leaderboard']);
    
    // Exams Management
    Route::get('exams/teachers', [ExamController::class, 'getTeachers']);
    Route::get('exams/{exam}/results', [ExamController::class, 'results']);
    Route::apiResource('exams', ExamController::class);
    Route::put('exams/{exam}/toggle-status', [ExamController::class, 'toggleStatus']);
    Route::post('exams/{exam}/copy', [ExamController::class, 'copy']);
    Route::put('exams/{exam}/end', [ExamController::class, 'endExam']);
    
    // Videos Management (New: Direct-to-R2 multipart upload)
    Route::middleware('throttle:video-upload')->group(function () {
        Route::post('videos/initiate-upload', [VideoUploadController::class, 'initiateUpload']);
        Route::post('videos/complete-upload', [VideoUploadController::class, 'completeUpload']);
        Route::post('videos/report-part-success', [VideoUploadController::class, 'reportPartSuccess']);
        Route::post('videos/{video}/attachments/initiate-direct-upload', [VideoUploadController::class, 'initiateAttachmentUploads']);
        Route::post('videos/{video}/attachments/complete-direct-upload', [VideoUploadController::class, 'completeAttachmentUploads']);
    });
    Route::delete('videos/abort-upload', [VideoUploadController::class, 'abortUpload']);
    // Videos CRUD (store no longer accepts video bytes — use initiate-upload instead)
    Route::get('videos', [VideoController::class, 'index']);
    Route::get('videos/{video}', [VideoController::class, 'show']);
    Route::put('videos/{video}', [VideoController::class, 'update']);
    Route::delete('videos/{video}', [VideoController::class, 'destroy']);
    Route::post('videos/{video}/attachments', [VideoController::class, 'uploadAttachments']);
    Route::delete('videos/{video}/attachments/{attachment}', [VideoController::class, 'deleteAttachment']);
    Route::post('videos/{video}/retry-processing', [VideoController::class, 'retryProcessing']);
    Route::post('videos/{video}/publish', [VideoController::class, 'publish']);
    Route::get('videos/{video}/comments', [VideoController::class, 'comments']);
    Route::post('videos/{video}/comments/{commentId}/hide', [VideoController::class, 'hideComment']);
    Route::delete('videos/{video}/comments/{commentId}', [VideoController::class, 'deleteComment']);
    
    // Video Quiz Management (Academy)
    Route::get('videos/{video}/quiz', [VideoQuizController::class, 'show']);
    Route::post('videos/{video}/quiz', [VideoQuizController::class, 'store']);
    Route::put('videos/{video}/quiz', [VideoQuizController::class, 'update']);
    Route::delete('videos/{video}/quiz', [VideoQuizController::class, 'destroy']);
    Route::get('videos/{video}/quiz/results', [VideoQuizController::class, 'results']);

    // Notes Management (Academy)
    Route::get('notes', [\App\Domains\Notes\Http\Controllers\Academy\NoteController::class, 'index']);
    Route::post('notes/initiate', [\App\Domains\Notes\Http\Controllers\Academy\NoteController::class, 'initiate']);
    Route::post('notes/{note}/complete', [\App\Domains\Notes\Http\Controllers\Academy\NoteController::class, 'complete']);
    Route::get('notes/{note}', [\App\Domains\Notes\Http\Controllers\Academy\NoteController::class, 'show']);
    Route::delete('notes/{note}', [\App\Domains\Notes\Http\Controllers\Academy\NoteController::class, 'destroy']);
});
