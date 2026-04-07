<?php

namespace Tests\Unit\Domains\Gamification\Services;

use App\Domains\Auth\Models\Student;
use App\Domains\Gamification\Models\GamificationLevel;
use App\Domains\Gamification\Models\StudentLevelHistory;
use App\Domains\Gamification\Models\StudentPoint;
use App\Domains\Gamification\Services\LevelService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LevelServiceTest extends TestCase
{
    use RefreshDatabase;

    protected LevelService $levelService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->levelService = new LevelService();
        
        // Seed levels
        $this->seed(\Database\Seeders\GamificationLevelSeeder::class);
    }

    public function test_it_can_find_correct_level_for_points()
    {
        $level1 = GamificationLevel::where('sort_order', 1)->first();
        $level2 = GamificationLevel::where('sort_order', 2)->first();

        $this->assertEquals($level1->id, GamificationLevel::findForPoints(0)?->id);
        $this->assertEquals($level1->id, GamificationLevel::findForPoints(50)?->id);
        $this->assertEquals($level2->id, GamificationLevel::findForPoints(100)?->id);
        $this->assertEquals($level2->id, GamificationLevel::findForPoints(150)?->id);
    }

    public function test_it_checks_and_updates_student_level()
    {
        $student = Student::factory()->create();
        $teacher = \App\Domains\Auth\Models\Teacher::factory()->create();
        $level1 = GamificationLevel::where('sort_order', 1)->first();
        $level2 = GamificationLevel::where('sort_order', 2)->first();

        // Initial check — should set to level 1
        $this->levelService->checkAndLevelUp($student);
        $this->assertEquals($level1->id, $student->fresh()->current_level_id);
        $this->assertDatabaseHas('student_level_history', [
            'student_id' => $student->id,
            'level_id' => $level1->id,
        ]);

        // Add points and check again
        StudentPoint::create([
            'student_id' => $student->id,
            'teacher_id' => $teacher->id,
            'total_points' => 120,
        ]);

        $this->levelService->checkAndLevelUp($student);
        
        $student->refresh();
        $this->assertEquals($level2->id, $student->current_level_id);
        $this->assertDatabaseHas('student_level_history', [
            'student_id' => $student->id,
            'level_id' => $level2->id,
        ]);
        
        // Check history count
        $this->assertEquals(2, $student->levelHistory()->count());
    }

    public function test_it_returns_correct_achievement_summary()
    {
        $student = Student::factory()->create();
        $teacher = \App\Domains\Auth\Models\Teacher::factory()->create();
        $level1 = GamificationLevel::where('sort_order', 1)->first();
        $level2 = GamificationLevel::where('sort_order', 2)->first();

        StudentPoint::create([
            'student_id' => $student->id,
            'teacher_id' => $teacher->id,
            'total_points' => 40,
        ]);

        $student->update(['current_level_id' => $level1->id]);

        $summary = $this->levelService->getStudentAchievements($student);

        $this->assertEquals(40, $summary['total_points']);
        $this->assertEquals($level1->id, $summary['current_level']['id']);
        $this->assertEquals($level2->name, $summary['next_level']['name']);
        $this->assertEquals(40, $summary['progress_percentage']); // (40 / 100) * 100
        $this->assertEquals(60, $summary['points_to_next_level']); // 100 - 40
    }
}
