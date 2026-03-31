<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Infrastructure\Queries\Academy;

use App\Domains\Auth\Models\Academy;
use App\Domains\Lectures\Models\Attendance;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Reporting\Domain\ValueObjects\ReportingPeriod;
use Illuminate\Support\Facades\DB;

final class AcademyAttendanceQueries
{
    public function getOverallAttendanceRate(Academy $academy, ReportingPeriod $period): float
    {
        $total = Attendance::whereHas('lecture', function ($q) use ($academy, $period) {
            $q->where('academy_id', $academy->id)
                ->whereBetween('start_time', [
                    $period->startAt->toDateTimeString(),
                    $period->endAt->toDateTimeString(),
                ]);
        })->count();

        if ($total === 0) {
            return 0.0;
        }

        $present = Attendance::whereHas('lecture', function ($q) use ($academy, $period) {
            $q->where('academy_id', $academy->id)
                ->whereBetween('start_time', [
                    $period->startAt->toDateTimeString(),
                    $period->endAt->toDateTimeString(),
                ]);
        })->where('status', 'present')->count();

        return round(($present / $total) * 100, 2);
    }

    public function getAttendanceByTeacher(Academy $academy, ReportingPeriod $period): array
    {
        $rows = Attendance::whereHas('lecture', function ($q) use ($academy, $period) {
            $q->where('academy_id', $academy->id)
                ->whereBetween('start_time', [
                    $period->startAt->toDateTimeString(),
                    $period->endAt->toDateTimeString(),
                ]);
        })
            ->join('lectures', 'attendances.lecture_id', '=', 'lectures.id')
            ->join('teachers', 'lectures.teacher_id', '=', 'teachers.id')
            ->select(
                'teachers.name as teacher',
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN attendances.status = \'present\' THEN 1 ELSE 0 END) as present'),
            )
            ->groupBy('teachers.id', 'teachers.name')
            ->get();

        return $rows->map(fn ($row) => [
            'teacher' => $row->teacher,
            'rate' => $row->total > 0 ? round(($row->present / $row->total) * 100, 2) : 0.0,
        ])->all();
    }

    public function getAttendanceByGroup(Academy $academy, ReportingPeriod $period): array
    {
        $rows = Attendance::whereHas('lecture', function ($q) use ($academy, $period) {
            $q->where('academy_id', $academy->id)
                ->whereNotNull('group_id')
                ->whereBetween('start_time', [
                    $period->startAt->toDateTimeString(),
                    $period->endAt->toDateTimeString(),
                ]);
        })
            ->join('lectures', 'attendances.lecture_id', '=', 'lectures.id')
            ->join('groups', 'lectures.group_id', '=', 'groups.id')
            ->leftJoin('teachers', 'lectures.teacher_id', '=', 'teachers.id')
            ->select(
                'groups.name as group_name',
                'teachers.name as teacher_name',
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN attendances.status = \'present\' THEN 1 ELSE 0 END) as present'),
            )
            ->groupBy('groups.id', 'groups.name', 'teachers.name')
            ->get();

        return $rows->map(fn ($row) => [
            'group' => $row->group_name,
            'teacher' => $row->teacher_name ?? '',
            'rate' => $row->total > 0 ? round(($row->present / $row->total) * 100, 2) : 0.0,
        ])->all();
    }

    public function getAttendanceTrend(Academy $academy, ReportingPeriod $period): array
    {
        $rows = Attendance::whereHas('lecture', function ($q) use ($academy, $period) {
            $q->where('academy_id', $academy->id)
                ->whereBetween('start_time', [
                    $period->startAt->toDateTimeString(),
                    $period->endAt->toDateTimeString(),
                ]);
        })
            ->join('lectures', 'attendances.lecture_id', '=', 'lectures.id')
            ->select(
                DB::raw('DATE(lectures.start_time) as date'),
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN attendances.status = \'present\' THEN 1 ELSE 0 END) as present'),
            )
            ->groupBy(DB::raw('DATE(lectures.start_time)'))
            ->orderBy('date')
            ->get();

        return $rows->map(fn ($row) => [
            'date' => $row->date,
            'rate' => $row->total > 0 ? round(($row->present / $row->total) * 100, 2) : 0.0,
        ])->all();
    }

    public function getBestGroups(Academy $academy, ReportingPeriod $period, int $limit = 5): array
    {
        $byGroup = $this->getAttendanceByGroup($academy, $period);

        usort($byGroup, fn ($a, $b) => $b['rate'] <=> $a['rate']);

        return array_slice($byGroup, 0, $limit);
    }

    public function getWeakestGroups(Academy $academy, ReportingPeriod $period, int $limit = 5): array
    {
        $byGroup = $this->getAttendanceByGroup($academy, $period);

        usort($byGroup, fn ($a, $b) => $a['rate'] <=> $b['rate']);

        return array_slice($byGroup, 0, $limit);
    }
}
