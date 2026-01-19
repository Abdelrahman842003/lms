<?php

declare(strict_types=1);

namespace App\Services\Teacher;

use App\Events\LectureUpdated;
use App\Models\Attendance;
use App\Models\Lecture;
use App\Models\Student;
use App\Notifications\LectureActivatedNotification;
use App\Notifications\LectureCancelledNotification;
use App\Notifications\StudentAttendanceNotification;
use App\Traits\HasAcademyFilter;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class LectureService
{
    use HasAcademyFilter;

    public function getLectures($teacher, int $perPage = 10, array $filters = [], ?string $academyId = null): LengthAwarePaginator
    {
        $query = $teacher->lectures()
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
            ->filter($filters);

        // Apply academy filter via grade relationship
        $query = $this->applyAcademyFilter($query, $academyId, 'grade');

        return $query->paginate($perPage);
    }

    public function createLecture($teacher, array $data): Lecture
    {
        $lecture = $teacher->lectures()->create($data);
        
        // Broadcast lecture created event
        LectureUpdated::dispatch($lecture);
        
        return $lecture;
    }

    public function updateLecture(Lecture $lecture, array $data): Lecture
    {
        $lecture->update($data);
        
        // Broadcast lecture updated event
        LectureUpdated::dispatch($lecture->fresh());
        
        return $lecture;
    }

    public function deleteLecture(Lecture $lecture): ?bool
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

    public function endLecture(Lecture $lecture): Lecture
    {
        // 1. Update lecture status
        $updateData = ['is_active' => false];
        
        if (!$lecture->is_recurring) {
            $updateData['end_time'] = Carbon::now();
        }

        $lecture->update($updateData);

        // 2. Dispatch job to handle absent marking and notifications
        \App\Jobs\ProcessLectureEnd::dispatch($lecture);

        return $lecture;
    }

    public function toggleActive(Lecture $lecture): Lecture
    {
        $lecture->update([
            'is_active' => !$lecture->is_active
        ]);

        if ($lecture->is_active) {
            try {
                // Get active students enrolled in this grade
                $students = $lecture->teacher->students()
                    ->wherePivot('grade_id', $lecture->grade_id)
                    ->wherePivot('is_active', true)
                    ->get();

                if ($students->count() > 0) {
                    Notification::send(
                        $students, 
                        new LectureActivatedNotification(
                            $lecture->title, 
                            $lecture->teacher->name, 
                            $lecture->id
                        )
                    );
                }
            } catch (\Exception $e) {
                Log::error('Failed to send lecture activation notification: ' . $e->getMessage());
            }
        }

        LectureUpdated::dispatch($lecture);

        return $lecture;
    }

    public function getAttendees(Lecture $lecture, array $filters = []): array
    {
        // Get all active students for this teacher in this grade/group
        $query = $lecture->teacher->students()
            ->wherePivot('grade_id', $lecture->grade_id)
            ->wherePivot('is_active', true);
            
        if ($lecture->group_id) {
            $query->wherePivot('group_id', $lecture->group_id);
        }

        $allStudents = $query->get();

        // Get existing attendance records
        $attendanceQuery = $lecture->attendances();

        if (isset($filters['date_from'])) {
            $attendanceQuery->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $attendanceQuery->whereDate('created_at', '<=', $filters['date_to']);
        }

        $attendanceRecords = $attendanceQuery->get()->keyBy('student_id');

        $attendees = $allStudents->map(function ($student) use ($attendanceRecords) {
            $record = $attendanceRecords->get($student->id);
            
            return [
                'id' => $record ? $record->id : null,
                'student_id' => $student->id,
                'student_name' => $student->name,
                'student_phone' => $student->phone,
                'status' => $record ? $record->status : 'absent', // Default to absent if no record
                'attended_at' => $record ? $record->created_at->format('Y-m-d H:i:s') : null,
            ];
        });

        return [
            'attendees' => $attendees->values(),
            'total_present' => $attendees->where('status', 'present')->count(),
            'total_absent' => $attendees->where('status', 'absent')->count(),
        ];
    }

    public function getAvailableDates(Lecture $lecture): array
    {
        $availableDates = [];
        
        if ($lecture->is_recurring && is_array($lecture->recurrence_days)) {
            $startDate = $lecture->created_at->copy()->startOfDay();
            $endDate = now()->endOfDay();
            
            // Map day names to Carbon integers (Sunday = 0, Monday = 1, etc.)
            $dayMap = [
                'Sunday' => 0,
                'Monday' => 1,
                'Tuesday' => 2,
                'Wednesday' => 3,
                'Thursday' => 4,
                'Friday' => 5,
                'Saturday' => 6,
            ];
            
            $recurrenceDays = array_map(function($day) use ($dayMap) {
                return $dayMap[$day] ?? null;
            }, $lecture->recurrence_days);
            
            $recurrenceDays = array_filter($recurrenceDays, function($day) {
                return $day !== null;
            });

            // Iterate from start date to today
            $current = $startDate->copy();
            while ($current <= $endDate) {
                if (in_array($current->dayOfWeek, $recurrenceDays)) {
                    $dateStr = $current->format('Y-m-d');
                    
                    // Check status
                    $status = 'not_activated';
                    
                    // Check if attendance exists for this date
                    $hasAttendance = $lecture->attendances()
                        ->whereDate('created_at', $dateStr)
                        ->exists();
                        
                    if ($hasAttendance) {
                        $status = 'active';
                    } elseif (in_array($dateStr, $lecture->cancelled_dates ?? [])) {
                        $status = 'cancelled';
                    }
                    
                    $availableDates[] = [
                        'date' => $dateStr,
                        'status' => $status
                    ];
                }
                $current->addDay();
            }
            
            // Sort descending
            usort($availableDates, function($a, $b) {
                return strcmp($b['date'], $a['date']);
            });
            
        } else {
            // For non-recurring, just get dates with attendance
            $dates = $lecture->attendances()
                ->selectRaw('DATE(created_at) as date')
                ->distinct()
                ->orderBy('date', 'desc')
                ->pluck('date');
                
            foreach ($dates as $date) {
                $availableDates[] = [
                    'date' => $date,
                    'status' => 'active'
                ];
            }
        }

        return $availableDates;
    }

    public function cancelSession(Lecture $lecture, string $date): Lecture
    {
        $cancelledDates = $lecture->cancelled_dates ?? [];

        if (!in_array($date, $cancelledDates)) {
            $cancelledDates[] = $date;
            $lecture->update(['cancelled_dates' => $cancelledDates]);

            // Notify students
            try {
                $students = $lecture->teacher->students()
                    ->wherePivot('grade_id', $lecture->grade_id)
                    ->wherePivot('is_active', true)
                    ->get();

                if ($students->count() > 0) {
                    Notification::send(
                        $students, 
                        new LectureCancelledNotification(
                            $lecture->title . ' (' . $date . ')', 
                            $lecture->teacher->name
                        )
                    );
                }
            } catch (\Exception $e) {
                Log::error('Failed to send session cancellation notification: ' . $e->getMessage());
            }
        }

        return $lecture;
    }

    public function generateQrCode(Lecture $lecture): array
    {
        // Generate a signed token valid for 10 seconds (5s refresh + 5s buffer)
        $payload = [
            'lecture_id' => $lecture->id,
            'expires_at' => Carbon::now()->addSeconds(10)->timestamp,
            'salt' => Str::random(8)
        ];
        
        $token = Crypt::encryptString(json_encode($payload));

        // Return the full URL that the student should visit
        $url = config('app.url') . '/student/attend?token=' . $token;

        return [
            'qr_code_url' => $url,
            'expires_at' => Carbon::now()->addSeconds(10),
        ];
    }

    public function recordAttendance(Lecture $lecture, string $studentId): array
    {
        // Check if student is already attended
        $existingAttendance = Attendance::where('lecture_id', $lecture->id)
            ->where('student_id', $studentId)
            ->first();

        if ($existingAttendance) {
            return [
                'message' => 'الطالب مسجل حضور بالفعل',
                'status' => 'already_attended'
            ];
        }

        Attendance::create([
            'lecture_id' => $lecture->id,
            'student_id' => $studentId,
            'status' => 'present',
        ]);

        $student = Student::find($studentId);
        if ($student) {
            $student->notify(new StudentAttendanceNotification($lecture->title, $lecture->teacher->name));
        }

        return [
            'message' => 'تم تسجيل الحضور بنجاح',
            'status' => 'attended'
        ];
    }
}
