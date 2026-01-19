<?php

declare(strict_types=1);

namespace App\DTOs\Academy;

use Illuminate\Http\Request;

readonly class StudentData
{
    public function __construct(
        public string $name,
        public string $teacherId,
        public ?string $phone = null,
        public ?string $parentPhone = null,
        public ?string $password = null,
        public ?string $gradeId = null,
        public ?string $groupId = null,
        public ?string $gender = null,
        public ?string $educationType = null,
        public ?string $location = null,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            name: $request->validated('name'),
            teacherId: $request->validated('teacher_id'),
            phone: $request->validated('phone'),
            parentPhone: $request->validated('parent_phone'),
            password: $request->validated('password'),
            gradeId: $request->validated('grade_id'),
            groupId: $request->validated('group_id'),
            gender: $request->validated('gender'),
            educationType: $request->validated('education_type'),
            location: $request->validated('location'),
        );
    }

    public function toArray(): array
    {
        return array_filter([
            'name' => $this->name,
            'teacher_id' => $this->teacherId,
            'phone' => $this->phone,
            'parent_phone' => $this->parentPhone,
            'password' => $this->password,
            'grade_id' => $this->gradeId,
            'group_id' => $this->groupId,
            'gender' => $this->gender,
            'education_type' => $this->educationType,
            'location' => $this->location,
        ], fn($value) => $value !== null);
    }
}
