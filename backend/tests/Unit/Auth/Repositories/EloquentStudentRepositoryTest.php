<?php

declare(strict_types=1);

namespace Tests\Unit\Auth\Repositories;

use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Repositories\EloquentStudentRepository;
use App\Domains\Auth\Repositories\StudentRepositoryInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Repository Pattern Tests
 *
 * Tests the Repository Pattern implementation for Student entities.
 *
 * @see https://designpatternsphp.readthedocs.io/en/latest/More/Repository/ Repository Pattern
 */
class EloquentStudentRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private StudentRepositoryInterface $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new EloquentStudentRepository();
    }

    #[Test]
    public function it_finds_student_by_id(): void
    {
        $student = Student::factory()->create([
            'name' => 'Test Student',
            'phone' => '01234567890',
        ]);

        $found = $this->repository->find($student->id);

        $this->assertNotNull($found);
        $this->assertEquals($student->id, $found->id);
    }

    #[Test]
    public function it_returns_null_for_non_existent_id(): void
    {
        $found = $this->repository->find('non-existent-id');

        $this->assertNull($found);
    }

    #[Test]
    public function it_finds_student_by_phone(): void
    {
        $student = Student::factory()->create([
            'name' => 'Phone Test Student',
            'phone' => '01234567891',
        ]);

        $found = $this->repository->findByPhone('01234567891');

        $this->assertNotNull($found);
        $this->assertEquals('01234567891', $found->phone);
    }

    #[Test]
    public function it_returns_null_for_non_existent_phone(): void
    {
        $found = $this->repository->findByPhone('99999999999');

        $this->assertNull($found);
    }

    #[Test]
    public function it_creates_student(): void
    {
        $data = [
            'name' => 'New Student',
            'phone' => '01234567892',
            'parent_phone' => '01234567893',
            'gender' => 'male',
        ];

        $student = $this->repository->create($data);

        $this->assertInstanceOf(Student::class, $student);
        $this->assertEquals('New Student', $student->name);
        $this->assertEquals('01234567892', $student->phone);
    }

    #[Test]
    public function it_updates_student(): void
    {
        $student = Student::factory()->create([
            'name' => 'Original Name',
            'phone' => '01234567893',
        ]);

        $updatedData = [
            'name' => 'Updated Name',
        ];

        $student = $this->repository->update($student, $updatedData);

        $this->assertEquals('Updated Name', $student->name);
    }

    #[Test]
    public function it_deletes_student(): void
    {
        $student = Student::factory()->create([
            'name' => 'To Delete',
            'phone' => '01234567894',
        ]);

        $result = $this->repository->delete($student);

        $this->assertTrue($result);
        $this->assertDatabaseMissing('students', ['id' => $student->id]);
    }

    #[Test]
    public function it_checks_phone_exists(): void
    {
        Student::factory()->create([
            'name' => 'Existing Student',
            'phone' => '01234567895',
        ]);

        $exists = $this->repository->existsByPhone('01234567895');
        $this->assertTrue($exists);

        $exists = $this->repository->existsByPhone('99999999999');
        $this->assertFalse($exists);
    }

    #[Test]
    public function it_paginates_students_with_search(): void
    {
        Student::factory()->create(['name' => 'Alice Smith', 'phone' => '01234567801']);
        Student::factory()->create(['name' => 'Bob Jones', 'phone' => '01234567802']);
        Student::factory()->create(['name' => 'Charlie Brown', 'phone' => '01234567803']);

        $result = $this->repository->paginate(['search' => 'Alice'], 10);

        $this->assertEquals(1, $result->count());
        $this->assertEquals('Alice Smith', $result->first()->name);
    }

    #[Test]
    public function it_finds_by_ids(): void
    {
        $student1 = Student::factory()->create(['phone' => '01234567801']);
        $student2 = Student::factory()->create(['phone' => '01234567802']);
        Student::factory()->create(['phone' => '01234567803']); // Not included

        $result = $this->repository->findByIds([$student1->id, $student2->id]);

        $this->assertEquals(2, $result->count());
    }

    #[Test]
    public function it_returns_all_students(): void
    {
        Student::factory()->count(3)->create();

        $result = $this->repository->all();

        $this->assertEquals(3, $result->count());
    }
}
