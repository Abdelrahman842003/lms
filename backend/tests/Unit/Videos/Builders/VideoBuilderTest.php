<?php

declare(strict_types=1);

namespace Tests\Unit\Videos\Builders;

use App\Domains\Auth\Models\Teacher;
use Tests\Support\Builders\VideoBuilder;
use Tests\Support\Builders\VideoUploadSessionBuilder;
use App\Domains\Videos\DTOs\VideoActorContext;
use App\Domains\Videos\Enums\VideoProcessingStatus;
use App\Domains\Videos\Enums\VideoStatus;
use App\Domains\Videos\Enums\VideoUploadSessionStatus;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Test suite for the Builder Pattern implementation in Videos.
 * 
 * @see https://refactoring.guru/design-patterns/builder
 */
class VideoBuilderTest extends TestCase
{
    use MockeryPHPUnitIntegration;

    // ==========================================
    // VideoBuilder Tests
    // ==========================================

    #[Test]
    public function video_builder_requires_title(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Video title is required');

        VideoBuilder::create()
            ->ownedBy('Teacher', '1')
            ->uploadedBy('Teacher', '1')
            ->buildArray();
    }

    #[Test]
    public function video_builder_requires_owner(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Missing required field: owner_type');

        VideoBuilder::create()
            ->titled('Test Video')
            ->uploadedBy('Teacher', '1')
            ->buildArray();
    }

    #[Test]
    public function video_builder_requires_uploader(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Missing required field: uploader_type');

        VideoBuilder::create()
            ->titled('Test Video')
            ->ownedBy('Teacher', '1')
            ->buildArray();
    }

    #[Test]
    public function video_builder_creates_minimal_video_array(): void
    {
        $data = VideoBuilder::create()
            ->titled('Test Video')
            ->ownedBy('Teacher', 'teacher-1')
            ->uploadedBy('Teacher', 'teacher-1')
            ->buildArray();

        $this->assertEquals('Test Video', $data['title']);
        $this->assertEquals('Teacher', $data['owner_type']);
        $this->assertEquals('teacher-1', $data['owner_id']);
        $this->assertEquals('Teacher', $data['uploader_type']);
        $this->assertEquals('teacher-1', $data['uploader_id']);
        $this->assertEquals(VideoStatus::DRAFT, $data['status']);
        $this->assertEquals(VideoProcessingStatus::PENDING, $data['processing_status']);
    }

    #[Test]
    public function video_builder_sets_status_fluently(): void
    {
        $draft = VideoBuilder::create()
            ->titled('Draft')
            ->ownedBy('Teacher', '1')
            ->uploadedBy('Teacher', '1')
            ->asDraft()
            ->buildArray();

        $uploading = VideoBuilder::create()
            ->titled('Uploading')
            ->ownedBy('Teacher', '1')
            ->uploadedBy('Teacher', '1')
            ->asUploading()
            ->buildArray();

        $processing = VideoBuilder::create()
            ->titled('Processing')
            ->ownedBy('Teacher', '1')
            ->uploadedBy('Teacher', '1')
            ->asProcessing()
            ->buildArray();

        $ready = VideoBuilder::create()
            ->titled('Ready')
            ->ownedBy('Teacher', '1')
            ->uploadedBy('Teacher', '1')
            ->asReady()
            ->buildArray();

        $published = VideoBuilder::create()
            ->titled('Published')
            ->ownedBy('Teacher', '1')
            ->uploadedBy('Teacher', '1')
            ->asPublished()
            ->buildArray();

        $this->assertEquals(VideoStatus::DRAFT, $draft['status']);
        $this->assertEquals(VideoStatus::UPLOADING, $uploading['status']);
        $this->assertEquals(VideoStatus::PROCESSING, $processing['status']);
        $this->assertEquals(VideoStatus::READY, $ready['status']);
        $this->assertEquals(VideoStatus::PUBLISHED, $published['status']);
    }

    #[Test]
    public function video_builder_sets_file_info(): void
    {
        $data = VideoBuilder::create()
            ->titled('Test Video')
            ->ownedBy('Teacher', '1')
            ->uploadedBy('Teacher', '1')
            ->withFile('videos/test.mp4', 'video/mp4', 1024000)
            ->buildArray();

        $this->assertEquals('videos/test.mp4', $data['original_path']);
        $this->assertEquals('video/mp4', $data['video_mime']);
        $this->assertEquals(1024000, $data['video_size_bytes']);
    }

    #[Test]
    public function video_builder_sets_availability_window(): void
    {
        $data = VideoBuilder::create()
            ->titled('Test Video')
            ->ownedBy('Teacher', '1')
            ->uploadedBy('Teacher', '1')
            ->availableDuring('2024-01-01 00:00:00', '2024-12-31 23:59:59')
            ->buildArray();

        $this->assertEquals('2024-01-01 00:00:00', $data['available_from']);
        $this->assertEquals('2024-12-31 23:59:59', $data['available_until']);
    }

    #[Test]
    public function video_builder_sets_educational_context(): void
    {
        $data = VideoBuilder::create()
            ->titled('Test Video')
            ->ownedBy('Teacher', '1')
            ->uploadedBy('Teacher', '1')
            ->forAcademy('academy-1')
            ->forGrade('grade-1')
            ->forLecture('lecture-1')
            ->forLesson('lesson-1')
            ->buildArray();

        $this->assertEquals('academy-1', $data['academy_id']);
        $this->assertEquals('grade-1', $data['grade_id']);
        $this->assertEquals('lecture-1', $data['lecture_id']);
        $this->assertEquals('lesson-1', $data['lesson_id']);
    }

    #[Test]
    public function video_builder_sets_teacher_reference(): void
    {
        $data = VideoBuilder::create()
            ->titled('Test Video')
            ->ownedBy('Academy', 'academy-1')
            ->uploadedBy('Secretary', 'secretary-1')
            ->withTeacher('teacher-1', 'Ahmed Mohamed')
            ->buildArray();

        $this->assertEquals('teacher-1', $data['teacher_reference_id']);
        $this->assertEquals('Ahmed Mohamed', $data['teacher_reference_name']);
    }

    #[Test]
    public function video_builder_sets_visibility(): void
    {
        $public = VideoBuilder::create()
            ->titled('Public Video')
            ->ownedBy('Teacher', '1')
            ->uploadedBy('Teacher', '1')
            ->makePublic()
            ->buildArray();

        $private = VideoBuilder::create()
            ->titled('Private Video')
            ->ownedBy('Teacher', '1')
            ->uploadedBy('Teacher', '1')
            ->makePrivate()
            ->buildArray();

        $this->assertTrue($public['is_public']);
        $this->assertFalse($private['is_public']);
    }

    #[Test]
    public function video_builder_sets_groups(): void
    {
        // Groups are set after build, not in the array
        $builder = VideoBuilder::create()
            ->titled('Test Video')
            ->ownedBy('Teacher', '1')
            ->uploadedBy('Teacher', '1')
            ->forGroups(['group-1', 'group-2']);

        // Just verify the builder accepts groups without error
        $this->assertInstanceOf(VideoBuilder::class, $builder);
    }

    // ==========================================
    // VideoUploadSessionBuilder Tests
    // ==========================================

    #[Test]
    public function upload_session_builder_requires_video_id(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Missing required field: video_id');

        VideoUploadSessionBuilder::create()
            ->withUploaderDetails('Teacher', '1')
            ->withR2UploadId('r2-upload-123')
            ->withObjectKey('videos/test.mp4')
            ->buildArray();
    }

    #[Test]
    public function upload_session_builder_requires_r2_upload_id(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Missing required field: r2_upload_id');

        VideoUploadSessionBuilder::create()
            ->forVideoId('video-1')
            ->withUploaderDetails('Teacher', '1')
            ->withObjectKey('videos/test.mp4')
            ->buildArray();
    }

    #[Test]
    public function upload_session_builder_requires_object_key(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Missing required field: object_key');

        VideoUploadSessionBuilder::create()
            ->forVideoId('video-1')
            ->withUploaderDetails('Teacher', '1')
            ->withR2UploadId('r2-upload-123')
            ->buildArray();
    }

    #[Test]
    public function upload_session_builder_creates_minimal_session_array(): void
    {
        $data = VideoUploadSessionBuilder::create()
            ->forVideoId('video-1')
            ->withUploaderDetails('Teacher', 'teacher-1')
            ->withR2UploadId('r2-upload-123')
            ->withObjectKey('videos/test.mp4')
            ->buildArray();

        $this->assertEquals('video-1', $data['video_id']);
        $this->assertEquals('Teacher', $data['uploader_type']);
        $this->assertEquals('teacher-1', $data['uploader_id']);
        $this->assertEquals('r2-upload-123', $data['r2_upload_id']);
        $this->assertEquals('videos/test.mp4', $data['object_key']);
        $this->assertEquals(VideoUploadSessionStatus::PENDING_UPLOAD, $data['status']);
    }

    #[Test]
    public function upload_session_builder_sets_file_info(): void
    {
        $data = VideoUploadSessionBuilder::create()
            ->forVideoId('video-1')
            ->withUploaderDetails('Teacher', '1')
            ->withR2UploadId('r2-upload-123')
            ->withObjectKey('videos/test.mp4')
            ->withFileInfo('lecture-1.mp4', 'video/mp4', 2048000)
            ->buildArray();

        $this->assertEquals('lecture-1.mp4', $data['declared_filename']);
        $this->assertEquals('video/mp4', $data['declared_mime']);
        $this->assertEquals(2048000, $data['declared_size_bytes']);
    }

    #[Test]
    public function upload_session_builder_sets_parts(): void
    {
        $data = VideoUploadSessionBuilder::create()
            ->forVideoId('video-1')
            ->withUploaderDetails('Teacher', '1')
            ->withR2UploadId('r2-upload-123')
            ->withObjectKey('videos/test.mp4')
            ->withTotalParts(10)
            ->buildArray();

        $this->assertEquals(10, $data['total_parts']);
    }

    #[Test]
    public function upload_session_builder_sets_status_fluently(): void
    {
        $pending = VideoUploadSessionBuilder::create()
            ->forVideoId('video-1')
            ->withUploaderDetails('Teacher', '1')
            ->withR2UploadId('r2-upload-123')
            ->withObjectKey('videos/test.mp4')
            ->pendingUpload()
            ->buildArray();

        $uploading = VideoUploadSessionBuilder::create()
            ->forVideoId('video-1')
            ->withUploaderDetails('Teacher', '1')
            ->withR2UploadId('r2-upload-123')
            ->withObjectKey('videos/test.mp4')
            ->uploading()
            ->buildArray();

        $completed = VideoUploadSessionBuilder::create()
            ->forVideoId('video-1')
            ->withUploaderDetails('Teacher', '1')
            ->withR2UploadId('r2-upload-123')
            ->withObjectKey('videos/test.mp4')
            ->completed()
            ->buildArray();

        $aborted = VideoUploadSessionBuilder::create()
            ->forVideoId('video-1')
            ->withUploaderDetails('Teacher', '1')
            ->withR2UploadId('r2-upload-123')
            ->withObjectKey('videos/test.mp4')
            ->aborted()
            ->buildArray();

        $this->assertEquals(VideoUploadSessionStatus::PENDING_UPLOAD, $pending['status']);
        $this->assertEquals(VideoUploadSessionStatus::UPLOADING, $uploading['status']);
        $this->assertEquals(VideoUploadSessionStatus::COMPLETED, $completed['status']);
        $this->assertEquals(VideoUploadSessionStatus::ABORTED, $aborted['status']);
    }

    #[Test]
    public function upload_session_builder_sets_initiator_ip(): void
    {
        $data = VideoUploadSessionBuilder::create()
            ->forVideoId('video-1')
            ->withUploaderDetails('Teacher', '1')
            ->withR2UploadId('r2-upload-123')
            ->withObjectKey('videos/test.mp4')
            ->fromIp('192.168.1.100')
            ->buildArray();

        $this->assertEquals('192.168.1.100', $data['initiator_ip']);
    }

    #[Test]
    public function upload_session_builder_sets_metadata(): void
    {
        $data = VideoUploadSessionBuilder::create()
            ->forVideoId('video-1')
            ->withUploaderDetails('Teacher', '1')
            ->withR2UploadId('r2-upload-123')
            ->withObjectKey('videos/test.mp4')
            ->withMetadata(['user_agent' => 'Mozilla/5.0', 'source' => 'web'])
            ->buildArray();

        $this->assertEquals(['user_agent' => 'Mozilla/5.0', 'source' => 'web'], $data['metadata']);
    }

    #[Test]
    public function builders_can_be_created_statically(): void
    {
        $videoBuilder = VideoBuilder::create();
        $sessionBuilder = VideoUploadSessionBuilder::create();

        $this->assertInstanceOf(VideoBuilder::class, $videoBuilder);
        $this->assertInstanceOf(VideoUploadSessionBuilder::class, $sessionBuilder);
    }
}
