<?php

declare(strict_types=1);

namespace App\Domains\Reports\Jobs;

use App\Domains\Reports\ExporterFactory;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

/**
 * Job لتوليد التقارير بشكل Async.
 *
 * Usage:
 *   GenerateReportJob::dispatch(
 *       format: 'pdf',
 *       reportType: 'exam_results',
 *       data: [...],
 *       options: ['title' => 'نتائج الامتحانات'],
 *       notifyUserId: $teacherId,
 *       notifyUserType: 'teacher',
 *   );
 */
class GenerateReportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int    $tries = 2;

    public function __construct(
        public readonly string  $format,           // 'pdf' | 'excel'
        public readonly string  $reportType,       // 'exam_results' | 'attendance' | ...
        public readonly array   $data,
        public readonly array   $options = [],
        public readonly ?string $notifyUserId   = null,
        public readonly ?string $notifyUserType = null,
    ) {}

    public function handle(): void
    {
        try {
            $exporter = ExporterFactory::make($this->format);
            $path     = $exporter->export($this->data, $this->options);

            Log::info('GenerateReportJob: done', [
                'type'   => $this->reportType,
                'format' => $this->format,
                'path'   => $path,
            ]);

            // TODO: إرسال إشعار للمستخدم بعد توليد التقرير
            // if ($this->notifyUserId && $this->notifyUserType) {
            //     $user = $this->resolveUser();
            //     $user?->notify(new ReportReadyNotification($path));
            // }
        } catch (\Throwable $e) {
            Log::error('GenerateReportJob: failed', [
                'type'    => $this->reportType,
                'format'  => $this->format,
                'error'   => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
