<?php

use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'service' => 'octane']);
});

Route::get('/', function () {
    return view('welcome');
});

Route::get('/test-user', function () {
    try {
        return \App\Domains\Auth\Models\User::first() ?? 'No User Found';
    } catch (\Throwable $e) {
        return $e->getMessage();
    }
});

Route::post('/teachers', [\App\Domains\Application\Http\Controllers\Teacher\TeacherController::class, 'store']);

