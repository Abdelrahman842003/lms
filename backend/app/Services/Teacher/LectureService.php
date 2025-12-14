<?php

namespace App\Services\Teacher;

use App\Models\Lecture;

class LectureService
{
    public function getLectures($teacher, int $perPage = 10, array $filters = [])
    {
        return $teacher->lectures()
            ->withCount('attendances')
            ->orderByRaw("
                CASE
                    WHEN is_active = 1 THEN 1
                    WHEN end_time > NOW() THEN 2
                    ELSE 3
                END ASC
            ")
            ->orderBy('start_time', 'DESC')
            ->filter($filters)
            ->paginate($perPage);
    }

    public function createLecture($teacher, array $data)
    {
        return $teacher->lectures()->create($data);
    }

    public function updateLecture(Lecture $lecture, array $data)
    {
        $lecture->update($data);
        return $lecture;
    }

    public function deleteLecture(Lecture $lecture)
    {
        return $lecture->delete();
    }

    public function endLecture(Lecture $lecture)
    {
        // 1. Update lecture status
        $lecture->update([
            'is_active' => false,
            'end_time' => \Carbon\Carbon::now(),
        ]);

        // 2. Dispatch job to handle absent marking and notifications
        \App\Jobs\ProcessLectureEnd::dispatch($lecture);

        return $lecture;
    }
}
