<?php

namespace App\Services\Teacher;

use App\Models\Lecture;
use App\Events\LectureUpdated;

class LectureService
{
    public function getLectures($teacher, int $perPage = 10, array $filters = [])
    {
        return $teacher->lectures()
            ->with(['grade', 'group'])
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
        $lecture = $teacher->lectures()->create($data);
        
        // Broadcast lecture created event
        LectureUpdated::dispatch($lecture);
        
        return $lecture;
    }

    public function updateLecture(Lecture $lecture, array $data)
    {
        $lecture->update($data);
        
        // Broadcast lecture updated event
        LectureUpdated::dispatch($lecture->fresh());
        
        return $lecture;
    }

    public function deleteLecture(Lecture $lecture)
    {
        // Store teacher_id before deletion for broadcasting
        $teacherId = $lecture->teacher_id;
        $lectureId = $lecture->id;
        
        $result = $lecture->delete();
        
        // Broadcast lecture deleted event
        // Note: We can't use the deleted model, so we'll just trigger a refresh
        // The frontend will handle the missing lecture appropriately
        if ($result) {
            // Create a temporary lecture object for broadcasting
            $tempLecture = new Lecture();
            $tempLecture->id = $lectureId;
            $tempLecture->teacher_id = $teacherId;
            $tempLecture->is_active = false;
            $tempLecture->exists = false;
            LectureUpdated::dispatch($tempLecture);
        }
        
        return $result;
    }

    public function endLecture(Lecture $lecture)
    {
        // 1. Update lecture status
        $updateData = ['is_active' => false];
        
        if (!$lecture->is_recurring) {
            $updateData['end_time'] = \Carbon\Carbon::now();
        }

        $lecture->update($updateData);

        // 2. Dispatch job to handle absent marking and notifications
        \App\Jobs\ProcessLectureEnd::dispatch($lecture);

        return $lecture;
    }
}
