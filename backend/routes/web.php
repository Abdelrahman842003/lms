<?php

use Illuminate\Support\Facades\Route;


// في ملف web.php
Route::get('/', function () { return response('OK', 200); });


Route::get('/test-user', function () {
    try {
        return \App\Domains\Auth\Models\User::first() ?? 'No User Found';
    } catch (\Throwable $e) {
        return $e->getMessage();
    }
});

Route::post('/teachers', [\App\Domains\Application\Http\Controllers\Teacher\TeacherController::class, 'store']);

