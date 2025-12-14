<?php

namespace Tests\Feature;

use App\Models\Admin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class RolesAndPermissionsTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = Admin::factory()->create();
        $this->actingAs($this->admin, 'sanctum');
    }

    public function test_can_list_roles()
    {
        Role::create(['name' => 'admin', 'guard_name' => 'admin']);
        Role::create(['name' => 'editor', 'guard_name' => 'admin']);

        $response = $this->getJson('/api/admin/roles');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_can_create_role()
    {
        $response = $this->postJson('/api/admin/roles', [
            'name' => 'manager',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'manager');

        $this->assertDatabaseHas('roles', ['name' => 'manager']);
    }

    public function test_can_update_role()
    {
        $role = Role::create(['name' => 'editor', 'guard_name' => 'admin']);

        $response = $this->putJson("/api/admin/roles/{$role->id}", [
            'name' => 'senior-editor',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'senior-editor');

        $this->assertDatabaseHas('roles', ['name' => 'senior-editor']);
    }

    public function test_can_delete_role()
    {
        $role = Role::create(['name' => 'editor', 'guard_name' => 'admin']);

        $response = $this->deleteJson("/api/admin/roles/{$role->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('roles', ['id' => $role->id]);
    }

    public function test_can_assign_permissions_to_role()
    {
        $permission = Permission::create(['name' => 'edit-posts', 'guard_name' => 'admin']);

        $response = $this->postJson('/api/admin/roles', [
            'name' => 'editor',
            'permissions' => ['edit-posts'],
        ]);

        $response->assertStatus(201);

        $role = Role::where('name', 'editor')->first();
        $this->assertTrue($role->hasPermissionTo('edit-posts'));
    }

    public function test_can_list_permissions()
    {
        Permission::create(['name' => 'edit-posts', 'guard_name' => 'admin']);
        Permission::create(['name' => 'delete-posts', 'guard_name' => 'admin']);

        $response = $this->getJson('/api/admin/permissions');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_can_create_permission()
    {
        $response = $this->postJson('/api/admin/permissions', [
            'name' => 'publish-posts',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'publish-posts');

        $this->assertDatabaseHas('permissions', ['name' => 'publish-posts']);
    }

    public function test_can_update_permission()
    {
        $permission = Permission::create(['name' => 'edit-posts', 'guard_name' => 'admin']);

        $response = $this->putJson("/api/admin/permissions/{$permission->id}", [
            'name' => 'modify-posts',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'modify-posts');

        $this->assertDatabaseHas('permissions', ['name' => 'modify-posts']);
    }

    public function test_can_delete_permission()
    {
        $permission = Permission::create(['name' => 'edit-posts', 'guard_name' => 'admin']);

        $response = $this->deleteJson("/api/admin/permissions/{$permission->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('permissions', ['id' => $permission->id]);
    }
}
