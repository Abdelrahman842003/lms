<?php

declare(strict_types=1);

use App\Domains\Notifications\Services\VoiceNotificationService;
use Illuminate\Http\UploadedFile;

uses(Tests\TestCase::class);

it('accepts webm audio files detected as video/x-matroska', function () {
    $service = new VoiceNotificationService();

    // Create a fake file with video/x-matroska mime type
    $file = UploadedFile::fake()->create('voice.weba', 100, 'video/x-matroska');

    // Should not throw an exception
    expect(fn () => $service->validateAudioFile($file, 10))->not->toThrow(\InvalidArgumentException::class);
});

it('accepts ogg audio files detected as application/ogg or video/ogg', function () {
    $service = new VoiceNotificationService();

    // Create fake files
    $fileAppOgg = UploadedFile::fake()->create('voice.ogg', 100, 'application/ogg');
    $fileVideoOgg = UploadedFile::fake()->create('voice.ogg', 100, 'video/ogg');

    // Should not throw exceptions
    expect(fn () => $service->validateAudioFile($fileAppOgg, 10))->not->toThrow(\InvalidArgumentException::class);
    expect(fn () => $service->validateAudioFile($fileVideoOgg, 10))->not->toThrow(\InvalidArgumentException::class);
});

it('rejects files exceeding max size', function () {
    $service = new VoiceNotificationService();

    // Max file size is 2MB (2097152 bytes)
    $file = UploadedFile::fake()->create('voice.weba', 2500, 'audio/webm'); // 2.5MB

    expect(fn () => $service->validateAudioFile($file, 10))->toThrow(
        \InvalidArgumentException::class,
        'حجم الملف كبير جداً'
    );
});

it('rejects files exceeding max duration', function () {
    $service = new VoiceNotificationService();
    $file = UploadedFile::fake()->create('voice.weba', 100, 'audio/webm');

    expect(fn () => $service->validateAudioFile($file, VoiceNotificationService::MAX_DURATION + 1))->toThrow(
        \InvalidArgumentException::class,
        'مدة التسجيل تتجاوز الحد الأقصى'
    );
});

it('rejects invalid mime types', function () {
    $service = new VoiceNotificationService();
    $file = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

    expect(fn () => $service->validateAudioFile($file, 10))->toThrow(
        \InvalidArgumentException::class,
        'صيغة الملف غير مدعومة'
    );
});
