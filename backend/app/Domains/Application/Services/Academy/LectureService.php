<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Academy;

use App\Domains\Application\Exceptions\DomainException;
use App\Domains\Application\Services\Teacher\LectureService as TeacherLectureService;
use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Lectures\DTOs\LectureData;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Lectures\Events\LectureUpdated;
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
        $query = Lecture::with(['teacher', 'grade', 'group', 'currentSession'])
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
        if (!$teacher) {
            throw new DomainException('المدرس المختار غير موجود');
        }

        $belongsToAcademy = $teacher->academies()
            ->where('academies.id', $academy->id)
            ->where('academy_teacher.is_active', true)
            ->exists();

        if (! $belongsToAcademy) {
            throw new DomainException('المدرس لا ينتمي لهذه الأكاديمية');
        }

        // Resolve the teacher's profile for this academy
        $profile = \App\Domains\Auth\Models\TeacherProfile::where('teacher_id', $teacher->id)
            ->where('academy_id', $academy->id)
            ->first();

        $lectureData = $data->toArray();

        // Process dates
        if (isset($lectureData['date']) && $lectureData['date']) {
            $date = Carbon::parse($lectureData['date']);
            $lectureData['start_time'] = Carbon::parse($date->format('Y-m-d').' '.$lectureData['recurrence_time'], 'Africa/Cairo')
                ->setTimezone('UTC');
            $lectureData['end_time'] = $lectureData['start_time']->copy()->addMinutes($lectureData['duration_minutes']);
        }

        $lectureData['academy_id'] = $academy->id;
        if ($profile) {
            $lectureData['teacher_profile_id'] = $profile->id;
        }

        // Unset teacher_id as it's not a database column anymore
        unset($lectureData['teacher_id']);

        $lecture = Lecture::create($lectureData);
        $lecture->load(['teacher', 'grade', 'group']);

        // Broadcast lecture created event
        LectureUpdated::dispatch($lecture, 'created');

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

        // Unset teacher_id as it's not a database column anymore
        unset($lectureData['teacher_id']);

        $lecture->update($lectureData);
        $freshLecture = $lecture->fresh(['teacher', 'grade', 'group']);

        // Broadcast lecture updated event
        LectureUpdated::dispatch($freshLecture, 'updated');

        return $freshLecture;
    }

    public function deleteLecture(Lecture $lecture): void
    {
        // Store teacher_profile_id and academy_id before deletion for broadcasting
        $teacherProfileId = $lecture->teacher_profile_id;
        $academyId = $lecture->academy_id;
        $lectureId = $lecture->id;

        $lecture->delete();

        // Broadcast lecture deleted event
        $tempLecture = new Lecture;
        $tempLecture->id = $lectureId;
        $tempLecture->teacher_profile_id = $teacherProfileId;
        $tempLecture->academy_id = $academyId;
        $tempLecture->is_active = false;
        $tempLecture->exists = false;
        
        LectureUpdated::dispatch($tempLecture, 'deleted');
    }

    // Delegate specific actions to TeacherLectureService to avoid duplication
    public function toggleActive(Lecture $lecture, ?bool $newState = null): Lecture
    {
        return $this->teacherLectureService->toggleActive($lecture, $newState);
    }

    public function endLecture(Lecture $lecture): void
    {
        $this->teacherLectureService->endLecture($lecture);
    }

    public function generateAttendanceCode(Lecture $lecture): array
    {
        return $this->teacherLectureService->generateAttendanceCode($lecture);
    }

    public function invalidateAttendanceCode(Lecture $lecture): void
    {
        $this->teacherLectureService->invalidateAttendanceCode($lecture);
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
