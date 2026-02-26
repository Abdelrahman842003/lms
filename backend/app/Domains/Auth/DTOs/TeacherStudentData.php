<?php

declare(strict_types=1);

namespace App\Domains\Auth\DTOs;

use App\Domains\Application\Http\Requests\Teacher\Student\StoreStudentRequest;

/**
 * Data Transfer Object for Student enrollment operations.
 */
final readonly class TeacherStudentData
{
    public function __construct(
        public string $name,
        public ?string $phone,
        public ?string $parentPhone,
        public ?string $password,
        public string $gender,
        public ?string $educationType,
        public ?string $location,
        public ?string $gradeId,
        public ?string $groupId,
        public float $balance,
    ) {}

    /**
     * Create a TeacherStudentData instance from a validated request.
     */
    public static function fromRequest(StoreStudentRequest $request): self
    {
        $validated = $request->validated();
        
        return new self(
            name: $validated['name'],
            phone: $validated['phone'] ?? null,
            parentPhone: $validated['parent_phone'] ?? null,
            password: $validated['password'] ?? null,
            gender: $validated['gender'] ?? 'male',
            educationType: $validated['education_type'] ?? null,
            location: $validated['location'] ?? null,
            gradeId: $validated['grade_id'] ?? null,
            groupId: $validated['group_id'] ?? null,
            balance: (float) ($validated['balance'] ?? 0),
        );
    }

    /**
     * Get student-level data for creation.
     */
    public function toStudentArray(): array
    {
        return [
            'name' => $this->name,
            'phone' => $this->phone,
            'parent_phone' => $this->parentPhone,
            'gender' => $this->gender,
            'education_type' => $this->educationType,
            'location' => $this->location,
        ];
    }

    /**
     * Get enrollment-level data for creation.
     */
    public function toEnrollmentArray(): array
    {
        return [
            'grade_id' => $this->gradeId,
            'group_id' => $this->groupId,
            'balance' => $this->balance,
            'is_active' => true,
        ];
    }
}
