<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Domains\Auth\Models\Academy;
use App\Domains\Application\Http\Controllers\Academy\LectureController;
use Illuminate\Http\Request;

$academy = Academy::first();
auth()->guard('academy')->login($academy);
auth()->shouldUse('academy');

$controller = app()->make(LectureController::class);
$request = Request::create('/api/v1/academy/lectures', 'GET', []);
$request->setUserResolver(function () use ($academy) {
    return $academy;
});

// Since getAcademy() uses $request->user(), we need to bind it.
$response = $controller->index($request);
echo $response->getContent();
