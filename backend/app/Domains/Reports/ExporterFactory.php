<?php

declare(strict_types=1);

namespace App\Domains\Reports;

use App\Domains\Reports\Contracts\ReportExporter;
use App\Domains\Reports\Exporters\ExcelExporter;
use App\Domains\Reports\Exporters\PdfExporter;
use App\Domains\Support\Exceptions\DomainException;

/**
 * Factory Pattern لإنشاء الـ Exporter المناسب.
 *
 * Usage:
 *   $exporter = ExporterFactory::make('pdf');
 *   $path = $exporter->export($data, ['title' => 'تقرير الطلاب']);
 */
final class ExporterFactory
{
    /**
     * @throws DomainException
     */
    public static function make(string $format): ReportExporter
    {
        return match (strtolower($format)) {
            'pdf'          => new PdfExporter(),
            'excel', 'csv' => new ExcelExporter(),
            default        => throw new DomainException("صيغة التصدير '{$format}' غير مدعومة.", 422),
        };
    }

    /**
     * @return array<string>
     */
    public static function supportedFormats(): array
    {
        return ['pdf', 'excel', 'csv'];
    }
}
