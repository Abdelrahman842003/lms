<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Guardian;

use App\Domains\Auth\Models\Student;
use App\Domains\Lectures\Models\Attendance;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Exams\Models\Exam;
use App\Domains\Exams\Models\ExamResult;
use Carbon\Carbon;

class GuardianSummaryService
{
    public function getChildSummary(Student $student, array $options = []): array
    {
        $teacherId = $options['teacher_id'] ?? null;
        $dateFrom = isset($options['date_from']) ? Carbon::parse($options['date_from']) : Carbon::now()->subMonth();
        $dateTo = isset($options['date_to']) ? Carbon::parse($options['date_to']) : Carbon::now();

        if (!$teacherId) {
            // If no teacher specified, get summary for all teachers
            // For now, let's just return empty or require teacher_id
            // The controller validation should handle this, but let's be safe
            return [];
        }

        return [
            'attendance' => $this->getAttendanceData($teacherId, $student->id, $dateFrom, $dateTo),
            'exams' => $this->getExamsData($teacherId, $student->id, $dateFrom, $dateTo),
            'ranking' => $this->getRankingData($teacherId, $student->id),
        ];
    }

    public function getAttendanceData(string $teacherId, string $studentId, Carbon $start, Carbon $end): array
    {
        // Get all lectures in range
        $lectures = Lecture::where('teacher_id', $teacherId)
            ->whereBetween('created_at', [$start, $end])
            ->where('is_active', false) // Only ended lectures count for stats usually
            ->get();

        $totalLectures = $lectures->count();
        
        if ($totalLectures === 0) {
            return [
                'total' => 0,
                'present' => 0,
                'absent' => 0,
                'percentage' => 0,
                'details' => [],
            ];
        }

        // Get attendance records
        $attendances = Attendance::whereIn('lecture_id', $lectures->pluck('id'))
            ->where('student_id', $studentId)
            ->get()
            ->keyBy('lecture_id');

        $presentCount = $attendances->where('status', 'present')->count();
        $absentCount = $totalLectures - $presentCount; // Simplified: if no record, assumed absent for ended lectures

        // Prepare details
        $details = $lectures->map(function ($lecture) use ($attendances) {
            $record = $attendances->get($lecture->id);
            return [
                'lecture_title' => $lecture->title,
                'date' => $lecture->created_at->format('Y-m-d'),
                'status' => $record ? $record->status : 'absent',
            ];
        });

        return [
            'total' => $totalLectures,
            'present' => $presentCount,
            'absent' => $absentCount,
            'percentage' => round(($presentCount / $totalLectures) * 100),
            'details' => $details,
        ];
    }

    public function getExamsData(string $teacherId, string $studentId, Carbon $start, Carbon $end): array
    {
        // Get exams in range
        $exams = Exam::where('teacher_id', $teacherId)
            ->whereBetween('date', [$start->format('Y-m-d'), $end->format('Y-m-d')])
            ->get();

        $totalExams = $exams->count();

        if ($totalExams === 0) {
            return [
                'total' => 0,
                'attended' => 0,
                'average_score' => 0,
                'details' => [],
            ];
        }

        // Get results
        $results = ExamResult::whereIn('exam_id', $exams->pluck('id'))
            ->where('student_id', $studentId)
            ->get()
            ->keyBy('exam_id');

        $attendedCount = $results->where('status', 'present')->count(); // Assuming 'present' status exists or check score
        
        // Calculate average percentage
        $totalPercentage = $results->sum('percentage');
        $averagePercentage = $attendedCount > 0 ? round($totalPercentage / $attendedCount) : 0;

        // Prepare details
        $details = $exams->map(function ($exam) use ($results) {
            $result = $results->get($exam->id);
            return [
                'exam_title' => $exam->title,
                'date' => $exam->date,
                'score' => $result ? $result->score : 0,
                'max_score' => $exam->max_score,
                'percentage' => $result ? $result->percentage : 0,
                'status' => $result ? 'attended' : 'absent', // Or check result status
            ];
        });

        return [
            'total' => $totalExams,
            'attended' => $attendedCount,
            'average_score' => $averagePercentage,
            'details' => $details,
        ];
    }

    public function getRankingData(string $teacherId, string $studentId): array
    {
        // Calculate total points or average score for ranking
        // For simplicity, let's use average exam percentage for now
        
        // Get all students for this teacher
        $students = Student::whereHas('enrollments', function ($q) use ($teacherId) {
            $q->where('teacher_id', $teacherId)->where('is_active', true);
        })->get();

        $rankings = $students->map(function ($student) use ($teacherId) {
            $avg = ExamResult::where('student_id', $student->id)
                ->whereHas('exam', function ($q) use ($teacherId) {
                    $q->where('teacher_id', $teacherId);
                })
                ->avg('percentage');
            
            return [
                'student_id' => $student->id,
                'average' => $avg ?? 0,
            ];
        })->sortByDesc('average')->values();

        $myRank = $rankings->search(function ($item) use ($studentId) {
            return $item['student_id'] == $studentId;
        });

        return [
            'rank' => $myRank !== false ? $myRank + 1 : '-',
            'total_students' => $students->count(),
        ];
    }
}
