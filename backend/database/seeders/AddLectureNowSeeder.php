<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Lectures\Models\Lecture;
use Carbon\Carbon;

class AddLectureNowSeeder extends Seeder
{
    public function run()
    {
        $teachers = Teacher::all();
        $startTime = Carbon::today()->setTime(16, 0); // 4:00 PM today
        $endTime = (clone $startTime)->addHours(2);

        foreach ($teachers as $teacher) {
            Lecture::create([
                'teacher_id' => $teacher->id,
                'title' => 'محاضرة اليوم (4 مساءً)',
                'description' => 'محاضرة إضافية تمت إضافتها بناءً على الطلب.',
                'start_time' => $startTime,
                'end_time' => $endTime,
                'price' => 100,
            ]);
        }

        $this->command->info('Added a lecture at 4:00 PM for all teachers.');
    }
}
