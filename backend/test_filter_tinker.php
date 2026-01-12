$service = app(App\Services\Admin\TeacherService::class);
echo "Testing Filter: status = suspended\n";
$teachers = $service->getTeachers(10, ['status' => 'suspended']);
foreach ($teachers as $teacher) { echo "Teacher: {$teacher->name}, Status: {$teacher->status}\n"; }

echo "\nTesting Filter: status = active\n";
$teachers = $service->getTeachers(10, ['status' => 'active']);
foreach ($teachers as $teacher) { echo "Teacher: {$teacher->name}, Status: {$teacher->status}\n"; }

echo "\nTesting Filter: status = pending\n";
$teachers = $service->getTeachers(10, ['status' => 'pending']);
foreach ($teachers as $teacher) { echo "Teacher: {$teacher->name}, Status: {$teacher->status}\n"; }
