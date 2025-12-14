<?php

namespace App\Services\Admin;

use App\Models\Student;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;

class StudentService
{
    public function getStudents(int $perPage = 10, array $filters = []): LengthAwarePaginator
    {
        return Student::with('teacher:id,name,username,created_at')
            ->latest()
            ->filter($filters)
            ->paginate($perPage);
    }

    public function updateStudent(Student $student, array $data): Student
    {
        $updateData = [
            'name' => $data['name'],
            'username' => $data['username'],
        ];

        if (isset($data['password']) && !empty($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
        }

        $student->update($updateData);

        return $student->fresh(['teacher']);
    }
}
