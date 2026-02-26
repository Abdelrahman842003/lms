<?php

use App\Domains\Application\Http\Controllers\Admin\AuthController as AdminAuthController;
use App\Domains\Application\Http\Controllers\Teacher\AuthController as TeacherAuthController;
use App\Domains\Application\Http\Controllers\Student\AuthController as StudentAuthController;
use App\Domains\Application\Http\Controllers\Secretary\AuthController as SecretaryAuthController;
use App\Domains\Application\Http\Controllers\Teacher\ExamController;
use App\Domains\Application\Http\Controllers\Teacher\LectureController;
use App\Domains\Application\Http\Controllers\Teacher\TeacherController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// ============================================
// API Version 1
// ============================================
Route::prefix('v1')->group(function () {

// ============================================
// Broadcasting Authentication Route
// ============================================

// ============================================
// Admin Authentication Routes (Central DB)
// ============================================
Route::prefix('admin')->name('admin.')->group(function () {
    Route::post('/login', [AdminAuthController::class, 'login'])
        ->middleware(['throttle.login', 'auth.cookies']);
    Route::post('/register', [AdminAuthController::class, 'register']);
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AdminAuthController::class, 'logout']);
        Route::get('/me', [AdminAuthController::class, 'me']);
        Route::put('/profile', [AdminAuthController::class, 'updateProfile']);
        Route::post('/change-password', [AdminAuthController::class, 'changePassword']);
        Route::get('/teachers', [\App\Domains\Application\Http\Controllers\Admin\TeacherController::class, 'index']);
        Route::post('/teachers', [\App\Domains\Application\Http\Controllers\Admin\TeacherController::class, 'store']);
        Route::put('/teachers/{teacher}', [\App\Domains\Application\Http\Controllers\Admin\TeacherController::class, 'update']);
        Route::get('/teachers/{teacher}', [\App\Domains\Application\Http\Controllers\Admin\TeacherController::class, 'show']);
        Route::delete('/teachers/{teacher}', [\App\Domains\Application\Http\Controllers\Admin\TeacherController::class, 'destroy']);
        Route::post('/teachers/{teacher}/login', [\App\Domains\Application\Http\Controllers\Admin\TeacherController::class, 'loginAsTeacher']);
        Route::get('/teachers/{teacher}/subscription', [\App\Domains\Application\Http\Controllers\Admin\TeacherController::class, 'getSubscription']);
        Route::post('/teachers/{teacher}/subscription', [\App\Domains\Application\Http\Controllers\Admin\TeacherController::class, 'updateSubscription']);
        Route::post('/teachers/{teacher}/plan', [\App\Domains\Application\Http\Controllers\Admin\TeacherController::class, 'updatePlan']);
        Route::put('/teachers/{teacher}/toggle-status', [\App\Domains\Application\Http\Controllers\Admin\TeacherController::class, 'toggleStatus']);
        Route::put('/teachers/{teacher}/independent-status/toggle', [\App\Domains\Application\Http\Controllers\Admin\TeacherController::class, 'toggleIndependentStatus']);
        Route::put('/teachers/{teacher}/academies/{academy}/toggle-status', [\App\Domains\Application\Http\Controllers\Admin\TeacherController::class, 'toggleAcademyStatus']);
        Route::post('/teachers/{teacher}/approve', [\App\Domains\Application\Http\Controllers\Admin\TeacherController::class, 'approve']);
        Route::post('/teachers/{teacher}/enable-independent', [\App\Domains\Application\Http\Controllers\Admin\TeacherController::class, 'enableIndependent']);
        Route::post('/teachers/{teacher}/disable-independent', [\App\Domains\Application\Http\Controllers\Admin\TeacherController::class, 'disableIndependent']);
        Route::post('/teachers/{teacher}/academies', [\App\Domains\Application\Http\Controllers\Admin\TeacherController::class, 'addToAcademy']);
        Route::delete('/teachers/{teacher}/academies/{academy}', [\App\Domains\Application\Http\Controllers\Admin\TeacherController::class, 'removeFromAcademy']);
        Route::get('/students/statistics', [\App\Domains\Application\Http\Controllers\Admin\StudentController::class, 'statistics']);
        Route::get('/students', [\App\Domains\Application\Http\Controllers\Admin\StudentController::class, 'index']);
        Route::post('/students', [\App\Domains\Application\Http\Controllers\Admin\StudentController::class, 'store']);
        Route::put('/students/{student}', [\App\Domains\Application\Http\Controllers\Admin\StudentController::class, 'update']);
        Route::put('/exams/{exam}/toggle-status', [ExamController::class, 'toggleStatus']);
        Route::put('/exams/{exam}/end', [ExamController::class, 'endExam']);
        Route::get('/dashboard/stats', [AdminAuthController::class, 'dashboardStats']);
        
        // Roles and Permissions
        Route::apiResource('roles', \App\Domains\Application\Http\Controllers\Admin\RoleController::class);
        Route::apiResource('permissions', \App\Domains\Application\Http\Controllers\Admin\PermissionController::class);

        // Notifications
        Route::get('/notifications', [\App\Domains\Application\Http\Controllers\Admin\NotificationController::class, 'index']);
        Route::post('/notifications', [\App\Domains\Application\Http\Controllers\Admin\NotificationController::class, 'store']);
        Route::post('/notifications/{id}/read', [\App\Domains\Application\Http\Controllers\Admin\NotificationController::class, 'markAsRead']);
        Route::get('/notifications/voice-limit', [\App\Domains\Application\Http\Controllers\Admin\NotificationController::class, 'checkVoiceLimit']);
        Route::post('/notifications/voice', [\App\Domains\Application\Http\Controllers\Admin\NotificationController::class, 'storeVoice']);

        // Settings
        Route::get('/settings', [\App\Domains\Application\Http\Controllers\Admin\SettingsController::class, 'index']);
        Route::post('/settings', [\App\Domains\Application\Http\Controllers\Admin\SettingsController::class, 'update']);

        // Reports
        Route::get('/reports/teachers', [\App\Domains\Application\Http\Controllers\Admin\ReportController::class, 'teachersList']);
        Route::get('/reports/academies', [\App\Domains\Application\Http\Controllers\Admin\ReportController::class, 'academiesList']);
        Route::get('/reports/teacher/{teacher}', [\App\Domains\Application\Http\Controllers\Admin\ReportController::class, 'teacherReport']);
        Route::get('/reports/teacher/{teacher}/pdf', [\App\Domains\Application\Http\Controllers\Admin\ReportController::class, 'teacherReportPdf']);
        Route::get('/reports/admin', [\App\Domains\Application\Http\Controllers\Admin\ReportController::class, 'adminReport']);
        Route::get('/reports/admin/pdf', [\App\Domains\Application\Http\Controllers\Admin\ReportController::class, 'adminReportPdf']);
        Route::get('/reports/academy/{academy}', [\App\Domains\Application\Http\Controllers\Admin\ReportController::class, 'academyReport']);
        Route::get('/reports/academy/{academy}/pdf', [\App\Domains\Application\Http\Controllers\Admin\ReportController::class, 'academyReportPdf']);

        // Academy Management
        Route::apiResource('academies', \App\Domains\Application\Http\Controllers\Admin\AcademyController::class);
        Route::put('/academies/{academy}/toggle-status', [\App\Domains\Application\Http\Controllers\Admin\AcademyController::class, 'toggleStatus']);
        Route::get('/academies/{academy}/secretaries', [\App\Domains\Application\Http\Controllers\Admin\AcademyController::class, 'secretaries']);
        Route::post('/academies/{academy}/secretaries', [\App\Domains\Application\Http\Controllers\Admin\AcademyController::class, 'addSecretary']);
        Route::delete('/academies/{academy}/secretaries/{secretary}', [\App\Domains\Application\Http\Controllers\Admin\AcademyController::class, 'removeSecretary']);
        Route::post('/academies/{academy}/regenerate-qr', [\App\Domains\Application\Http\Controllers\Admin\AcademyController::class, 'regenerateQrCodes']);
        Route::post('/academies/{academy}/plan', [\App\Domains\Application\Http\Controllers\Admin\AcademyController::class, 'updatePlan']);
        Route::get('/academies/{academy}/subscription', [\App\Domains\Application\Http\Controllers\Admin\AcademyController::class, 'getSubscription']);
        Route::post('/academies/{academy}/subscription', [\App\Domains\Application\Http\Controllers\Admin\AcademyController::class, 'updateSubscription']);
        Route::get('/academies/{academy}/subscriptions', [\App\Domains\Application\Http\Controllers\Admin\AcademyController::class, 'subscriptions']);

        // Subscriptions List (Aggregated Teachers and Academies)
        Route::get('/subscriptions', [\App\Domains\Application\Http\Controllers\Admin\SubscriptionController::class, 'index']);

        // Subscriptions Management (Unified)
        Route::get('/subscriptions/statistics', [\App\Domains\Application\Http\Controllers\Admin\SubscriptionController::class, 'statistics']);
        Route::post('/subscriptions/{subscription}/pay', [\App\Domains\Application\Http\Controllers\Admin\SubscriptionController::class, 'recordPayment']);
        
        // Teacher Subscriptions
        Route::get('/teachers/{teacher}/subscriptions', [\App\Domains\Application\Http\Controllers\Admin\SubscriptionController::class, 'teacherSubscriptions']);
        Route::get('/teachers/{teacher}/subscriptions/current', [\App\Domains\Application\Http\Controllers\Admin\SubscriptionController::class, 'getTeacherSubscription']);
        Route::get('/teachers/{teacher}/quota-check', [\App\Domains\Application\Http\Controllers\Admin\SubscriptionController::class, 'canTeacherAddStudent']);
        
        // Academy Subscriptions
        Route::get('/academies/{academy}/subscriptions', [\App\Domains\Application\Http\Controllers\Admin\SubscriptionController::class, 'academySubscriptions']);
        Route::get('/academies/{academy}/subscriptions/current', [\App\Domains\Application\Http\Controllers\Admin\SubscriptionController::class, 'getAcademySubscription']);
        Route::get('/academies/{academy}/quota-check', [\App\Domains\Application\Http\Controllers\Admin\SubscriptionController::class, 'canAcademyAddEnrollment']);

    });
});

// ============================================
// Academy Authentication Routes
// ============================================
Route::prefix('academy')->name('academy.')->group(function () {
    Route::post('/login', [App\Domains\Application\Http\Controllers\Academy\AuthController::class, 'login'])
        ->middleware(['throttle.login', 'auth.cookies']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [App\Domains\Application\Http\Controllers\Academy\AuthController::class, 'logout']);
        Route::get('/me', [App\Domains\Application\Http\Controllers\Academy\AuthController::class, 'me']);
    });
});

// ============================================
// Academy Routes (Secretary Access)
// ============================================
Route::middleware('auth:sanctum')->prefix('academy')->name('academy.')->group(function () {
    // Dashboard
    Route::get('/dashboard', [\App\Domains\Application\Http\Controllers\Academy\DashboardController::class, 'getStats']);
    
    
    // Teachers Management
    Route::post('/check-teacher-phone', [\App\Domains\Application\Http\Controllers\Academy\TeacherController::class, 'checkPhone']);
    Route::apiResource('teachers', \App\Domains\Application\Http\Controllers\Academy\TeacherController::class);
    Route::put('/teachers/{teacher}/toggle-status', [\App\Domains\Application\Http\Controllers\Academy\TeacherController::class, 'toggleStatus']);
    
    
    // Secretaries Management
    Route::post('secretaries/check-phone', [\App\Domains\Application\Http\Controllers\Academy\SecretaryController::class, 'checkPhone']);
    Route::put('secretaries/{secretary}/permissions', [\App\Domains\Application\Http\Controllers\Academy\SecretaryController::class, 'updatePermissions']);
    Route::put('secretaries/{secretary}/toggle-status', [\App\Domains\Application\Http\Controllers\Academy\SecretaryController::class, 'toggleStatus']);
    Route::apiResource('secretaries', \App\Domains\Application\Http\Controllers\Academy\SecretaryController::class);
    
    // Attendance Management
    Route::get('attendance', [\App\Domains\Application\Http\Controllers\Academy\AttendanceController::class, 'index']);
    Route::get('attendance/today', [\App\Domains\Application\Http\Controllers\Academy\AttendanceController::class, 'todayAttendance']);
    Route::post('attendance/mark-absent', [\App\Domains\Application\Http\Controllers\Academy\AttendanceController::class, 'markAbsent']);
    Route::put('attendance/{log}/notes', [\App\Domains\Application\Http\Controllers\Academy\AttendanceController::class, 'updateNotes']);
    Route::get('attendance/stats', [\App\Domains\Application\Http\Controllers\Academy\AttendanceController::class, 'stats']);
    
    // Notifications
    Route::get('notifications', [\App\Domains\Application\Http\Controllers\Academy\NotificationController::class, 'index']);
    Route::post('notifications', [\App\Domains\Application\Http\Controllers\Academy\NotificationController::class, 'store']);
    Route::post('notifications/{id}/read', [\App\Domains\Application\Http\Controllers\Academy\NotificationController::class, 'markAsRead']);
    Route::post('notifications/send-to-teachers', [\App\Domains\Application\Http\Controllers\Academy\NotificationController::class, 'sendToTeachers']);
    Route::get('notifications/unread-count', [\App\Domains\Application\Http\Controllers\Academy\NotificationController::class, 'unreadCount']);
    
    // Reports
    Route::get('reports/attendance', [\App\Domains\Application\Http\Controllers\Academy\ReportController::class, 'attendanceReport']);
    Route::get('reports/teachers', [\App\Domains\Application\Http\Controllers\Academy\ReportController::class, 'teachersReport']);
    Route::get('reports/monthly', [\App\Domains\Application\Http\Controllers\Academy\ReportController::class, 'monthlyReport']);
    Route::get('reports/export-pdf', [\App\Domains\Application\Http\Controllers\Academy\ReportController::class, 'exportPDF']);

    // Permissions
    Route::get('permissions', [\App\Domains\Application\Http\Controllers\Academy\PermissionController::class, 'index']);

    // Lectures Management (Student Attendance)
    Route::get('lectures/teachers', [\App\Domains\Application\Http\Controllers\Academy\LectureController::class, 'getTeachers']);
    Route::apiResource('lectures', \App\Domains\Application\Http\Controllers\Academy\LectureController::class);
    Route::put('lectures/{lecture}/toggle-active', [\App\Domains\Application\Http\Controllers\Academy\LectureController::class, 'toggleActive']);
    Route::post('lectures/{lecture}/end', [\App\Domains\Application\Http\Controllers\Academy\LectureController::class, 'endLecture']);
    Route::post('lectures/{lecture}/qr-code', [\App\Domains\Application\Http\Controllers\Academy\LectureController::class, 'generateQrCode']);
    Route::get('lectures/{lecture}/attendees', [\App\Domains\Application\Http\Controllers\Academy\LectureController::class, 'getAttendees']);
    Route::get('lectures/{lecture}/sessions', [\App\Domains\Application\Http\Controllers\Api\LectureSessionController::class, 'index']);
    Route::post('lectures/{lecture}/sessions', [\App\Domains\Application\Http\Controllers\Api\LectureSessionController::class, 'store']);

    // Grades & Groups Management
    Route::put('grades/bulk-update-name', [\App\Domains\Application\Http\Controllers\Academy\GradeController::class, 'bulkUpdateName']);
    Route::post('grades/bulk-delete', [\App\Domains\Application\Http\Controllers\Academy\GradeController::class, 'bulkDelete']);
    Route::apiResource('grades', \App\Domains\Application\Http\Controllers\Academy\GradeController::class);
    Route::apiResource('groups', \App\Domains\Application\Http\Controllers\Academy\GroupController::class);

    // Students Management
    Route::get('students/statistics', [\App\Domains\Application\Http\Controllers\Academy\StudentController::class, 'statistics']);
    Route::get('students/search-phone', [\App\Domains\Application\Http\Controllers\Academy\StudentController::class, 'searchByPhone']);
    Route::put('students/{id}/toggle-status', [\App\Domains\Application\Http\Controllers\Academy\StudentController::class, 'toggleStatus']);
    Route::apiResource('students', \App\Domains\Application\Http\Controllers\Academy\StudentController::class);

    // Payments
    Route::post('payments', [\App\Domains\Application\Http\Controllers\Academy\PaymentController::class, 'store']);

    // Gamification
    Route::get('/leaderboard', [\App\Domains\Application\Http\Controllers\Academy\GamificationController::class, 'leaderboard']);

    // Exams Management
    Route::get('exams/teachers', [\App\Domains\Application\Http\Controllers\Academy\ExamController::class, 'getTeachers']);
    Route::apiResource('exams', \App\Domains\Application\Http\Controllers\Academy\ExamController::class);
    Route::put('exams/{exam}/toggle-status', [\App\Domains\Application\Http\Controllers\Academy\ExamController::class, 'toggleStatus']);
    Route::post('exams/{exam}/copy', [\App\Domains\Application\Http\Controllers\Academy\ExamController::class, 'copy']);
    Route::post('exams/{exam}/end', [\App\Domains\Application\Http\Controllers\Academy\ExamController::class, 'endExam']);
});

// ============================================
// Teacher Authentication Routes (Central DB)
// ============================================
Route::post('/register/teacher', [\App\Domains\Application\Http\Controllers\Teacher\TeacherController::class, 'register']);
Route::post('/login/teacher', [TeacherAuthController::class, 'login'])
    ->middleware(['throttle.login', 'auth.cookies']);
Route::post('/teacher/login', [TeacherAuthController::class, 'login'])
    ->middleware(['throttle.login', 'auth.cookies']);

Route::middleware(['auth:sanctum', \App\Domains\Auth\Http\Middleware\EnsureTeacherNotSuspended::class])->prefix('teacher')->name('teacher.')->group(function () {
    Route::post('/logout', [TeacherAuthController::class, 'logout']);
    Route::get('/me', [TeacherAuthController::class, 'me']);
    Route::post('/change-password', [TeacherAuthController::class, 'changePassword']);
    Route::put('/profile', [TeacherAuthController::class, 'updateProfile']);
    
    // Dashboard routes
    Route::get('/dashboard/stats', [\App\Domains\Application\Http\Controllers\Teacher\DashboardController::class, 'getStats']);
    Route::get('/dashboard/students', [\App\Domains\Application\Http\Controllers\Teacher\DashboardController::class, 'getRecentStudents']);
    Route::get('/dashboard/lectures', [\App\Domains\Application\Http\Controllers\Teacher\DashboardController::class, 'getUpcomingLectures']);
    Route::get('/dashboard/academies', [\App\Domains\Application\Http\Controllers\Teacher\DashboardController::class, 'getTeacherAcademies']);
    
    // Student Management
    Route::get('students/statistics', [\App\Domains\Application\Http\Controllers\Teacher\StudentController::class, 'statistics']);
    Route::get('students/search-phone', [\App\Domains\Application\Http\Controllers\Teacher\StudentController::class, 'searchByPhone']);
    Route::put('students/{student}/permissions', [\App\Domains\Application\Http\Controllers\Teacher\StudentController::class, 'updatePermissions']);
    Route::put('students/{student}/toggle-status', [\App\Domains\Application\Http\Controllers\Teacher\StudentController::class, 'toggleStatus']);
    Route::get('students/{student}/activation-details', [\App\Domains\Application\Http\Controllers\Teacher\StudentController::class, 'activationDetails']);
    Route::put('students/{student}/activate', [\App\Domains\Application\Http\Controllers\Teacher\StudentController::class, 'activate']);
    Route::apiResource('students', \App\Domains\Application\Http\Controllers\Teacher\StudentController::class);
    
    Route::apiResource('grades', \App\Domains\Application\Http\Controllers\Teacher\GradeController::class);
    Route::apiResource('groups', \App\Domains\Application\Http\Controllers\Teacher\GroupController::class);
    Route::apiResource('lectures', \App\Domains\Application\Http\Controllers\Teacher\LectureController::class);
    Route::get('exams/{exam}/results', [\App\Domains\Application\Http\Controllers\Teacher\ExamController::class, 'results']);
    Route::put('exams/{exam}/toggle-status', [\App\Domains\Application\Http\Controllers\Teacher\ExamController::class, 'toggleStatus']);
    Route::put('exams/{exam}/end', [\App\Domains\Application\Http\Controllers\Teacher\ExamController::class, 'endExam']);
    Route::post('exams/{exam}/copy', [\App\Domains\Application\Http\Controllers\Teacher\ExamController::class, 'copy']);
    Route::apiResource('exams', \App\Domains\Application\Http\Controllers\Teacher\ExamController::class);
    Route::post('/lectures/{lecture}/qr-code', [\App\Domains\Application\Http\Controllers\Teacher\LectureAttendanceController::class, 'generateQrCode']);
    Route::post('/lectures/{lecture}/attendance', [\App\Domains\Application\Http\Controllers\Teacher\LectureAttendanceController::class, 'recordAttendance']);
    Route::put('/lectures/{lecture}/toggle-active', [\App\Domains\Application\Http\Controllers\Teacher\LectureController::class, 'toggleActive']);
    Route::post('/lectures/{lecture}/end', [\App\Domains\Application\Http\Controllers\Teacher\LectureController::class, 'endLecture']);
    Route::post('/lectures/{lecture}/cancel-session', [\App\Domains\Application\Http\Controllers\Teacher\LectureController::class, 'cancelSession']);
    Route::get('/lectures/{lecture}/attendees', [\App\Domains\Application\Http\Controllers\Teacher\LectureController::class, 'getAttendees']);
    Route::get('/lectures/{lecture}/attendees/export', [\App\Domains\Application\Http\Controllers\Teacher\LectureController::class, 'exportAttendees']);
    Route::get('/lectures/{lecture}/sessions', [\App\Domains\Application\Http\Controllers\Api\LectureSessionController::class, 'index']);
    Route::post('/lectures/{lecture}/sessions', [\App\Domains\Application\Http\Controllers\Api\LectureSessionController::class, 'store']);
    
    // Secretary Management
    Route::post('secretaries/check-phone', [\App\Domains\Application\Http\Controllers\Teacher\SecretaryController::class, 'checkPhone']);
    Route::put('secretaries/{secretary}/permissions', [\App\Domains\Application\Http\Controllers\Teacher\SecretaryController::class, 'updatePermissions']);
    Route::put('secretaries/{secretary}/toggle-status', [\App\Domains\Application\Http\Controllers\Teacher\SecretaryController::class, 'toggleStatus']);
    Route::apiResource('secretaries', \App\Domains\Application\Http\Controllers\Teacher\SecretaryController::class);
    
    // Notifications
    Route::get('/notifications', [\App\Domains\Application\Http\Controllers\Teacher\NotificationController::class, 'index']);
    Route::post('/notifications', [\App\Domains\Application\Http\Controllers\Teacher\NotificationController::class, 'store']);
    Route::post('/notifications/{id}/read', [\App\Domains\Application\Http\Controllers\Teacher\NotificationController::class, 'markAsRead']);
    Route::get('/notifications/voice-limit', [\App\Domains\Application\Http\Controllers\Teacher\NotificationController::class, 'checkVoiceLimit']);
    Route::post('/notifications/voice', [\App\Domains\Application\Http\Controllers\Teacher\NotificationController::class, 'storeVoice']);

    // Roles and Permissions
    Route::apiResource('permissions', \App\Domains\Application\Http\Controllers\Teacher\PermissionController::class);

    // Gamification
    Route::get('/leaderboard', [\App\Domains\Application\Http\Controllers\Teacher\GamificationController::class, 'leaderboard']);
    Route::get('/gamification/settings', [\App\Domains\Application\Http\Controllers\Teacher\GamificationController::class, 'settings']);
    Route::put('/gamification/settings', [\App\Domains\Application\Http\Controllers\Teacher\GamificationController::class, 'updateSettings']);
    Route::post('/gamification/bonus', [\App\Domains\Application\Http\Controllers\Teacher\GamificationController::class, 'awardBonus']);
    Route::get('/students/{student}/points', [\App\Domains\Application\Http\Controllers\Teacher\GamificationController::class, 'studentPoints']);

    // Payment Logs
    Route::get('payments', [\App\Domains\Application\Http\Controllers\Teacher\PaymentLogController::class, 'index']);
    Route::post('payments', [\App\Domains\Application\Http\Controllers\Teacher\PaymentLogController::class, 'store']);
    Route::post('payments/sync', [\App\Domains\Application\Http\Controllers\Teacher\PaymentLogController::class, 'syncBatch']);
    Route::get('payments/pending', [\App\Domains\Application\Http\Controllers\Teacher\PaymentLogController::class, 'pending']);
    Route::get('payments/statistics', [\App\Domains\Application\Http\Controllers\Teacher\PaymentLogController::class, 'statistics']);
    Route::get('payments/{payment}', [\App\Domains\Application\Http\Controllers\Teacher\PaymentLogController::class, 'show']);
    Route::post('payments/{payment}/cancel', [\App\Domains\Application\Http\Controllers\Teacher\PaymentLogController::class, 'cancel']);

    // Full Payment System for Independent Teacher
    Route::post('students/{student}/payments', [\App\Domains\Application\Http\Controllers\Teacher\PaymentController::class, 'store']);

    // Sync Errors
    Route::get('sync-errors', [\App\Domains\Application\Http\Controllers\Teacher\SyncErrorController::class, 'index']);
    Route::get('sync-errors/count', [\App\Domains\Application\Http\Controllers\Teacher\SyncErrorController::class, 'unresolvedCount']);
    Route::get('sync-errors/{error}', [\App\Domains\Application\Http\Controllers\Teacher\SyncErrorController::class, 'show']);
    Route::post('sync-errors/{error}/resolve', [\App\Domains\Application\Http\Controllers\Teacher\SyncErrorController::class, 'resolve']);
    Route::post('sync-errors/bulk-resolve', [\App\Domains\Application\Http\Controllers\Teacher\SyncErrorController::class, 'bulkResolve']);

    // Reports
    Route::get('reports/my-report', [\App\Domains\Application\Http\Controllers\Teacher\TeacherReportController::class, 'myReport']);
    Route::get('reports/my-report/pdf', [\App\Domains\Application\Http\Controllers\Teacher\TeacherReportController::class, 'myReportPdf']);

    // QR Code Attendance Scanning
    Route::post('/scan/checkin', [\App\Domains\Application\Http\Controllers\Teacher\ScanController::class, 'checkin']);
    Route::post('/scan/checkout', [\App\Domains\Application\Http\Controllers\Teacher\ScanController::class, 'checkout']);
    Route::get('/scan/today-status', [\App\Domains\Application\Http\Controllers\Teacher\ScanController::class, 'todayStatus']);

});

// ============================================
// Student Authentication Routes
// ============================================
Route::post('/login/student', [StudentAuthController::class, 'login'])
    ->middleware(['throttle.login', 'auth.cookies']);
Route::post('/student/login', [StudentAuthController::class, 'login'])
    ->middleware(['throttle.login', 'auth.cookies']);

Route::middleware(['auth:sanctum', \App\Domains\Auth\Http\Middleware\EnsureTeacherNotSuspendedForStudent::class])->prefix('student')->group(function () {
    Route::post('/logout', [StudentAuthController::class, 'logout']);
    Route::get('/me', [StudentAuthController::class, 'me']);
    Route::post('/change-password', [StudentAuthController::class, 'changePassword']);
    Route::post('/attend', [\App\Domains\Application\Http\Controllers\Student\StudentAttendanceController::class, 'markAttendance']);
    Route::get('/exams', [\App\Domains\Application\Http\Controllers\Student\StudentExamController::class, 'index']);
    Route::get('/lectures', [\App\Domains\Application\Http\Controllers\Student\StudentLectureController::class, 'index']);
    Route::get('/attendance', [\App\Domains\Application\Http\Controllers\Student\StudentAttendanceController::class, 'index']);
    Route::get('/dashboard', [\App\Domains\Application\Http\Controllers\Student\StudentDashboardController::class, 'getDashboard']);
    
    // Exam Taking Routes
    Route::get('/exams/{exam}', [\App\Domains\Application\Http\Controllers\Student\StudentExamController::class, 'show']);
    Route::post('/exams/{exam}/start', [\App\Domains\Application\Http\Controllers\Student\StudentExamController::class, 'start']);
    Route::post('/exams/attempts/{attempt}/answer', [\App\Domains\Application\Http\Controllers\Student\StudentExamController::class, 'submitAnswer']);
    Route::post('/exams/attempts/{attempt}/skip', [\App\Domains\Application\Http\Controllers\Student\StudentExamController::class, 'skipQuestion']);
    Route::post('/exams/attempts/{attempt}/terminate', [\App\Domains\Application\Http\Controllers\Student\StudentExamController::class, 'terminate']);
    Route::get('/exams/attempts/{attempt}/status', [\App\Domains\Application\Http\Controllers\Student\StudentExamController::class, 'attemptStatus']);
    Route::get('/exams/{exam}/result', [\App\Domains\Application\Http\Controllers\Student\StudentExamController::class, 'result']);
    
    // Teacher Selection & Dashboard
    Route::get('/teachers', [StudentAuthController::class, 'teachers']);
    Route::get('/teachers/{teacher}/dashboard', [StudentAuthController::class, 'teacherDashboard']);
    
    // Notifications
    Route::get('/notifications', [\App\Domains\Application\Http\Controllers\Student\NotificationController::class, 'index']);
    Route::post('/notifications', [\App\Domains\Application\Http\Controllers\Student\NotificationController::class, 'store']);
    Route::post('/notifications/{id}/read', [\App\Domains\Application\Http\Controllers\Student\NotificationController::class, 'markAsRead']);

    // Gamification
    Route::get('/points', [\App\Domains\Application\Http\Controllers\Student\GamificationController::class, 'index']);
    Route::get('/points/{teacher}', [\App\Domains\Application\Http\Controllers\Student\GamificationController::class, 'show']);
    Route::get('/points/{teacher}/history', [\App\Domains\Application\Http\Controllers\Student\GamificationController::class, 'history']);
    Route::get('/leaderboard/{teacher}', [\App\Domains\Application\Http\Controllers\Student\GamificationController::class, 'leaderboard']);


    // Mistakes (Smart Mistakes Notebook)
    Route::get('/mistakes', [\App\Domains\Application\Http\Controllers\Student\MistakesController::class, 'index']);
    Route::post('/mistakes/{id}/mastered', [\App\Domains\Application\Http\Controllers\Student\MistakesController::class, 'markAsMastered']);
});

// ============================================
// Guardian (Parent) Authentication Routes
// ============================================
Route::post('/login/parent', [\App\Domains\Application\Http\Controllers\Guardian\AuthController::class, 'login'])
    ->middleware(['throttle.login', 'auth.cookies']);
Route::post('/parent/login', [\App\Domains\Application\Http\Controllers\Guardian\AuthController::class, 'login'])
    ->middleware(['throttle.login', 'auth.cookies']);

Route::middleware(['auth:sanctum'])->prefix('parent')->group(function () {
    Route::post('/logout', [\App\Domains\Application\Http\Controllers\Guardian\AuthController::class, 'logout']);
    Route::get('/me', [\App\Domains\Application\Http\Controllers\Guardian\AuthController::class, 'me']);
    Route::put('/profile', [\App\Domains\Application\Http\Controllers\Guardian\AuthController::class, 'updateProfile']);
    Route::post('/change-password', [\App\Domains\Application\Http\Controllers\Guardian\AuthController::class, 'changePassword']);
    Route::get('/children', [\App\Domains\Application\Http\Controllers\Guardian\AuthController::class, 'children']);
    
    // Child Summary
    Route::get('/children/{studentId}/summary', [\App\Domains\Application\Http\Controllers\Guardian\SummaryController::class, 'index']);
    
    // Notifications
    Route::get('/notifications', [\App\Domains\Application\Http\Controllers\Guardian\NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [\App\Domains\Application\Http\Controllers\Guardian\NotificationController::class, 'markAsRead']);
    Route::post('/notifications/mark-all-read', [\App\Domains\Application\Http\Controllers\Guardian\NotificationController::class, 'markAllAsRead']);
    
    // Device Tokens for FCM
    Route::post('/device-tokens', [\App\Domains\Application\Http\Controllers\Api\DeviceTokenController::class, 'store']);
});

// ============================================
// Secretary Authentication Routes
// ============================================
Route::post('/login/secretary', [SecretaryAuthController::class, 'login'])
    ->middleware(['throttle.login', 'auth.cookies']);

// Canonical refresh endpoint + backward-compatible alias
Route::post('/auth/refresh', [\App\Domains\Application\Http\Controllers\Api\RefreshTokenController::class, 'refresh']);
Route::post('/refresh-token', [\App\Domains\Application\Http\Controllers\Api\RefreshTokenController::class, 'refresh']);

Route::middleware(['auth:sanctum', \App\Domains\Auth\Http\Middleware\EnsureSecretaryTeacherNotSuspended::class])->prefix('secretary')->group(function () {
    Route::post('/logout', [SecretaryAuthController::class, 'logout']);
    Route::get('/me', [SecretaryAuthController::class, 'me']);

    // Notifications
    Route::get('/notifications', [\App\Domains\Application\Http\Controllers\Secretary\NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [\App\Domains\Application\Http\Controllers\Secretary\NotificationController::class, 'markAsRead']);
});

// ============================================
// Avatar Routes (All User Types)
// ============================================
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/avatar/upload', [\App\Domains\Application\Http\Controllers\Media\AvatarController::class, 'upload']);
    Route::delete('/avatar', [\App\Domains\Application\Http\Controllers\Media\AvatarController::class, 'delete']);
    Route::get('/avatar', [\App\Domains\Application\Http\Controllers\Media\AvatarController::class, 'show']);
    Route::post('/device-tokens', [\App\Domains\Application\Http\Controllers\Api\DeviceTokenController::class, 'store']);
});

// Public Settings
Route::get('/public-settings', [\App\Domains\Application\Http\Controllers\Admin\SettingsController::class, 'getPublicSettings']);

// Fallback login route for unauthenticated API requests
Route::get('/login', function () {
    return response()->json(['message' => 'Unauthenticated.'], 401);
})->name('login');

}); // End of v1 prefix group

// ============================================
// Public Routes (Outside Versioning)
// ============================================

// Broadcasting Authentication Route - Keep outside versioning
Route::middleware('auth:sanctum')->post('/broadcasting/auth',
    [\App\Domains\Application\Http\Controllers\Api\BroadcastAuthController::class, 'authenticate']
);

// Media Proxy Routes (Stream files from R2) - Keep outside versioning for compatibility
Route::get('/media/voice/{path}', [\App\Domains\Application\Http\Controllers\Api\MediaProxyController::class, 'voice'])
    ->where('path', '.*');
Route::get('/media/{path}', [\App\Domains\Application\Http\Controllers\Api\MediaProxyController::class, 'media'])
    ->where('path', '.*');
