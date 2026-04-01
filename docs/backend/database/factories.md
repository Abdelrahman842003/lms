---
title: Database Factories
description: Model factories for generating test data in the Neetaq platform
---

# Database Factories

Factories generate fake data for testing and development. Each factory defines default attribute values for its corresponding Eloquent model.

## Available Factories

### User Factories

| Factory | Model | Key Attributes |
|---------|-------|---------------|
| `AdminFactory` | Admin | name, username, password |
| `TeacherFactory` | Teacher | name, phone, password, status |
| `StudentFactory` | Student | name, phone, password, gender, education_type |
| `GuardianFactory` | Guardian | name, phone, password |
| `SecretaryFactory` | Secretary | name, phone, password |
| `AcademyFactory` | Academy | name, phone, email, status |

### Domain Factories

| Factory | Model | Key Attributes |
|---------|-------|---------------|
| `GradeFactory` | Grade | name, description |
| `GroupFactory` | Group | name, max_students, is_active |
| `EnrollmentFactory` | Enrollment | balance, is_active, subscription dates |
| `ExamFactory` | Exam | title, duration_minutes, total_marks, status |
| `QuestionFactory` | Question | type, content, options, marks |
| `ExamAttemptFactory` | ExamAttempt | status, started_at, completed_at |
| `LectureFactory` | Lecture | title, status, scheduled_at |
| `SubscriptionFactory` | Subscription | plan_name, status, amount, max_seats |

## Using Factories

### Basic Creation

```php
// Create single record
$teacher = Teacher::factory()->create();

// Create multiple records
$students = Student::factory()->count(10)->create();

// Create with overrides
$teacher = Teacher::factory()->create([
    'phone' => '201234567890',
    'status' => TeacherStatus::ACTIVE,
]);
```

### Factory States

```php
// Suspended teacher
$teacher = Teacher::factory()->suspended()->create();

// Active student
$student = Student::factory()->active()->create();

// Student with guardian
$student = Student::factory()->withGuardian()->create();
```

### Relationships

```php
// Create with relationships
$enrollment = Enrollment::factory()
    ->for($teacher)
    ->for($student)
    ->for($grade)
    ->create();

// Create related models
$exam = Exam::factory()
    ->has(Question::factory()->count(10), 'questions')
    ->create();
```

## Creating Custom Factories

```bash
php artisan make:factory ExampleFactory
```

```php
class ExampleFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'status' => 'active',
        ];
    }
}
```

## References

- [Database Overview](/backend/database/) - Schema and relationships
- [Database Seeders](/backend/database/seeders) - Data population
- [Database Migrations](/backend/database/migrations) - Schema creation
