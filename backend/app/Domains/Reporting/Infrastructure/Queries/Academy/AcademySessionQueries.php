<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Infrastructure\Queries\Academy;

use App\Domains\Auth\Models\Academy;
use App\Domains\Lectures\Models\Attendance;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Reporting\Domain\ValueObjects\ReportingPeriod;
use Illuminate\Support\Facades\DB;

final class AcademySessionQueries
{
    public function getScheduledCount(Academy $academy, ReportingPeriod $period): int
    {
        return Lecture::where('academy_id', $academy->id)
            ->whereBetween('start_time', [
                $period->startAt->toDateTimeString(),
                $period->endAt->toDateTimeString(),
            ])
            ->count();
    }

    public function getDeliveredCount(Academy $academy, ReportingPeriod $period): int
    {
        return Lecture::where('academy_id', $academy->id)
            ->whereBetween('start_time', [
                $period->startAt->toDateTimeString(),
                $period->endAt->toDateTimeString(),
            ])
            ->where('status', 'completed')
            ->count();
    }

    public function getCanceledCount(Academy $academy, ReportingPeriod $period): int
    {
        return Lecture::where('academy_id', $academy->id)
            ->whereBetween('start_time', [
                $period->startAt->toDateTimeString(),
                $period->endAt->toDateTimeString(),
            ])
            ->where('status', 'cancelled')
            ->count();
    }

    public function getPostponedCount(Academy $academy, ReportingPeriod $period): int
    {
        return Lecture::where('academy_id', $academy->id)
            ->whereBetween('start_time', [
                $period->startAt->toDateTimeString(),
                $period->endAt->toDateTimeString(),
            ])
            ->where('status', 'postponed')
            ->count();
    }

    public function getAverageAttendance(Academy $academy, ReportingPeriod $period): float
    {
        $lectures = Lecture::where('academy_id', $academy->id)
            ->whereBetween('start_time', [
                $period->startAt->toDateTimeString(),
                $period->endAt->toDateTimeString(),
            ])
            ->where('status', 'completed')
            ->withCount([
                'attendances as present_count' => fn ($q) => $q->where('status', 'present'),
                'attendances as total_count',
            ])
            ->get();

        if ($lectures->isEmpty()) {
            return 0.0;
        }

        $totalStudents = $lectures->sum('total_count');
        $totalPresent = $lectures->sum('present_count');

        return $totalStudents > 0 ? round(($totalPresent / $totalStudents) * 100, 2) : 0.0;
    }

    public function getSessionExecutionList(Academy $academy, ReportingPeriod $period): array
    {
        return Lecture::where('lectures.academy_id', $academy->id)
            ->whereBetween('lectures.start_time', [
                $period->startAt->toDateTimeString(),
                $period->endAt->toDateTimeString(),
            ])
            ->join('teachers', 'lectures.teacher_id', '=', 'teachers.id')
            ->leftJoin('groups', 'lectures.group_id', '=', 'groups.id')
            ->select(
                'lectures.id',
                'lectures.title',
                'teachers.name as teacher_name',
                'lectures.start_time as date',
                'lectures.status',
                DB::raw('(SELECT COUNT(*) FROM attendances WHERE attendances.lecture_id = lectures.id) as total_students'),
                DB::raw('(SELECT COUNT(*) FROM attendances WHERE attendances.lecture_id = lectures.id AND attendances.status = \'present\') as attendance_count'),
            )
            ->orderBy('lectures.start_time', 'desc')
            ->get()
            ->map(fn ($row) => [
                'id' => $row->id,
                'title' => $row->title,
                'teacher' => $row->teacher_name,
                'date' => $row->date,
                'status' => $row->status,
                'attendance_count' => (int) $row->attendance_count,
                'total_students' => (int) $row->total_students,
            ])
            ->all();
    }
}
