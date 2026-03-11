<?php

declare(strict_types=1);

namespace App\Domains\Reports\Jobs;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Academy;
use App\Domains\Reports\ExporterFactory;
use App\Domains\Reports\Notifications\ReportReadyNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

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

            Log::debug('GenerateReportJob: done', [
                'type'   => $this->reportType,
                'format' => $this->format,
                'path'   => $path,
            ]);

            // إرسال إشعار للمستخدم بعد توليد التقرير
            if ($this->notifyUserId && $this->notifyUserType) {
                $user = $this->resolveUser();
                if ($user) {
                    $user->notify(new ReportReadyNotification(
                        $path,
                        $this->reportType,
                        $this->format
                    ));
                }
            }
        } catch (\Throwable $e) {
            Log::error('GenerateReportJob: failed', [
                'type'    => $this->reportType,
                'format'  => $this->format,
                'error'   => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * تحديد المستخدم الذي سيستلم الإشعار
     */
    private function resolveUser(): ?Model
    {
        return match ($this->notifyUserType) {
            'teacher' => Teacher::find($this->notifyUserId),
            'admin' => Admin::find($this->notifyUserId),
            'academy' => Academy::find($this->notifyUserId),
            default => null,
        };
    }
}
