<?php

declare(strict_types=1);

use App\Domains\Application\Http\Controllers\Teacher\NotificationController;
use App\Domains\Application\Services\Teacher\NotificationService;
use App\Domains\Notifications\Services\NotificationSettingsService;
use App\Domains\Notifications\Services\VoiceNotificationService;
use App\Domains\Subscriptions\Services\StorageQuotaService;
use Illuminate\Http\Request;

it('always allows voice notifications and returns configured max duration', function () {
    $controller = new NotificationController(
        notificationService: mock(NotificationService::class),
        voiceService: mock(VoiceNotificationService::class),
        notificationSettings: mock(NotificationSettingsService::class),
        storageQuota: mock(StorageQuotaService::class),
    );

    $response = $controller->checkVoiceLimit(Request::create('/api/v1/teacher/notifications/voice-limit', 'GET'));
    $payload = $response->getData(true);

    expect($response->getStatusCode())->toBe(200);
    expect($payload['status'])->toBeTrue();
    expect($payload['data']['can_send_voice'])->toBeTrue();
    expect($payload['data']['max_duration'])->toBe(VoiceNotificationService::MAX_DURATION);
});
