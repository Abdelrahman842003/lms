
try {
    $exam = \App\Models\Exam::find('019b388b-e8b6-725d-aae4-0cff66108394');
    if (!$exam) { echo "Exam not found\n"; exit; }
    echo "Exam ID: " . $exam->id . "\n";
    echo "Ended At: " . ($exam->ended_at ? $exam->ended_at : 'NULL') . "\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
