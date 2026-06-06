<?php

declare(strict_types=1);

use App\Domains\Auth\Notifications\AdminNotification;

uses(Tests\TestCase::class);

it('formats database notification correctly', function () {
    $notification = new AdminNotification(
        title: 'New Voice Message',
        message: 'Hello World',
        senderName: 'John Doe',
        senderRole: 'teacher',
        data: [
            'is_voice' => true,
            'voice_url' => 'https://files.neetaq.com/voice.mp3'
        ]
    );

    $notifiable = new class {
        public $id = 1;
    };

    $dbMessage = $notification->toDatabase($notifiable);

    expect($dbMessage)->toBeArray();
    expect($dbMessage['title'])->toBe('New Voice Message');
    expect($dbMessage['body'])->toContain('John Doe');
    expect($dbMessage['actions'])->toBeArray();
    expect($dbMessage['actions'][0]['name'])->toBe('listen');
});
