<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Academy;

use App\Domains\Application\Services\Teacher\LectureService as TeacherLectureService;
use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Lectures\DTOs\LectureData;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Application\Filters\LectureFilter;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;

class LectureService
{
    public function __construct(
        private TeacherLectureService $teacherLectureService
    ) {}

    public function getLectures(Academy $academy, array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        $query = Lecture::with(['teacher', 'grade', 'group', 'current_session'])
            ->where(function ($q) use ($academy) {
                // Lectures created by academy
                $q->where('academy_id', $academy->id);
            })
            ->orderBy('created_at', 'desc');

        // Apply filters using Filter class
        (new LectureFilter($filters))->apply($query);

        return $query->paginate($perPage);
    }

    public function createLecture(Academy $academy, LectureData $data): Lecture
    {
        // Verify teacher belongs to this academy
        $teacher = Teacher::find($data->teacherId);
        $belongsToAcademy = $teacher->academies()
            ->where('academies.id', $academy->id)
            ->where('academy_teacher.is_active', true)
            ->exists();

        if (! $belongsToAcademy) {
            throw new \Exception('المدرس لا ينتمي لهذه الأكاديمية');
        }

        $lectureData = $data->toArray();

        // Process dates
        if (isset($lectureData['date']) && $lectureData['date']) {
            $date = Carbon::parse($lectureData['date']);
            $lectureData['start_time'] = Carbon::parse($date->format('Y-m-d').' '.$lectureData['recurrence_time'], 'Africa/Cairo')
                ->setTimezone('UTC');
            $lectureData['end_time'] = $lectureData['start_time']->copy()->addMinutes($lectureData['duration_minutes']);
        }

        $lectureData['academy_id'] = $academy->id;

        $lecture = Lecture::create($lectureData);
        $lecture->load(['teacher', 'grade', 'group']);

        return $lecture;
    }

    public function updateLecture(Academy $academy, Lecture $lecture, LectureData $data): Lecture
    {
        $lectureData = $data->toArray();

        if (isset($lectureData['date']) && $lectureData['date']) {
            $date = Carbon::parse($lectureData['date']);
            if (isset($lectureData['recurrence_time']) && isset($lectureData['duration_minutes'])) {
                $lectureData['start_time'] = Carbon::parse($date->format('Y-m-d').' '.$lectureData['recurrence_time'], 'Africa/Cairo')
                    ->setTimezone('UTC');
                $lectureData['end_time'] = $lectureData['start_time']->copy()->addMinutes($lectureData['duration_minutes']);
            }
            unset($lectureData['date']);
        }

        $lecture->update($lectureData);

        return $lecture->fresh(['teacher', 'grade', 'group']);
    }

    public function deleteLecture(Lecture $lecture): void
    {
        $lecture->delete();
    }

    // Delegate specific actions to TeacherLectureService to avoid duplication
    public function toggleActive(Lecture $lecture): Lecture
    {
        return $this->teacherLectureService->toggleActive($lecture);
    }

    public function endLecture(Lecture $lecture): void
    {
        $this->teacherLectureService->endLecture($lecture);
    }

    public function generateQrCode(Lecture $lecture): array
    {
        return $this->teacherLectureService->generateQrCode($lecture);
    }

    public function getAttendees(Lecture $lecture, array $filters): array
    {
        return $this->teacherLectureService->getAttendees($lecture, $filters);
    }

    public function recordAttendance(Lecture $lecture, string $studentId): array
    {
        return $this->teacherLectureService->recordAttendance($lecture, $studentId);
    }
}
