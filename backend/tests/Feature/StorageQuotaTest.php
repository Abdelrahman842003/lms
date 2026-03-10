<?php

declare(strict_types=1);

use App\Domains\Auth\Models\Teacher;
use App\Domains\Subscriptions\Services\StorageQuotaService;
use App\Domains\Videos\Enums\VideoOwnerType;
use App\Domains\Videos\Enums\VideoProcessingStatus;
use App\Domains\Videos\Enums\VideoStatus;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Models\VideoAttachment;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sqTeacher(?int $limitGb, int $usedBytes = 0): Teacher
{
    return Teacher::factory()->create([
        'status'                => 'active',
        'is_independent_active' => true,
        'storage_limit_gb'      => $limitGb,
        'storage_used_bytes'    => $usedBytes,
    ]);
}

function sqVideo(Teacher $teacher, int $sizeBytes): Video
{
    return Video::query()->create([
        'owner_type'        => VideoOwnerType::INDEPENDENT_TEACHER->value,
        'owner_id'          => $teacher->id,
        'uploader_type'     => 'teacher',
        'uploader_id'       => $teacher->id,
        'title'             => 'test video',
        'status'            => VideoStatus::READY,
        'processing_status' => VideoProcessingStatus::SUCCEEDED,
        'video_size_bytes'  => $sizeBytes,
    ]);
}

function sqAttachment(Video $video, int $sizeBytes): VideoAttachment
{
    return VideoAttachment::query()->create([
        'video_id'        => $video->id,
        'title'           => 'attachment',
        'file_name'       => 'file.pdf',
        'file_path'       => 'attachments/file.pdf',
        'mime_type'       => 'application/pdf',
        'file_size'       => $sizeBytes,
        'uploaded_by_type' => 'teacher',
        'uploaded_by_id'  => $video->owner_id,
    ]);
}

// ─── assertCanUpload ──────────────────────────────────────────────────────────

describe('StorageQuotaService::assertCanUpload', function () {
    it('passes for unlimited owner regardless of size', function () {
        $teacher = sqTeacher(limitGb: null, usedBytes: 0);
        $service = app(StorageQuotaService::class);

        // Should NOT throw even for 100 GB
        $service->assertCanUpload($teacher, 100 * 1_073_741_824);
    })->group('storage');

    it('passes when upload fits within the remaining quota', function () {
        // 5 GB limit, 4 GB used → 1 GB remaining; upload 900 MB — OK
        $teacher = sqTeacher(limitGb: 5, usedBytes: 4 * 1_073_741_824);
        $service = app(StorageQuotaService::class);

        $service->assertCanUpload($teacher, 900 * 1024 * 1024);
    })->group('storage');

    it('throws when upload would exceed the limit', function () {
        // 5 GB limit, 4 GB used → 1 GB remaining; upload 2 GB — FAIL
        $teacher = sqTeacher(limitGb: 5, usedBytes: 4 * 1_073_741_824);
        $service = app(StorageQuotaService::class);

        expect(fn () => $service->assertCanUpload($teacher, 2 * 1_073_741_824))
            ->toThrow(AuthorizationException::class);
    })->group('storage');

    it('throws when already at the exact limit', function () {
        $teacher = sqTeacher(limitGb: 5, usedBytes: 5 * 1_073_741_824);
        $service = app(StorageQuotaService::class);

        expect(fn () => $service->assertCanUpload($teacher, 1))
            ->toThrow(AuthorizationException::class);
    })->group('storage');
});

// ─── incrementUsage ───────────────────────────────────────────────────────────

describe('StorageQuotaService::incrementUsage', function () {
    it('increments storage_used_bytes', function () {
        $teacher = sqTeacher(limitGb: 10, usedBytes: 0);
        $service = app(StorageQuotaService::class);

        $service->incrementUsage($teacher, 500 * 1024 * 1024);

        expect($teacher->fresh()->storage_used_bytes)->toBe(500 * 1024 * 1024);
    })->group('storage');

    it('ignores zero bytes', function () {
        $teacher = sqTeacher(limitGb: 10, usedBytes: 1000);
        $service = app(StorageQuotaService::class);

        $service->incrementUsage($teacher, 0);

        expect($teacher->fresh()->storage_used_bytes)->toBe(1000);
    })->group('storage');
});

// ─── decrementUsage ───────────────────────────────────────────────────────────

describe('StorageQuotaService::decrementUsage', function () {
    it('decrements storage_used_bytes after deletion', function () {
        $usedBytes = 2 * 1_073_741_824;
        $teacher   = sqTeacher(limitGb: 5, usedBytes: $usedBytes);
        $service   = app(StorageQuotaService::class);

        $service->decrementUsage($teacher, 1_073_741_824); // remove 1 GB

        expect($teacher->fresh()->storage_used_bytes)->toBe(1_073_741_824);
    })->group('storage');

    it('clamps to zero and never goes negative', function () {
        $teacher = sqTeacher(limitGb: 5, usedBytes: 100);
        $service = app(StorageQuotaService::class);

        $service->decrementUsage($teacher, 99_999_999);

        expect($teacher->fresh()->storage_used_bytes)->toBe(0);
    })->group('storage');
});

// ─── recalculateUsage ─────────────────────────────────────────────────────────

describe('StorageQuotaService::recalculateUsage', function () {
    it('sums video bytes and attachment bytes', function () {
        $teacher = sqTeacher(limitGb: 10, usedBytes: 0);
        $service = app(StorageQuotaService::class);

        $video = sqVideo($teacher, 300 * 1024 * 1024); // 300 MB
        sqAttachment($video, 50 * 1024 * 1024);         // 50 MB

        $result = $service->recalculateUsage($teacher);

        expect($result)->toBe(350 * 1024 * 1024);
        expect($teacher->fresh()->storage_used_bytes)->toBe(350 * 1024 * 1024);
    })->group('storage');

    it('returns zero when teacher has no content', function () {
        $teacher = sqTeacher(limitGb: 10, usedBytes: 999_999);
        $service = app(StorageQuotaService::class);

        $result = $service->recalculateUsage($teacher);

        expect($result)->toBe(0);
        expect($teacher->fresh()->storage_used_bytes)->toBe(0);
    })->group('storage');
});

// ─── getStorageSnapshot ───────────────────────────────────────────────────────

describe('StorageQuotaService::getStorageSnapshot', function () {
    it('returns unlimited snapshot for null limit', function () {
        $teacher  = sqTeacher(limitGb: null, usedBytes: 5_000_000);
        $snapshot = app(StorageQuotaService::class)->getStorageSnapshot($teacher);

        expect($snapshot['is_unlimited'])->toBeTrue();
        expect($snapshot['limit_gb'])->toBeNull();
        expect($snapshot['remaining_bytes'])->toBeNull();
        expect($snapshot['remaining_gb'])->toBeNull();
        expect($snapshot['percentage'])->toBe(0.0);
    })->group('storage');

    it('calculates 50% usage correctly', function () {
        $teacher  = sqTeacher(limitGb: 10, usedBytes: 5 * 1_073_741_824);
        $snapshot = app(StorageQuotaService::class)->getStorageSnapshot($teacher);

        expect($snapshot['is_unlimited'])->toBeFalse();
        expect($snapshot['limit_gb'])->toBe(10);
        expect($snapshot['percentage'])->toBe(50.0);
        expect($snapshot['remaining_bytes'])->toBe(5 * 1_073_741_824);
    })->group('storage');

    it('clamps percentage to 100 when over limit', function () {
        $teacher  = sqTeacher(limitGb: 5, usedBytes: 10 * 1_073_741_824);
        $snapshot = app(StorageQuotaService::class)->getStorageSnapshot($teacher);

        expect($snapshot['percentage'])->toBe(100.0);
        expect($snapshot['remaining_bytes'])->toBe(0);
        expect($snapshot['remaining_gb'])->toBe(0.0);
    })->group('storage');
});
