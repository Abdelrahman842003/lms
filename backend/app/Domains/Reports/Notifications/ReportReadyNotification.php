<?php

declare(strict_types=1);

namespace App\Domains\Reports\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class ReportReadyNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $filePath,
        public readonly string $reportType = 'report',
        public readonly string $format = 'pdf'
    ) {}

    public function via($notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable): MailMessage
    {
        $formatLabel = $this->format === 'pdf' ? 'PDF' : 'Excel';
        $reportLabel = $this->getReportTypeLabel();

        return (new MailMessage)
            ->subject("تقرير {$reportLabel} جاهز للتحميل")
            ->greeting('مرحباً،')
            ->line("تم إنشاء تقرير {$reportLabel} بصيغة {$formatLabel} بنجاح.")
            ->line('يمكنك تحميله من خلال الضغط على الزر أدناه.')
            ->action('تحميل التقرير", $this->filePath)
            ->line('شكراً لاستخدامك نظامنا!');
    }

    public function toDatabase($notifiable): array
    {
        $formatLabel = $this->format === 'pdf' ? 'PDF' : 'Excel';
        $reportLabel = $this->getReportTypeLabel();

        return [
            'title' => "تقرير {$reportLabel} جاهز",
            'body' => "تم إنشاء تقرير {$reportLabel} بصيغة {$formatLabel} بنجاح.",
            'file_path' => $this->filePath,
            'report_type' => $this->reportType,
            'format' => $this->format,
            'created_at' => now()->toDateTimeString(),
        ];
    }

    private function getReportTypeLabel(): string
    {
        return match ($this->reportType) {
            'exam_results' => 'نتائج الامتحانات',
            'attendance' => 'سجل الحضور',
            'students' => 'قائمة الطلاب',
            'grades' => 'المستويات الدراسية',
            'payments' => 'سجل المدفوعات',
            default => 'التقارير',
        };
    }
}
