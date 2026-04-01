---
title: Database Seeders
description: Database seeders for populating initial and test data in the Neetaq platform
---

# Database Seeders

Seeders populate the database with initial and test data. They range from production-ready seeders (admin, roles) to development-only seeders (full test datasets, demo data).

## Available Seeders

| Seeder | Purpose | Environment |
|--------|---------|-------------|
| [`DatabaseSeeder`](/backend/database/seeders/DatabaseSeeder.php) | Main seeder entry point | All |
| [`AdminSeeder`](/backend/database/seeders/AdminSeeder.php) | Creates default admin user | Production |
| [`SuperAdminSeeder`](/backend/database/seeders/SuperAdminSeeder.php) | Creates super admin with full access | Production |
| [`OnlyAdminSeeder`](/backend/database/seeders/OnlyAdminSeeder.php) | Minimal admin + roles setup | Production |
| [`RolesAndPermissionsSeeder`](/backend/database/seeders/RolesAndPermissionsSeeder.php) | Sets up RBAC roles and permissions | Production |
| [`FilamentPermissionSeeder`](/backend/database/seeders/FilamentPermissionSeeder.php) | Admin panel permissions | Production |
| [`AcademySeeder`](/backend/database/seeders/AcademySeeder.php) | Test academy data with secretaries | Development |
| [`CompleteSeeder`](/backend/database/seeders/CompleteSeeder.php) | Full test dataset (teachers, students, exams, etc.) | Development |
| [`DemoSeeder`](/backend/database/seeders/DemoSeeder.php) | Demo environment data (teacher, student, secretary) | Staging |
| [`StudentSeeder`](/backend/database/seeders/StudentSeeder.php) | Test student records | Development |
| [`SettingsSeeder`](/backend/database/seeders/SettingsSeeder.php) | Default platform settings | All |
| [`SecretaryPermissionsSeeder`](/backend/database/seeders/SecretaryPermissionsSeeder.php) | Secretary permission configuration | Development |
| [`AttachTeachersToAcademySeeder`](/backend/database/seeders/AttachTeachersToAcademySeeder.php) | Link teachers to academies | Development |

## Running Seeders

```bash
# Run the default DatabaseSeeder
php artisan db:seed

# Run a specific seeder
php artisan db:seed --class=AdminSeeder

# Run with fresh database (drops all tables, re-runs migrations, then seeds)
php artisan migrate:fresh --seed

# Production seeding (requires --force flag)
php artisan db:seed --class=RolesAndPermissionsSeeder --force

# Inside Docker container
docker compose exec octane php artisan db:seed --class=AdminSeeder
docker compose exec octane php artisan migrate:fresh --seed
```

## Seeder Details

### DatabaseSeeder

The main entry point that truncates auth tables and calls sub-seeders:

```php
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();

        Admin::truncate();
        Role::truncate();
        Permission::truncate();
        DB::table('model_has_roles')->truncate();
        DB::table('model_has_permissions')->truncate();
        DB::table('role_has_permissions')->truncate();

        Schema::enableForeignKeyConstraints();

        $this->call([
            FilamentPermissionSeeder::class,
            // AcademySeeder::class,       // Uncomment for development
            // CompleteSeeder::class,      // Uncomment for full dataset
        ]);
    }
}
```

### AdminSeeder

Creates the default admin user using `firstOrCreate` to avoid duplicates:

```php
Admin::firstOrCreate(
    ['username' => 'admin'],
    [
        'name' => 'Super Admin',
        'password' => Hash::make('password'),
    ]
);
```

**Default credentials:** `admin` / `password`

### OnlyAdminSeeder

Combines role creation with admin user setup. A good minimal production seeder that runs `RolesAndPermissionsSeeder` first, then creates the admin and assigns the Super Admin role:

```php
public function run(): void
{
    // 1. Create Roles and Permissions
    $this->call(RolesAndPermissionsSeeder::class);

    // 2. Create Admin User
    $admin = Admin::firstOrCreate(
        ['username' => 'admin'],
        ['name' => 'Super Admin', 'password' => Hash::make('password')]
    );

    // 3. Assign Super Admin Role
    $admin->assignRole('Super Admin');
}
```

### RolesAndPermissionsSeeder

Sets up the Spatie permission system with roles and permissions on the `admin` guard:

```php
// Creates permissions
$permissions = [
    'view users', 'create users', 'edit users', 'delete users',
    'view roles', 'create roles', 'edit roles', 'delete roles',
    'view permissions', 'create permissions', 'edit permissions', 'delete permissions',
];

// Creates roles and assigns permissions
Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'admin']);
Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'admin']);
```

### CompleteSeeder

Generates a full test scenario with all entity types:

- 3 Teachers
- 10 Students (with guardians)
- Secretaries for each teacher
- Grades and Groups per teacher
- Full enrollment of all students with all teachers
- Lectures with attendance records
- Exams with questions, attempts, and results
- Gamification settings and points
- Payment logs
- Failed question tracking
- Student activity logs

**Credentials:** All users use password `password`

### AcademySeeder

Creates 3 academies with associated secretaries:

| Academy | Phone | Password | Status |
|---------|-------|----------|--------|
| Najah Academy | 01012345678 | 123456 | Active |
| Test Academy | 01099999999 | 123456 | Active |
| Future Academy | 01088888888 | 123456 | Inactive |

### DemoSeeder

Creates a minimal demo set with one of each user type:

| Role | Phone | Password |
|------|-------|----------|
| Teacher | 01000000000 | password |
| Student | 01100000000 | password |
| Secretary | 01200000000 | password |

## Creating Custom Seeders

```bash
# Generate a new seeder class
php artisan make:seeder ExampleSeeder
```

### Production Seeder Pattern

Use `firstOrCreate` to ensure idempotency in production:

```php
class ExampleSeeder extends Seeder
{
    public function run(): void
    {
        Model::firstOrCreate(
            ['unique_field' => 'value'],  // Search criteria
            ['name' => 'Example', 'status' => 'active']  // Attributes to create
        );
    }
}
```

### Development Seeder Pattern

Truncate tables before seeding to ensure a clean state:

```php
class ExampleSeeder extends Seeder
{
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();

        Model::truncate();

        Schema::enableForeignKeyConstraints();

        // Create test records
        Model::factory()->count(10)->create();
    }
}
```

## Seeder Ordering and Dependencies

When calling multiple seeders, order matters. Follow this dependency chain:

1. `RolesAndPermissionsSeeder` -- roles and permissions must exist first
2. `AdminSeeder` / `SuperAdminSeeder` -- admin needs roles to be assigned
3. `FilamentPermissionSeeder` -- admin panel permissions need roles
4. `AcademySeeder` -- academies before teachers/students
5. `CompleteSeeder` -- full dataset depends on basic structure

```php
$this->call([
    RolesAndPermissionsSeeder::class,
    AdminSeeder::class,
    FilamentPermissionSeeder::class,
    AcademySeeder::class,
    CompleteSeeder::class,
]);
```

## Factory Usage in Seeders

Seeders can leverage factories for generating bulk test data:

```php
// Create multiple records using factories
$students = Student::factory()->count(10)->create();

// Create with relationships
$group = Group::factory()
    ->for(Teacher::factory())
    ->for(Grade::factory())
    ->create();

// Create with overrides
$teacher = Teacher::factory()->create([
    'phone' => '201234567890',
    'status' => 'active',
]);
```

## Best Practices

1. **Use `firstOrCreate` in production seeders** -- prevents duplicate records on re-runs
2. **Truncate with foreign key checks disabled** -- ensures clean state in development
3. **Call dependent seeders in order** -- respect the dependency chain
4. **Use factories for bulk data** -- leverage factory definitions for consistency
5. **Always use `--force` in production** -- Laravel requires explicit confirmation for production seeding
6. **Comment out development seeders** -- keep the default `DatabaseSeeder` clean for production

## References

- [Database Overview](/backend/database/) - Entity relationships and schema overview
- [Database Migrations](/backend/database/migrations) - Schema creation and modification
- [Database Factories](/backend/database/factories) - Test data generation
- [Quick Start Guide](/getting-started/quickstart) - Initial database setup
