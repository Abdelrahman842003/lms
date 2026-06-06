<?php

declare(strict_types=1);

use App\Domains\Application\Services\FileUploadValidator;
use Illuminate\Http\UploadedFile;

uses(Tests\TestCase::class);

it('validates audio file mime types and extensions correctly', function () {
    $validator = new FileUploadValidator();

    // Valid audio files
    $files = [
        UploadedFile::fake()->create('voice.weba', 100, 'audio/webm'),
        UploadedFile::fake()->create('voice.weba', 100, 'video/x-matroska'),
        UploadedFile::fake()->create('voice.webm', 100, 'video/x-matroska'),
        UploadedFile::fake()->create('voice.ogg', 100, 'audio/ogg'),
        UploadedFile::fake()->create('voice.ogg', 100, 'video/ogg'),
        UploadedFile::fake()->create('voice.ogg', 100, 'application/ogg'),
        UploadedFile::fake()->create('voice.mp3', 100, 'audio/mpeg'),
        UploadedFile::fake()->create('voice.wav', 100, 'audio/wav'),
    ];

    foreach ($files as $file) {
        $errors = $validator->validate($file, 'audio');
        expect($errors)->toBeEmpty();
    }
});

it('detects spoofed files', function () {
    $validator = new FileUploadValidator();

    // Spoofed file: PHP detects PDF but extension is mp3
    $file = UploadedFile::fake()->create('voice.mp3', 100, 'application/pdf');

    $errors = $validator->validate($file, 'audio');
    expect($errors)->not->toBeEmpty();
    expect($errors)->toContain('File extension does not match content.');
});
