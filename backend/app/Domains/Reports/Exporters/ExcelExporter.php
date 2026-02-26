<?php

declare(strict_types=1);

namespace App\Domains\Reports\Exporters;

use App\Domains\Reports\Contracts\ReportExporter;

/**
 * يُصدّر التقارير بصيغة Excel (CSV بسيط متوافق مع Excel).
 *
 * ملاحظة: يمكن الترقية لاستخدام phpspreadsheet/maatwebsite-excel لاحقاً.
 *
 * options:
 *  - headers  : array<string>   عناوين الأعمدة
 *  - rows     : array<array>    البيانات
 *  - filename : string
 */
final class ExcelExporter implements ReportExporter
{
    public function export(array $data, array $options = []): string
    {
        $headers  = $options['headers'] ?? array_keys($data[0] ?? []);
        $rows     = $data['rows'] ?? $data;
        $filename = ($options['filename'] ?? 'report') . '.csv';
        $path     = storage_path("app/reports/{$filename}");

        if (! is_dir(storage_path('app/reports'))) {
            mkdir(storage_path('app/reports'), 0755, true);
        }

        $handle = fopen($path, 'w');

        // BOM لدعم UTF-8 في Excel
        fwrite($handle, "\xEF\xBB\xBF");

        // رأس الجدول
        fputcsv($handle, $headers);

        // البيانات
        foreach ($rows as $row) {
            fputcsv($handle, is_array($row) ? array_values($row) : [$row]);
        }

        fclose($handle);

        return $path;
    }

    public function getMimeType(): string
    {
        return 'text/csv; charset=UTF-8';
    }

    public function getExtension(): string
    {
        return 'csv';
    }
}
