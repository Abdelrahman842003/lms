<?php

declare(strict_types=1);

namespace App\Domains\Reports\Contracts;

/**
 * Contract للـ Report Exporters.
 * كل تنسيق (PDF / Excel / CSV) يُنفّذ هذا الـ interface.
 */
interface ReportExporter
{
    /**
     * ينفّذ التصدير ويعيد مسار الملف أو المحتوى الثنائي.
     *
     * @param  array<string, mixed>  $data
     * @param  array<string, mixed>  $options  (title, filename, orientation, ...)
     */
    public function export(array $data, array $options = []): string;

    /**
     * الـ MIME type لهذا التنسيق.
     */
    public function getMimeType(): string;

    /**
     * امتداد الملف (pdf / xlsx / csv).
     */
    public function getExtension(): string;
}
