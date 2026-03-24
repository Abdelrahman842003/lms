<?php

use App\Models\User;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Video;
use App\Models\Lecture;
use App\Models\Academy;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

describe('IDOR Protection - Student Access', function () {
    it('prevents teacher from accessing other teachers students', function () {
        $teacher1 = Teacher::factory()->create();
        $teacher2 = Teacher::factory()->create();
        
        $student = Student::factory()->create(['teacher_id' => $teacher1->id]);
        
        $teacher2->user->givePermissionTo('student.view');
        
        $response = $this->actingAs($teacher2->user)
            ->getJson("/api/v1/teacher/students/{$student->id}");
        
        $response->assertNotFound(); // 404 prevents enumeration
    });

    it('allows teacher to access own students', function () {
        $teacher = Teacher::factory()->create();
        $student = Student::factory()->create(['teacher_id' => $teacher->id]);
        
        $teacher->user->givePermissionTo('student.view');
        
        $response = $this->actingAs($teacher->user)
            ->getJson("/api/v1/teacher/students/{$student->id}");
        
        $response->assertOk()
            ->assertJsonPath('data.id', $student->id);
    });

    it('prevents academy from accessing other academies students', function () {
        $academy1 = Academy::factory()->create();
        $academy2 = Academy::factory()->create();
        
        $student = Student::factory()->create(['academy_id' => $academy1->id]);
        
        $academy2->user->givePermissionTo('student.view');
        
        $response = $this->actingAs($academy2->user)
            ->getJson("/api/v1/academy/students/{$student->id}");
        
        $response->assertNotFound();
    });
});

describe('IDOR Protection - Video Access', function () {
    it('prevents access to videos from other teachers', function () {
        $teacher1 = Teacher::factory()->create();
        $teacher2 = Teacher::factory()->create();
        
        $video = Video::factory()->create(['teacher_id' => $teacher1->id]);
        
        $teacher2->user->givePermissionTo('video.view');
        
        $response = $this->actingAs($teacher2->user)
            ->getJson("/api/v1/teacher/videos/{$video->id}");
        
        $response->assertNotFound();
    });

    it('prevents video streaming without ownership', function () {
        $teacher1 = Teacher::factory()->create();
        $teacher2 = Teacher::factory()->create();
        
        $video = Video::factory()->create([
            'teacher_id' => $teacher1->id,
            'status' => 'ready',
        ]);
        
        $response = $this->actingAs($teacher2->user)
            ->getJson("/api/v1/teacher/videos/{$video->id}/stream");
        
        $response->assertNotFound();
    });
});

describe('IDOR Protection - Lecture Access', function () {
    it('prevents access to lectures from other academies', function () {
        $academy1 = Academy::factory()->create();
        $academy2 = Academy::factory()->create();
        
        $lecture = Lecture::factory()->create(['academy_id' => $academy1->id]);
        
        $response = $this->actingAs($academy2->user)
            ->getJson("/api/v1/academy/lectures/{$lecture->id}");
        
        $response->assertNotFound();
    });
});

describe('IDOR Protection - Mass Operations', function () {
    it('prevents bulk update of other teachers resources', function () {
        $teacher1 = Teacher::factory()->create();
        $teacher2 = Teacher::factory()->create();
        
        $students = Student::factory()->count(3)->create(['teacher_id' => $teacher1->id]);
        
        $teacher2->user->givePermissionTo('student.update');
        
        $response = $this->actingAs($teacher2->user)
            ->postJson('/api/v1/teacher/students/bulk-update', [
                'ids' => $students->pluck('id')->toArray(),
                'status' => 'inactive',
            ]);
        
        $response->assertForbidden();
        
        // Verify no students were updated
        foreach ($students as $student) {
            expect($student->fresh()->is_active)->toBeTrue();
        }
    });
});
