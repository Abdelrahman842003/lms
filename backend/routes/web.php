<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/test-user', function () {
    try {
        return \App\Models\User::first() ?? 'No User Found';
    } catch (\Throwable $e) {
        return $e->getMessage();
    }
});

Route::post('/teachers', [\App\Http\Controllers\Teacher\TeacherController::class, 'store']);

// Sanctum CSRF Cookie Route
Route::get('/sanctum/csrf-cookie', function () {
    return response()->json(['message' => 'CSRF cookie set']);
});
