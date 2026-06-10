<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Domains\Auth\Models\Academy;
use App\Domains\Application\Http\Controllers\Academy\LectureController;
use Illuminate\Http\Request;
use App\Domains\Lectures\Models\Lecture;

$academy = Academy::first();
auth()->guard('academy')->login($academy);
auth()->shouldUse('academy');

$controller = app()->make(LectureController::class);

$lecture = Lecture::withoutGlobalScopes()->first();
echo "Testing with Lecture ID: " . $lecture->id . "\n";

// Emulate route model binding by creating a route that does the binding
$router = app('router');
$request = Request::create('/api/v1/academy/lectures/' . $lecture->id . '/toggle-active', 'PUT', ['is_active' => true]);
$request->setUserResolver(function () use ($academy) { return $academy; });

try {
    $response = app()->handle($request);
    echo $response->getContent();
} catch (\Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}
