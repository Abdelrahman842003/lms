<?php

use Illuminate\Support\Facades\Route;
use App\Domains\Application\Http\Controllers\Admin\AdminReportController;

Route::prefix('admin')->middleware('auth:admin')->name('admin.')->group(function () {
    Route::get('/reports', [AdminReportController::class, 'index']);
    Route::get('/reports/drilldown/{key}', [AdminReportController::class, 'drilldown']);
    Route::get('/reports/export', [AdminReportController::class, 'export']);
});
