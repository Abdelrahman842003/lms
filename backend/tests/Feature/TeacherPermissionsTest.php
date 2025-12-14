<?php

namespace Tests\Feature;

use App\Models\Teacher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class TeacherPermissionsTest extends TestCase
{
    use RefreshDatabase;

    protected $teacher;

    protected function setUp(): void
    {
        parent::setUp();
        $this->teacher = Teacher::factory()->create();
        $this->actingAs($this->teacher, 'sanctum');
    }

    public function test_teacher_can_list_roles()
    {
        Role::create(['name' => 'student-leader', 'guard_name' => 'student']);
        Role::create(['name' => 'secretary-admin', 'guard_name' => 'secretary']);

        $response = $this->getJson('/api/teacher/roles');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_teacher_can_create_role()
    {
        $response = $this->postJson('/api/teacher/roles', [
            'name' => 'class-monitor',
            'guard_name' => 'student',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'class-monitor')
            ->assertJsonPath('data.guard_name', 'student');

        $this->assertDatabaseHas('roles', ['name' => 'class-monitor', 'guard_name' => 'student']);
    }

    public function test_teacher_cannot_create_duplicate_role_for_same_guard()
    {
        Role::create(['name' => 'class-monitor', 'guard_name' => 'student']);

        $response = $this->postJson('/api/teacher/roles', [
            'name' => 'class-monitor',
            'guard_name' => 'student',
        ]);

        $response->assertStatus(422);
    }

    public function test_teacher_can_update_role()
    {
        $role = Role::create(['name' => 'class-monitor', 'guard_name' => 'student']);

        $response = $this->putJson("/api/teacher/roles/{$role->id}", [
            'name' => 'senior-monitor',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'senior-monitor');

        $this->assertDatabaseHas('roles', ['name' => 'senior-monitor']);
    }

    public function test_teacher_can_delete_role()
    {
        $role = Role::create(['name' => 'class-monitor', 'guard_name' => 'student']);

        $response = $this->deleteJson("/api/teacher/roles/{$role->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('roles', ['id' => $role->id]);
    }

    public function test_teacher_can_list_permissions()
    {
        Permission::create(['name' => 'view-content', 'guard_name' => 'student']);
        
        $response = $this->getJson('/api/teacher/permissions');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_teacher_can_create_permission()
    {
        $response = $this->postJson('/api/teacher/permissions', [
            'name' => 'edit-content',
            'guard_name' => 'secretary',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'edit-content')
            ->assertJsonPath('data.guard_name', 'secretary');

        $this->assertDatabaseHas('permissions', ['name' => 'edit-content', 'guard_name' => 'secretary']);
    }
}
