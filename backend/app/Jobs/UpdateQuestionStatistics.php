<?php

namespace App\Jobs;

use App\Domains\Exams\Models\Question;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class UpdateQuestionStatistics implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public readonly string $questionId,
        public readonly bool $isCorrect,
        public readonly int $timeTakenSeconds = 0
    ) {}

    public function handle(): void
    {
        DB::transaction(function () {
            $question = Question::find($this->questionId);
            if (!$question) {
                return;
            }

            $question->total_answers_count += 1;
            
            if ($this->isCorrect) {
                $question->correct_answers_count += 1;
            }

            // Optional: calculate moving average for time
            if ($this->timeTakenSeconds > 0) {
                $n = $question->total_answers_count;
                // new_avg = old_avg + (new_val - old_avg) / n
                $question->average_time = (int) round(
                    $question->average_time + ($this->timeTakenSeconds - $question->average_time) / $n
                );
            }

            $question->save();
        });
    }
}
