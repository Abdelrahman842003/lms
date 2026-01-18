
use App\Models\Teacher;
use Illuminate\Support\Facades\DB;

// Simulate the query from TeacherService
$teachers = Teacher::withCount(['students', 'secretaries'])
    ->withCount(['enrollments as independent_enrollments_count' => function ($query) {
        $query->whereNull('academy_id');
    }])
    ->with(['academies:id,name'])
    ->where(function($q) {
        $q->whereDoesntHave('academies')
          ->orWhere('subscription_fee', '>', 0)
          ->orWhereHas('enrollments', function($sub) {
              $sub->whereNull('academy_id');
          });
    })
    ->get();

echo "Found " . $teachers->count() . " independent teachers.\n";

foreach ($teachers as $teacher) {
    $hasAcademies = $teacher->academies->isNotEmpty();
    $fee = $teacher->subscription_fee;
    $indepCount = $teacher->independent_enrollments_count;
    
    // Logic from TeacherResource
    $isIndependentResource = $fee > 0 || ($indepCount ?? 0) > 0;
    
    $affiliation = 'independent';
    if ($hasAcademies) {
        if ($isIndependentResource) {
            $affiliation = 'both';
        } else {
            $affiliation = 'academy';
        }
    }
    
    if ($affiliation === 'academy') {
        echo "MISMATCH: Teacher {$teacher->id} ({$teacher->name})\n";
        echo "  - Has Academies: " . ($hasAcademies ? 'Yes' : 'No') . "\n";
        echo "  - Subscription Fee: " . var_export($fee, true) . "\n";
        echo "  - Independent Enrollments: {$indepCount}\n";
        echo "  - Resource Affiliation: {$affiliation}\n";
        echo "  - Filter matched because: ";
        if (!$hasAcademies) echo "No Academies ";
        if ($fee > 0) echo "Fee > 0 ";
        
        $hasIndepEnrollments = $teacher->enrollments()->whereNull('academy_id')->exists();
        if ($hasIndepEnrollments) echo "Indep Enrollments Exists (Count: $indepCount) ";
        
        echo "\n--------------------------------\n";
    }
}
