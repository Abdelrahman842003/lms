<?php

declare(strict_types=1);

namespace App\Domains\Media\Jobs;

use App\Domains\Media\Adapters\StorageAdapter;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Http\UploadedFile;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Job لمعالجة رفع الميديا بشكل Async.
 *
 * يستقبل مسار الملف المؤقت + الـ path المستهدف
 * ويرفعه عبر StorageAdapter المناسب.
 *
 * Note: UploadedFile لا يُسلسل في Queue بشكل موثوق،
 * لذلك يُخزّن الملف مؤقتاً في storage/app/temp ويُرسل مسار السلسلة.
 */
class ProcessMediaUpload implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;


    public int $tries = 3;

    public function __construct(
        public readonly string  $tempPath,    // مسار مؤقت في storage/app/temp
        public readonly string  $targetPath,  // المسار المستهدف في Storage
        public readonly string  $modelType,   // 'teacher' | 'student' | ...
        public readonly string  $modelId,
        public readonly string  $attribute,   // 'avatar' | 'attachment' | ...
    ) {}

    public function handle(StorageAdapter $storage): void
    {
        if (! file_exists($this->tempPath)) {
            Log::warning('ProcessMediaUpload: temp file not found', ['path' => $this->tempPath]);
            return;
        }

        // إنشاء UploadedFile من المسار المؤقت
        $file = new \Illuminate\Http\File($this->tempPath);

        $storedPath = $storage->upload(
            new UploadedFile($file->getPathname(), $file->getFilename()),
            $this->targetPath,
        );

        // حذف الملف المؤقت بعد الرفع
        @unlink($this->tempPath);

        // تحديث نموذج البيانات بالـ URL الجديد
        $this->updateModel($storage->url($storedPath));

        Log::info('ProcessMediaUpload: done', [
            'model'      => $this->modelType,
            'id'         => $this->modelId,
            'attribute'  => $this->attribute,
            'stored_path'=> $storedPath,
        ]);
    }

    private function updateModel(string $url): void
    {
        $modelClass = match ($this->modelType) {
            'teacher'  => \App\Domains\Auth\Models\Teacher::class,
            'student'  => \App\Domains\Auth\Models\Student::class,
            'question' => \App\Domains\Exams\Models\Question::class,
            default    => null,
        };

        if ($modelClass) {
            $modelClass::where('id', $this->modelId)
                ->update([$this->attribute => $url]);
        }
    }
}
