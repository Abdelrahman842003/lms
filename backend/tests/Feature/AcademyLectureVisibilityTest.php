<?php

namespace Tests\Feature;

use App\Domains\Enrollments\Models\Grade;
use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Lectures\Models\Lecture;
use App\Services\Academy\LectureService;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Pagination\LengthAwarePaginator;

class AcademyLectureVisibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_academy_cannot_see_independent_lectures_of_its_teachers()
    {
        // 1. Create Academy and Teacher
        $academy = Academy::create([
            'name' => 'Test Academy',
            'phone' => '01000000000',
            'password' => bcrypt('password'),
            'is_active' => true
        ]);
        
        $teacher = Teacher::factory()->create([
            'status' => 'active',
            'phone' => '010' . rand(10000000, 99999999)
        ]);

        // 2. Attach Teacher to Academy
        $teacher->academies()->attach($academy->id, ['is_active' => true, 'joined_at' => now()]);

        // Create Grade to use in lectures
        $grade = Grade::factory()->create([
            'teacher_id' => $teacher->id,
            'name' => 'Test Grade'
        ]);

        // 3. Create an Independent Lecture (academy_id = null)
        $independentLecture = Lecture::factory()->create([
            'teacher_id' => $teacher->id,
            'grade_id' => $grade->id,
            'academy_id' => null,
            'title' => 'Independent Lecture'
        ]);

        // 4. Create an Academy Lecture (academy_id = academy->id)
        $academyLecture = Lecture::factory()->create([
            'teacher_id' => $teacher->id,
            'grade_id' => $grade->id,
            'academy_id' => $academy->id,
            'title' => 'Academy Lecture'
        ]);

        // 5. Call LectureService->getLectures via container to resolve dependencies
        $service = app(LectureService::class);
        $result = $service->getLectures($academy);

        // 6. Assertions
        $this->assertInstanceOf(LengthAwarePaginator::class, $result);
        
        // Should only see the academy lecture
        $this->assertEquals(1, $result->total(), 'Academy should see exactly 1 lecture');
        $this->assertEquals($academyLecture->id, $result->items()[0]->id, 'Academy should see its own lecture');
        $this->assertNotEquals($independentLecture->id, $result->items()[0]->id, 'Academy should NOT see independent lecture');
    }
}
