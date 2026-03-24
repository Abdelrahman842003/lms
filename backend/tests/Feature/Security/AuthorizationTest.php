<?php

use App\Models\User;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Video;
use App\Models\Lecture;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

describe('Form Request Authorization', function () {
    it('denies student creation without permission', function () {
        $teacher = Teacher::factory()->create();
        $user = User::factory()->create();
        $user->assignRole('teacher');
        
        // Try to create student without proper permission
        $response = $this->actingAs($user)
            ->postJson('/api/v1/teacher/students', [
                'name' => 'Test Student',
                'email' => 'test@example.com',
            ]);
        
        $response->assertForbidden();
    });

    it('allows student creation with permission', function () {
        $teacher = Teacher::factory()->create();
        $user = User::factory()->create();
        $user->assignRole('teacher');
        $user->givePermissionTo('student.create');
        
        $response = $this->actingAs($user)
            ->postJson('/api/v1/teacher/students', [
                'name' => 'Test Student',
                'email' => 'test@example.com',
                'password' => 'password123',
            ]);
        
        $response->assertCreated();
    });

    it('denies video update by non-owner', function () {
        $owner = Teacher::factory()->create();
        $other = Teacher::factory()->create();
        
        $video = Video::factory()->create(['teacher_id' => $owner->id]);
        
        $response = $this->actingAs($other->user)
            ->putJson("/api/v1/teacher/videos/{$video->id}", [
                'title' => 'Hacked Title',
            ]);
        
        $response->assertForbidden();
    });
});

describe('Policy Authorization', function () {
    it('allows admin to view any student', function () {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        
        $student = Student::factory()->create();
        
        expect($admin->can('view', $student))->toBeTrue();
    });

    it('denies teacher from viewing other teachers students', function () {
        $teacher1 = Teacher::factory()->create();
        $teacher2 = Teacher::factory()->create();
        
        $student = Student::factory()->create(['teacher_id' => $teacher1->id]);
        
        $teacher1->user->givePermissionTo('student.view');
        
        expect($teacher2->user->can('view', $student))->toBeFalse();
    });
});
