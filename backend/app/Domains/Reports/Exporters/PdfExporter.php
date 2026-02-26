<?php

declare(strict_types=1);

namespace App\Domains\Reports\Exporters;

use App\Domains\Reports\Contracts\ReportExporter;
use Barryvdh\DomPDF\Facade\Pdf;

/**
 * يُصدّر التقارير بصيغة PDF باستخدام dompdf.
 *
 * options:
 *  - view     : string  Blade template (default: 'reports.default')
 *  - title    : string
 *  - filename : string  (بدون امتداد)
 *  - orientation: 'portrait' | 'landscape'
 */
final class PdfExporter implements ReportExporter
{
    public function export(array $data, array $options = []): string
    {
        $view        = $options['view'] ?? 'reports.default';
        $orientation = $options['orientation'] ?? 'portrait';
        $title       = $options['title'] ?? 'تقرير';

        $pdf = Pdf::loadView($view, array_merge($data, ['title' => $title]));
        $pdf->setPaper('a4', $orientation);

        $filename = ($options['filename'] ?? 'report') . '.pdf';
        $path     = storage_path("app/reports/{$filename}");

        // تأكد من وجود الـ directory
        if (! is_dir(storage_path('app/reports'))) {
            mkdir(storage_path('app/reports'), 0755, true);
        }

        $pdf->save($path);

        return $path;
    }

    public function getMimeType(): string
    {
        return 'application/pdf';
    }

    public function getExtension(): string
    {
        return 'pdf';
    }
}
