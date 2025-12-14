<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Lecture;

class RemoveLectureNowSeeder extends Seeder
{
    public function run()
    {
        Lecture::where('title', 'محاضرة اليوم (4 مساءً)')->delete();
        $this->command->info('Removed the 4:00 PM lecture.');
    }
}
