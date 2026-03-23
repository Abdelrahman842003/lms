<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Teacher;

use App\Domains\Lectures\Models\Lecture;
use Mpdf\Config\ConfigVariables;
use Mpdf\Config\FontVariables;
use Mpdf\Mpdf;
use Illuminate\Support\Facades\View;

class LectureExportService
{
    /**
     * Export attendance report as PDF.
     *
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function exportAttendeesPdf(Lecture $lecture): \Symfony\Component\HttpFoundation\Response
    {
        $data = $this->prepareAttendeesData($lecture);
        $mpdf = $this->createMpdfInstance();
        
        $html = View::make('exports.attendees', $data)->render();
        $mpdf->WriteHTML($html);
        
        return $mpdf->Output("attendance_report_{$lecture->id}.pdf", 'D');
    }

    /**
     * Prepare attendees data for export.
     *
     * @return array<string, mixed>
     */
    public function prepareAttendeesData(Lecture $lecture): array
    {
        $query = $lecture->teacher->students()
            ->wherePivot('grade_id', $lecture->grade_id)
            ->wherePivot('is_active', true);
            
        if ($lecture->group_id) {
            $query->wherePivot('group_id', $lecture->group_id);
        }

        $allStudents = $query->get();

        $attendanceRecords = $lecture->attendances()
            ->get()
            ->keyBy('student_id');

        $attendees = $allStudents->map(function ($student) use ($attendanceRecords) {
            $record = $attendanceRecords->get($student->id);
            return (object) [
                'student' => $student,
                'status' => $record ? $record->status : 'absent',
                'created_at' => $record ? $record->created_at : null,
            ];
        });

        return [
            'lecture' => $lecture,
            'attendees' => $attendees,
            'total_present' => $attendees->where('status', 'present')->count(),
            'total_absent' => $attendees->where('status', 'absent')->count(),
            'date' => now()->format('Y-m-d'),
        ];
    }

    /**
     * Create configured mPDF instance with Arabic font support.
     */
    private function createMpdfInstance(): Mpdf
    {
        $defaultConfig = (new ConfigVariables())->getDefaults();
        $fontDirs = $defaultConfig['fontDir'];

        $defaultFontConfig = (new FontVariables())->getDefaults();
        $fontData = $defaultFontConfig['fontdata'];

        return new Mpdf([
            'mode' => 'utf-8',
            'format' => 'A4',
            'default_font_size' => 11,
            'default_font' => 'xbriyaz',
            'margin_left' => 15,
            'margin_right' => 15,
            'margin_top' => 15,
            'margin_bottom' => 15,
            'tempDir' => storage_path('app/mpdf'),
            'fontDir' => array_merge($fontDirs, [
                base_path('vendor/mpdf/mpdf/ttfonts'),
            ]),
            'fontdata' => $fontData + [
                'xbriyaz' => [
                    'R' => 'XB Riyaz.ttf',
                    'B' => 'XB RiyazBd.ttf',
                    'I' => 'XB RiyazIt.ttf',
                    'BI' => 'XB RiyazBdIt.ttf',
                    'useOTL' => 0xFF,
                    'useKashida' => 75,
                ]
            ],
        ]);
    }
}
