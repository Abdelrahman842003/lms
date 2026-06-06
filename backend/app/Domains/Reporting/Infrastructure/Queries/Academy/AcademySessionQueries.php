<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Infrastructure\Queries\Academy;

use App\Domains\Auth\Models\Academy;
use App\Domains\Lectures\Models\Attendance;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Reporting\Domain\ValueObjects\AcademyReportFilters;
use App\Domains\Reporting\Domain\ValueObjects\ReportingPeriod;
use Illuminate\Support\Facades\DB;

final class AcademySessionQueries
{
    public function getScheduledCount(Academy $academy, ReportingPeriod $period, ?AcademyReportFilters $filters = null): int
    {
        $query = Lecture::where('academy_id', $academy->id)
            ->whereBetween('start_time', [
                $period->startAt->toDateTimeString(),
                $period->endAt->toDateTimeString(),
            ]);

        if ($filters) {
            $query = $this->applyFilters($query, $filters);
        }

        return $query->count();
    }

    public function getDeliveredCount(Academy $academy, ReportingPeriod $period, ?AcademyReportFilters $filters = null): int
    {
        $query = Lecture::where('academy_id', $academy->id)
            ->whereBetween('start_time', [
                $period->startAt->toDateTimeString(),
                $period->endAt->toDateTimeString(),
            ])
            ->where('is_active', true)
            ->where('start_time', '<=', now());

        if ($filters) {
            $query = $this->applyFilters($query, $filters);
        }

        return $query->count();
    }

    public function getCanceledCount(Academy $academy, ReportingPeriod $period, ?AcademyReportFilters $filters = null): int
    {
        $query = Lecture::where('academy_id', $academy->id)
            ->whereBetween('start_time', [
                $period->startAt->toDateTimeString(),
                $period->endAt->toDateTimeString(),
            ])
            ->where('is_active', false)
            ->whereNotNull('cancelled_dates');

        if ($filters) {
            $query = $this->applyFilters($query, $filters);
        }

        return $query->count();
    }

    public function getPostponedCount(Academy $academy, ReportingPeriod $period, ?AcademyReportFilters $filters = null): int
    {
        // No direct "postponed" status on lectures; return 0 until a migration adds support
        return 0;
    }

    public function getAverageAttendance(Academy $academy, ReportingPeriod $period, ?AcademyReportFilters $filters = null): float
    {
        $query = Lecture::where('academy_id', $academy->id)
            ->whereBetween('start_time', [
                $period->startAt->toDateTimeString(),
                $period->endAt->toDateTimeString(),
            ])
            ->where('is_active', true)
            ->where('start_time', '<=', now());

        if ($filters) {
            $query = $this->applyFilters($query, $filters);
        }

        $lectures = $query->withCount([
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

    public function getSessionExecutionList(Academy $academy, ReportingPeriod $period, ?AcademyReportFilters $filters = null): array
    {
        $query = Lecture::where('lectures.academy_id', $academy->id)
            ->whereBetween('lectures.start_time', [
                $period->startAt->toDateTimeString(),
                $period->endAt->toDateTimeString(),
            ])
            ->join('teacher_profiles', 'lectures.teacher_profile_id', '=', 'teacher_profiles.id')
            ->join('teachers', 'teacher_profiles.teacher_id', '=', 'teachers.id')
            ->leftJoin('groups', 'lectures.group_id', '=', 'groups.id');

        if ($filters) {
            $query = $this->applyFilters($query, $filters);
        }

        return $query->select(
                'lectures.id',
                'lectures.title',
                'teachers.name as teacher_name',
                'lectures.start_time as date',
                'lectures.is_active',
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
                'status' => $row->is_active ? 'delivered' : 'inactive',
                'attendance_count' => (int) $row->attendance_count,
                'total_students' => (int) $row->total_students,
            ])
            ->all();
    }

    private function applyFilters($query, AcademyReportFilters $filters)
    {
        return $query
            ->when($filters->teacherId, function ($q) use ($filters) {
                if (!$this->isJoined($q, 'teacher_profiles')) {
                    $q->join('teacher_profiles', 'lectures.teacher_profile_id', '=', 'teacher_profiles.id');
                }
                $q->where('teacher_profiles.teacher_id', $filters->teacherId);
            })
            ->when($filters->groupId, fn ($q) => $q->where('group_id', $filters->groupId))
            ->when($filters->gradeId, fn ($q) => $q->where('grade_id', $filters->gradeId))
            ->when($filters->sessionStatus, function ($q) use ($filters) {
                 if ($filters->sessionStatus === 'delivered') return $q->where('is_active', true)->where('start_time', '<=', now());
                 if ($filters->sessionStatus === 'cancelled') return $q->where('is_active', false);
                 return $q;
            });
    }

    private function isJoined($query, string $table): bool
    {
        $joins = $query->getQuery()->joins ?? [];
        foreach ($joins as $join) {
            if ($join->table === $table) {
                return true;
            }
        }
        return false;
    }
}
