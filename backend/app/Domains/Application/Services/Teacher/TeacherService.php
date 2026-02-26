<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Teacher;

use App\Domains\Auth\DTOs\LoginData;
use App\Domains\Auth\Models\Teacher;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class TeacherService
{
    public function login(LoginData $data): array|false
    {
        $teacher = Teacher::where('phone', $data->phone)->first();

        if (! $teacher || ! Hash::check($data->password, $teacher->password)) {
            return false;
        }

        if ($teacher->status === 'suspended') {
            throw ValidationException::withMessages([
                'phone' => ['عفواً، تم تعليق حسابك. يرجى التواصل مع الإدارة.'],
            ]);
        }

        if ($teacher->status === 'pending') {
            throw ValidationException::withMessages([
                'phone' => ['عفواً، حسابك في انتظار الموافقة. يرجى التواصل مع الإدارة.'],
            ]);
        }

        return [
            'user' => $teacher,
        ];
    }

    public function createTeacher(array $data): Teacher
    {
        return Teacher::create([
            'name' => $data['name'],
            'phone' => $data['phone'],
            'password' => Hash::make($data['password']),
            'subject' => $data['subject'] ?? null,
            'status' => $data['status'] ?? 'pending',
        ]);
    }

    public function updateTeacher(Teacher $teacher, array $data): Teacher
    {
        $updateData = [
            'name' => $data['name'],
            'phone' => $data['phone'],
        ];

        if (isset($data['password']) && $data['password']) {
            $updateData['password'] = Hash::make($data['password']);
        }

        $teacher->update($updateData);

        return $teacher;
    }

    public function getTeacherDetails(string $id): Teacher
    {
        return Teacher::with(['students', 'secretaries'])
            ->withCount(['students', 'secretaries'])
            ->findOrFail($id);
    }
}
