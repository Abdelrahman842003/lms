<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Domains\Exams\Models\Question;
use App\Domains\Exams\Models\Exam;

class MigrateLegacyQuestionsToPivot extends Command
{
    protected $signature = 'app:migrate-legacy-questions';
    protected $description = 'Migrates old question->exam_id relations into the exam_question pivot table safely';

    public function handle()
    {
        $this->info('Starting migration of legacy questions...');

        // Fetch questions that have exam_id but no pivot entries yet
        $questions = Question::whereNotNull('exam_id')->get();
        $count = $questions->count();
        
        $this->info("Found {$count} legacy questions to migrate.");

        $bar = $this->output->createProgressBar($count);

        DB::transaction(function () use ($questions, $bar) {
            foreach ($questions as $question) {
                // If teacher_id is null, grab it from the exam
                if (!$question->teacher_id) {
                    $exam = Exam::find($question->exam_id);
                    if ($exam) {
                        $question->teacher_id = $exam->teacher_id;
                        $question->save();
                    }
                }

                // Attach to pivot safely without detaching
                $question->exams()->syncWithoutDetaching([
                    $question->exam_id => [
                        'order' => $question->sort_order ?? 0,
                    ]
                ]);

                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine();
        $this->info('Migration completed successfully.');
    }
}
