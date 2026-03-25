<?php

namespace Tests\Feature\Patterns;

use App\Domains\Auth\Repositories\StudentRepositoryInterface;
use App\Domains\Auth\Repositories\EloquentStudentRepository;
use App\Domains\Enrollments\Repositories\Contracts\EnrollmentRepository;
use App\Domains\Enrollments\Repositories\Eloquent\EloquentEnrollmentRepository;
use App\Domains\Enrollments\Repositories\Contracts\GroupRepository;
use App\Domains\Enrollments\Repositories\Eloquent\EloquentGroupRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Integration tests for the Repository Pattern implementation.
 *
 * Tests verify that:
 * - Repository interfaces can be resolved from the container
 * - Correct Eloquent implementations are bound to interfaces
 * - Repository pattern is properly configured in service providers
 */
class RepositoryPatternTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that StudentRepositoryInterface can be resolved from the container.
     */
    public function test_student_repository_interface_can_be_resolved(): void
    {
        $repository = app(StudentRepositoryInterface::class);

        $this->assertInstanceOf(StudentRepositoryInterface::class, $repository);
    }

    /**
     * Test that StudentRepositoryInterface resolves to EloquentStudentRepository.
     */
    public function test_student_repository_resolves_to_eloquent_implementation(): void
    {
        $repository = app(StudentRepositoryInterface::class);

        $this->assertInstanceOf(EloquentStudentRepository::class, $repository);
    }

    /**
     * Test that EnrollmentRepository can be resolved from the container.
     */
    public function test_enrollment_repository_interface_can_be_resolved(): void
    {
        $repository = app(EnrollmentRepository::class);

        $this->assertInstanceOf(EnrollmentRepository::class, $repository);
    }

    /**
     * Test that EnrollmentRepository resolves to EloquentEnrollmentRepository.
     */
    public function test_enrollment_repository_resolves_to_eloquent_implementation(): void
    {
        $repository = app(EnrollmentRepository::class);

        $this->assertInstanceOf(EloquentEnrollmentRepository::class, $repository);
    }

    /**
     * Test that GroupRepository can be resolved from the container.
     */
    public function test_group_repository_interface_can_be_resolved(): void
    {
        $repository = app(GroupRepository::class);

        $this->assertInstanceOf(GroupRepository::class, $repository);
    }

    /**
     * Test that GroupRepository resolves to EloquentGroupRepository.
     */
    public function test_group_repository_resolves_to_eloquent_implementation(): void
    {
        $repository = app(GroupRepository::class);

        $this->assertInstanceOf(EloquentGroupRepository::class, $repository);
    }

    /**
     * Test that repositories are bound correctly (not singleton by default).
     * Each resolution should return a new instance.
     */
    public function test_repositories_return_new_instances(): void
    {
        $repo1 = app(StudentRepositoryInterface::class);
        $repo2 = app(StudentRepositoryInterface::class);

        // Repositories should be different instances (transient binding)
        $this->assertNotSame($repo1, $repo2, 'Repositories should not be singletons');
    }

    /**
     * Test that all repository interfaces are properly bound.
     */
    public function test_all_repository_interfaces_are_bound(): void
    {
        $boundInterfaces = [
            StudentRepositoryInterface::class,
            EnrollmentRepository::class,
            GroupRepository::class,
        ];

        foreach ($boundInterfaces as $interface) {
            $this->assertTrue(
                app()->bound($interface),
                "Interface {$interface} should be bound in the container"
            );
        }
    }

    /**
     * Test that repository pattern allows for easy swapping of implementations.
     * This test verifies the interface contract is properly defined.
     */
    public function test_repository_interface_defines_contract(): void
    {
        $repository = app(StudentRepositoryInterface::class);

        // Verify the repository implements expected methods
        $this->assertTrue(
            method_exists($repository, 'find'),
            'Repository should have find method'
        );

        $this->assertTrue(
            method_exists($repository, 'create'),
            'Repository should have create method'
        );

        $this->assertTrue(
            method_exists($repository, 'update'),
            'Repository should have update method'
        );

        $this->assertTrue(
            method_exists($repository, 'delete'),
            'Repository should have delete method'
        );
    }

    /**
     * Test that EloquentStudentRepository can perform basic operations.
     */
    public function test_eloquent_student_repository_can_find_students(): void
    {
        $repository = app(StudentRepositoryInterface::class);

        // Create a student using factory
        $student = \App\Models\Student::factory()->create();

        // Find the student
        $found = $repository->find($student->id);

        $this->assertNotNull($found);
        $this->assertEquals($student->id, $found->id);
    }

    /**
     * Test that EloquentStudentRepository returns null for non-existent student.
     */
    public function test_eloquent_student_repository_returns_null_for_non_existent(): void
    {
        $repository = app(StudentRepositoryInterface::class);

        $found = $repository->find(99999);

        $this->assertNull($found);
    }

    /**
     * Test that the repository service provider is registered.
     */
    public function test_repository_service_provider_is_registered(): void
    {
        $providers = app()->getLoadedProviders();

        $this->assertArrayHasKey(
            \App\Providers\RepositoryServiceProvider::class,
            $providers,
            'RepositoryServiceProvider should be registered'
        );
    }
}
