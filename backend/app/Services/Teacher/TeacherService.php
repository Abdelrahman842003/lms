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

        $token = $teacher->createToken('teacher_token', ['access-api'], now()->addMinutes(60))->plainTextToken;

        return [
            'token' => $token,
            'user' => $teacher,
        ];
    }

    public function createTeacher(array $data): Teacher
    {
        // Generate username from name as slug
        $baseUsername = \Illuminate\Support\Str::slug($data['name'], '_');
        if (empty($baseUsername)) {
             $baseUsername = 'teacher';
        }
        $username = $baseUsername;
        $counter = 1;
        
        // Ensure unique username
        while (Teacher::where('username', $username)->exists()) {
            $username = $baseUsername . '_' . $counter;
            $counter++;
        }

        return Teacher::create([
            'name' => $data['name'],
            'username' => $username,
            'password' => Hash::make($data['password']),
        ]);
    }
    public function getTeacherDetails(string $id): Teacher
    {
        return Teacher::with(['students', 'secretaries'])
            ->withCount(['students', 'secretaries'])
            ->findOrFail($id);
    }
}
