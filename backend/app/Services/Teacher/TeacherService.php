<?php

namespace App\Services\Teacher;

use App\Models\Teacher;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class TeacherService
{
    public function login(string $phone, string $password): array|false
    {
        $teacher = Teacher::where('phone', $phone)->first();

        if (! $teacher || ! Hash::check($password, $teacher->password)) {
            return false;
        }

        if ($teacher->is_suspended) {
            throw ValidationException::withMessages([
                'phone' => ['عفواً، تم تعليق حسابك. يرجى التواصل مع الإدارة.'],
            ]);
        }

        $token = $teacher->createToken('teacher_token', ['access-api'], now()->addMinutes(60))->plainTextToken;

        return [
            'token' => $token,
            'user' => $teacher,
        ];
    }

    public function createTeacher(array $data): Teacher
    {
        return Teacher::create([
            'name' => $data['name'],
            'phone' => $data['phone'],
            'password' => Hash::make($data['password']),
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
