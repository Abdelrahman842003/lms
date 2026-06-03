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

        if ($teacher->isSubscriptionBlocked()) {
            throw ValidationException::withMessages([
                'phone' => ['عفواً، اشتراكك غير نشط أو منتهي. يرجى التواصل مع الإدارة.'],
            ]);
        }

        return [
            'user' => $teacher,
        ];
    }

    public function createTeacher(array $data): Teacher
    {
        $trialDays = (int) \App\Domains\Application\Models\Setting::getValue('trial_period_days', '14');
        $trialMaxStudents = (int) \App\Domains\Application\Models\Setting::getValue('trial_max_students', '50');

        $teacher = Teacher::create([
            'name' => $data['name'],
            'phone' => $data['phone'],
            'password' => $data['password'],
            'subject' => $data['subject'] ?? null,
            'status' => $data['status'] ?? 'pending',
            'plan_type' => 'trial',
            'plan_expires_at' => now()->addDays($trialDays),
            'plan_max_students' => $trialMaxStudents,
        ]);

        // Create trial subscription record
        \App\Domains\Subscriptions\Models\Subscription::create([
            'subscriber_id' => $teacher->id,
            'subscriber_type' => Teacher::class,
            'type' => \App\Domains\Subscriptions\Enums\SubscriptionType::TEACHER->value,
            'month' => now()->startOfMonth()->toDateString(),
            'seats_count' => 0,
            'quota_limit' => $trialMaxStudents,
            'cost_per_seat' => 0.00,
            'amount_due' => 0.00,
            'amount_paid' => 0.00,
            'status' => \App\Domains\Subscriptions\Enums\SubscriptionStatus::ACTIVE->value,
            'notes' => "فترة تجربة مجانية - {$trialDays} يوم",
            'request_type' => 'trial',
        ]);

        return $teacher;
    }

    public function updateTeacher(Teacher $teacher, array $data): Teacher
    {
        $updateData = [
            'name' => $data['name'],
            'phone' => $data['phone'],
        ];

        if (isset($data['password']) && $data['password']) {
            $updateData['password'] = $data['password'];
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
