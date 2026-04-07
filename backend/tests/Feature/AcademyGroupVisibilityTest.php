<?php

namespace Tests\Feature;

use App\Domains\Application\Services\Academy\GroupService;
use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Models\Grade;
use App\Domains\Enrollments\Models\Group;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Pagination\LengthAwarePaginator;
use Tests\TestCase;

class AcademyGroupVisibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_academy_cannot_see_independent_groups_of_its_teachers(): void
    {
        $academy = Academy::create([
            'name' => 'Test Academy',
            'phone' => '01000000001',
            'password' => bcrypt('password'),
            'is_active' => true,
        ]);

        $teacher = Teacher::factory()->create([
            'status' => 'active',
            'phone' => '010' . rand(10000000, 99999999),
        ]);

        // Teacher is attached to academy, but not all teacher groups should appear in academy dashboard.
        $teacher->academies()->attach($academy->id, ['is_active' => true, 'joined_at' => now()]);

        $teacherPrivateGrade = Grade::factory()->create([
            'teacher_id' => $teacher->id,
            'academy_id' => null,
            'name' => 'Teacher Private Grade',
        ]);

        $academyGrade = Grade::factory()->create([
            'teacher_id' => null,
            'academy_id' => $academy->id,
            'name' => 'Academy Grade',
        ]);

        $independentGroup = Group::factory()->create([
            'teacher_id' => $teacher->id,
            'grade_id' => $teacherPrivateGrade->id,
            'academy_id' => null,
            'name' => 'Independent Group',
        ]);

        $academyGroup = Group::factory()->create([
            'teacher_id' => $teacher->id,
            'grade_id' => $academyGrade->id,
            'academy_id' => $academy->id,
            'name' => 'Academy Group',
        ]);

        $service = app(GroupService::class);
        $result = $service->getGroups($academy);

        $this->assertInstanceOf(LengthAwarePaginator::class, $result);
        $this->assertEquals(1, $result->total(), 'Academy should only see academy-scoped groups.');

        $groupIds = collect($result->items())->pluck('id');
        $this->assertTrue($groupIds->contains($academyGroup->id));
        $this->assertFalse($groupIds->contains($independentGroup->id));
    }
}
