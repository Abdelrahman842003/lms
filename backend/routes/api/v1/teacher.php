<?php

use Illuminate\Support\Facades\Route;
use App\Domains\Application\Http\Controllers\Teacher\AuthController as TeacherAuthController;
use App\Domains\Application\Http\Controllers\Teacher\DashboardController;
use App\Domains\Application\Http\Controllers\Teacher\StudentController;
use App\Domains\Application\Http\Controllers\Teacher\GradeController;
use App\Domains\Application\Http\Controllers\Teacher\GroupController;
use App\Domains\Application\Http\Controllers\Teacher\LectureController;
use App\Domains\Application\Http\Controllers\Teacher\NotificationController;
use App\Domains\Application\Http\Controllers\Teacher\PermissionController;
use App\Domains\Application\Http\Controllers\Teacher\PaymentLogController;
use App\Domains\Application\Http\Controllers\Teacher\PaymentController;
use App\Domains\Application\Http\Controllers\Teacher\SubscriptionController;
use App\Domains\Application\Http\Controllers\Teacher\SyncErrorController;
use App\Domains\Application\Http\Controllers\Teacher\ExamController;
use App\Domains\Application\Http\Controllers\Teacher\LectureAttendanceController;
use App\Domains\Application\Http\Controllers\Teacher\VideoController;
use App\Domains\Application\Http\Controllers\Teacher\VideoUploadController;
use App\Domains\Application\Http\Controllers\Teacher\VideoQuizController;
use App\Domains\Application\Http\Controllers\Api\LectureSessionController;
use App\Domains\Application\Http\Controllers\Teacher\GamificationController;
use App\Domains\Application\Http\Controllers\Teacher\TeacherReportController;
use App\Domains\Reporting\Presentation\Controllers\TeacherReportingController;
use App\Domains\Application\Http\Controllers\Teacher\SecretaryController;
use App\Domains\Auth\Http\Middleware\EnsureUserNotSuspended;
use App\Domains\Auth\Http\Middleware\EnsureActiveSubscription;

// ============================================
// Teacher Authentication Routes
// ============================================
Route::middleware('throttle:register')->post('/register/teacher', [\App\Domains\Application\Http\Controllers\Teacher\TeacherController::class, 'register']);
Route::post('/login/teacher', [TeacherAuthController::class, 'login'])
    ->middleware(['throttle:auth', 'auth.cookies']);

Route::middleware(['auth:sanctum', 'user.type:teacher,secretary', EnsureUserNotSuspended::class . ':teacher', EnsureActiveSubscription::class, 'profile.context'])->prefix('teacher')->name('teacher.')->group(function () {
    Route::post('/logout', [TeacherAuthController::class, 'logout']);
    Route::get('/me', [TeacherAuthController::class, 'me']);
    Route::post('/change-password', [TeacherAuthController::class, 'changePassword']);
    Route::put('/profile', [TeacherAuthController::class, 'updateProfile']);
    
    // Dashboard routes
    Route::get('/dashboard/stats', [DashboardController::class, 'getStats']);
    Route::get('/dashboard/students', [DashboardController::class, 'getRecentStudents']);
    Route::get('/dashboard/lectures', [DashboardController::class, 'getUpcomingLectures']);
    Route::get('/dashboard/academies', [DashboardController::class, 'getTeacherAcademies']);
    
    // Student Management
    Route::get('students/statistics', [StudentController::class, 'statistics']);
    Route::get('students/search-phone', [StudentController::class, 'searchByPhone']);
    Route::put('students/{student}/permissions', [StudentController::class, 'updatePermissions']);
    Route::put('students/{student}/toggle-status', [StudentController::class, 'toggleStatus']);
    Route::get('students/{student}/activation-details', [StudentController::class, 'activationDetails']);
    Route::put('students/{student}/activate', [StudentController::class, 'activate']);
    Route::apiResource('students', StudentController::class);
    
    // Grades & Groups
    Route::apiResource('grades', GradeController::class);
    Route::apiResource('groups', GroupController::class);
    
    // Lectures
    Route::apiResource('lectures', LectureController::class);
    Route::put('/lectures/{lecture}/toggle-active', [LectureController::class, 'toggleActive']);
    Route::post('/lectures/{lecture}/end', [LectureController::class, 'endLecture']);
    Route::post('/lectures/{lecture}/cancel-session', [LectureController::class, 'cancelSession']);
    Route::post('/lectures/{lecture}/attendance-code', [LectureAttendanceController::class, 'generateAttendanceCode']);
    Route::delete('/lectures/{lecture}/attendance-code', [LectureAttendanceController::class, 'invalidateAttendanceCode']);
    Route::get('/lectures/{lecture}/attendance', [LectureController::class, 'getAttendees']);
    Route::post('/lectures/{lecture}/attendance', [LectureAttendanceController::class, 'recordAttendance']);
    Route::get('/lectures/{lecture}/attendees', [LectureController::class, 'getAttendees']);
    Route::get('/lectures/{lecture}/attendees/export', [LectureController::class, 'exportAttendees']);
    Route::get('/lectures/{lecture}/sessions', [LectureSessionController::class, 'index']);
    Route::post('/lectures/{lecture}/sessions', [LectureSessionController::class, 'store']);
    
    // Notifications - Rate limited to prevent spam
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/voice-limit', [NotificationController::class, 'checkVoiceLimit']);
    Route::middleware('throttle:notifications')->group(function () {
        Route::post('/notifications', [NotificationController::class, 'store']);
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    });
    Route::middleware('throttle:voice-notifications')->post('/notifications/voice', [NotificationController::class, 'storeVoice']);
    
    // Roles and Permissions
    Route::apiResource('permissions', PermissionController::class);
    
    // Gamification
    Route::get('/leaderboard', [GamificationController::class, 'leaderboard']);
    Route::get('/gamification/settings', [GamificationController::class, 'settings']);
    Route::put('/gamification/settings', [GamificationController::class, 'updateSettings']);
    Route::post('/gamification/bonus', [GamificationController::class, 'awardBonus']);
    Route::get('/students/{student}/points', [GamificationController::class, 'studentPoints']);
    
    // Payment Logs - Read operations
    Route::get('payments', [PaymentLogController::class, 'index']);
    Route::get('payments/pending', [PaymentLogController::class, 'pending']);
    Route::get('payments/statistics', [PaymentLogController::class, 'statistics']);
    Route::get('payments/{payment}', [PaymentLogController::class, 'show']);
    
    // Payment Logs - Write operations (rate limited)
    Route::middleware('throttle:payments')->group(function () {
        Route::post('payments', [PaymentLogController::class, 'store']);
        Route::post('payments/sync', [PaymentLogController::class, 'syncBatch']);
        Route::post('payments/{payment}/cancel', [PaymentLogController::class, 'cancel']);
    });
    
    // Full Payment System for Independent Teacher - Rate limited
    Route::middleware('throttle:payments')->post('students/{student}/payments', [PaymentController::class, 'store']);
    
    // Sync Errors
    Route::get('sync-errors', [SyncErrorController::class, 'index']);
    Route::get('sync-errors/count', [SyncErrorController::class, 'unresolvedCount']);
    Route::get('sync-errors/{error}', [SyncErrorController::class, 'show']);
    Route::post('sync-errors/{error}/resolve', [SyncErrorController::class, 'resolve']);
    Route::post('sync-errors/bulk-resolve', [SyncErrorController::class, 'bulkResolve']);
    
    // Reports (Legacy)
    Route::get('reports/my-report', [TeacherReportController::class, 'myReport']);
    
    // Reports (Reporting Domain - v2)
    Route::get('reports/overview', [TeacherReportingController::class, 'overview']);
    Route::get('reports/drilldown/{key}', [TeacherReportingController::class, 'drilldown']);
    
    // Subscription
    Route::get('subscription', [SubscriptionController::class, 'show']);
    Route::middleware('throttle:payments')->post('subscription/renew', [SubscriptionController::class, 'requestRenewal']);
    

    // Videos Management - Upload rate limited
    Route::middleware('throttle:video-upload')->group(function () {
        Route::post('videos/initiate-upload', [VideoUploadController::class, 'initiateUpload']);
        Route::post('videos/complete-upload', [VideoUploadController::class, 'completeUpload']);
        Route::post('videos/{video}/attachments/initiate-direct-upload', [VideoUploadController::class, 'initiateAttachmentUploads']);
        Route::post('videos/{video}/attachments/complete-direct-upload', [VideoUploadController::class, 'completeAttachmentUploads']);
    });
    Route::delete('videos/abort-upload', [VideoUploadController::class, 'abortUpload']);
    
    // Videos CRUD (store no longer accepts video bytes — use initiate-upload instead)
    Route::get('videos', [VideoController::class, 'index']);
    Route::get('videos/{video}', [VideoController::class, 'show']);
    Route::put('videos/{video}', [VideoController::class, 'update']);
    Route::delete('videos/{video}', [VideoController::class, 'destroy']);
    Route::middleware('throttle:uploads')->post('videos/{video}/attachments', [VideoController::class, 'uploadAttachments']);
    Route::delete('videos/{video}/attachments/{attachment}', [VideoController::class, 'deleteAttachment']);
    Route::post('videos/{video}/retry-processing', [VideoController::class, 'retryProcessing']);
    Route::post('videos/{video}/publish', [VideoController::class, 'publish']);
    Route::get('videos/{video}/thumbnail', [VideoController::class, 'thumbnail']);
    Route::get('videos/{video}/thumbnail-url', [VideoController::class, 'thumbnailUrl']);
    
    // Video streaming - Rate limited
    Route::middleware('throttle:video-stream')->group(function () {
        Route::get('videos/{video}/stream', [VideoController::class, 'stream']);
        Route::get('videos/{video}/stream-url', [VideoController::class, 'streamUrl']);
    });
    Route::get('videos/{video}/comments', [VideoController::class, 'comments']);
    Route::post('videos/{video}/comments/{commentId}/hide', [VideoController::class, 'hideComment']);
    Route::delete('videos/{video}/comments/{commentId}', [VideoController::class, 'deleteComment']);
    
    // Video Quiz Management (Teacher)
    Route::get('videos/{video}/quiz', [VideoQuizController::class, 'show']);
    Route::post('videos/{video}/quiz', [VideoQuizController::class, 'store']);
    Route::put('videos/{video}/quiz', [VideoQuizController::class, 'update']);
    Route::delete('videos/{video}/quiz', [VideoQuizController::class, 'destroy']);
    Route::get('videos/{video}/quiz/results', [VideoQuizController::class, 'results']);
    
    // Secretary Management
    Route::post('secretaries/check-phone', [\App\Domains\Application\Http\Controllers\Teacher\SecretaryController::class, 'checkPhone']);
    Route::put('secretaries/{secretary}/permissions', [\App\Domains\Application\Http\Controllers\Teacher\SecretaryController::class, 'updatePermissions']);
    Route::put('secretaries/{secretary}/toggle-status', [\App\Domains\Application\Http\Controllers\Teacher\SecretaryController::class, 'toggleStatus']);
    Route::apiResource('secretaries', SecretaryController::class);
    
    // Question Bank Management
    Route::apiResource('questions', \App\Domains\Application\Http\Controllers\Teacher\QuestionController::class);

    // Exams Management
    Route::get('exams/{exam}/results', [ExamController::class, 'results']);
    Route::put('exams/{exam}/toggle-status', [ExamController::class, 'toggleStatus']);
    Route::post('exams/{exam}/copy', [ExamController::class, 'copy']);
    Route::put('exams/{exam}/end', [ExamController::class, 'endExam']);
    Route::apiResource('exams', ExamController::class);

    // Notes Management (Teacher)
    Route::get('notes', [\App\Domains\Notes\Http\Controllers\Teacher\NoteController::class, 'index']);
    Route::post('notes/initiate', [\App\Domains\Notes\Http\Controllers\Teacher\NoteController::class, 'initiate']);
    Route::post('notes/{note}/complete', [\App\Domains\Notes\Http\Controllers\Teacher\NoteController::class, 'complete']);
    Route::get('notes/{note}', [\App\Domains\Notes\Http\Controllers\Teacher\NoteController::class, 'show']);
    Route::delete('notes/{note}', [\App\Domains\Notes\Http\Controllers\Teacher\NoteController::class, 'destroy']);
});
