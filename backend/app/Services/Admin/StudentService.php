<?php

namespace App\Services\Admin;

use App\Models\Student;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;

class StudentService
{
    public function getStudents(int $perPage = 10, array $filters = []): LengthAwarePaginator
    {
        return Student::with('teachers:id,name,created_at')
            ->latest()
            ->filter($filters)
            ->paginate($perPage);
    }

    public function createStudent(array $data): Student
    {
        $studentData = [
            'name' => $data['name'],
            'phone' => $data['phone'],
            'password' => Hash::make($data['password']),
        ];

        if (isset($data['teacher_id']) && !empty($data['teacher_id'])) {
            $studentData['teacher_id'] = $data['teacher_id'];
        }

        $student = Student::create($studentData);

        return $student->fresh(['teacher']);
    }

    public function updateStudent(Student $student, array $data): Student
    {
        $updateData = [
            'name' => $data['name'],
        ];

        if (isset($data['phone']) && !empty($data['phone'])) {
            $updateData['phone'] = $data['phone'];
        }

        if (isset($data['teacher_id'])) {
            $updateData['teacher_id'] = $data['teacher_id'];
        }

        if (isset($data['password']) && !empty($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
        }

        $student->update($updateData);

        return $student->fresh(['teacher']);
    }
    public function getStatistics(): array
    {
        $totalStudents = Student::count();
        $activeStudents = Student::count(); // Assuming all are active for now
        $joinedThisMonth = Student::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        return [
            'total_students' => $totalStudents,
            'active_students' => $activeStudents,
            'suspended_accounts' => 0,
            'joined_this_month' => $joinedThisMonth,
        ];
    }
}
