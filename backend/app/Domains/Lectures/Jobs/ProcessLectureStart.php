<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Jobs;

use App\Domains\Lectures\Events\LectureActivated;
use App\Domains\Lectures\Events\LectureUpdated;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Lectures\Notifications\LectureActivatedNotification;
use App\Domains\Lectures\Notifications\LectureStatusNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class ProcessLectureStart implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        protected Lecture $lecture,
    ) {}

    public function handle(): void
    {
        $this->lecture->refresh();

        // تحقق من أن المحاضرة لم تُلغى لهذا اليوم
        if ($this->lecture->is_recurring) {
            $today = now()->setTimezone('Africa/Cairo')->format('Y-m-d');
            if (in_array($today, $this->lecture->cancelled_dates ?? [])) {
                Log::info("ProcessLectureStart: Skipped cancelled date {$today} for lecture {$this->lecture->id}");
                // جدولة الحصة التالية
                $this->scheduleNextOccurrence();
                return;
            }
        }

        // تحقق من عدم التفعيل المبكر (للمحاضرات غير المتكررة)
        if (
            ! $this->lecture->is_recurring
            && $this->lecture->start_time
            && $this->lecture->start_time->isFuture()
            && $this->lecture->start_time->diffInMinutes(now()) > 1
        ) {
            Log::info("ProcessLectureStart: Skipped premature activation for {$this->lecture->id}.");
            return;
        }

        if (! $this->lecture->is_active) {
            $this->lecture->update(['is_active' => true]);
            $this->lecture->refresh();

            Log::info("ProcessLectureStart: Activated lecture {$this->lecture->id}");

            // 1. بث تحديث للمدرس عبر Reverb (Private Channel)
            event(new LectureUpdated($this->lecture, 'started'));

            // 2. بث تفعيل المحاضرة للطلاب عبر Reverb (Public Channel)
            event(new LectureActivated($this->lecture));

            // 3. إشعار المدرس والأكاديمية
            if ($this->lecture->academy) {
                $this->lecture->academy->notify(new LectureStatusNotification($this->lecture, 'active'));
            }
            $this->lecture->teacher->notify(new LectureStatusNotification($this->lecture, 'active'));

            // 4. إشعار الطلاب المسجلين وأولياء أمورهم
            try {
                $studentsQuery = $this->lecture->teacher->students()
                    ->wherePivot('grade_id', $this->lecture->grade_id)
                    ->wherePivot('is_active', true);

                if ($this->lecture->group_id) {
                    $studentsQuery->wherePivot('group_id', $this->lecture->group_id);
                }

                $students = $studentsQuery->get();

                if ($students->count() > 0) {
                    $notification = new LectureActivatedNotification(
                        $this->lecture->title,
                        $this->lecture->teacher->name,
                        $this->lecture->id,
                        $this->lecture->academy ? $this->lecture->academy->name : ($this->lecture->grade && $this->lecture->grade->academy_id ? \App\Domains\Auth\Models\Academy::find($this->lecture->grade->academy_id)?->name : null)
                    );

                    // إشعار الطلاب
                    Notification::send($students, $notification);
                    Log::info("ProcessLectureStart: Notified {$students->count()} students for lecture {$this->lecture->id}");

                    // إشعار أولياء الأمور
                    $guardians = $students->map->guardian->filter()->unique('id');
                    if ($guardians->isNotEmpty()) {
                        Notification::send($guardians, $notification);
                        Log::info("ProcessLectureStart: Notified {$guardians->count()} guardians for lecture {$this->lecture->id}");
                    }
                }
            } catch (\Exception $e) {
                Log::error("ProcessLectureStart: Failed to notify students/guardians for lecture {$this->lecture->id}", [
                    'error' => $e->getMessage(),
                ]);
            }

            // 5. جدولة إنهاء المحاضرة تلقائياً
            $endTime = $this->lecture->is_recurring
                ? now()->copy()->addMinutes($this->lecture->duration_minutes)
                : $this->lecture->end_time;

            if ($endTime) {
                $delay = max(0, now()->diffInSeconds($endTime, false));
                ProcessLectureEnd::dispatch($this->lecture)->delay($delay);
                Log::info("ProcessLectureStart: Scheduled end for {$this->lecture->id} in {$delay}s at {$endTime}");
            }
        }
    }

    /**
     * جدولة الحصة التالية للمحاضرات المتكررة.
     */
    private function scheduleNextOccurrence(): void
    {
        if (! $this->lecture->is_recurring || ! $this->lecture->recurrence_days || ! $this->lecture->recurrence_time) {
            return;
        }

        $now = now();
        $nextOccurrence = null;

        for ($i = 1; $i <= 7; $i++) {
            $date = $now->copy()->addDays($i)->setTimezone('Africa/Cairo');
            if (in_array($date->format('l'), $this->lecture->recurrence_days)) {
                $nextOccurrence = \Carbon\Carbon::parse(
                    $date->format('Y-m-d') . ' ' . $this->lecture->recurrence_time,
                    'Africa/Cairo',
                )->setTimezone('UTC');
                break;
            }
        }

        if ($nextOccurrence) {
            $delay = max(0, now()->diffInSeconds($nextOccurrence, false));
            ProcessLectureStart::dispatch($this->lecture)->delay($delay);
            Log::info("ProcessLectureStart: Scheduled next occurrence for {$this->lecture->id} in {$delay}s");
        }
    }
}
