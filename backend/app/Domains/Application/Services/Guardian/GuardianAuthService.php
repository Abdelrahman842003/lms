<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Guardian;

use App\Domains\Auth\Models\Guardian;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\LoginAttempt;
use App\Domains\Auth\Services\DeviceLimitService;
use App\Domains\Auth\Services\LoginAttemptService;
use App\Domains\Auth\Services\TokenService;
use App\Domains\Application\Exceptions\DomainException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class GuardianAuthService
{
    public function __construct(
        private LoginAttemptService $loginAttemptService,
        private DeviceLimitService $deviceLimitService,
        private TokenService $tokenService
    ) {}

    public function login(string $phone, string $password, string $ip, string $userAgent, bool $remember = true): array
    {
        // Check if blocked
        if ($this->loginAttemptService->isBlocked($phone, $ip)) {
            $seconds = $this->loginAttemptService->getRemainingBanTime($phone, $ip);
            $minutes = ceil($seconds / 60);
            throw new DomainException("محاولات دخول كثيرة جداً. يرجى المحاولة بعد {$minutes} دقيقة.");
        }

        $guardian = Guardian::where('phone', $phone)->first();

        // If guardian doesn't exist, check if we can migrate from students
        if (!$guardian) {
            $students = Student::where('parent_phone', $phone)->get();
            
            if ($students->count() > 0) {
                // Check if password matches any student's password (legacy behavior)
                // Or if we should use a specific logic. 
                // For now, let's assume we check against the first student's password as a fallback
                // or require them to register/set password.
                // Based on previous controller logic, it seemed to check student passwords.
                
                // Let's try to find a student with this parent phone and matching password
                $validStudent = null;
                foreach ($students as $student) {
                    if (Hash::check($password, $student->password)) {
                        $validStudent = $student;
                        break;
                    }
                }

                if ($validStudent) {
                    // Create guardian account
                    $guardian = $this->createGuardianFromLegacy($students, $password);
                }
            }
        }

        if (!$guardian || !Hash::check($password, $guardian->password)) {
            $result = $this->loginAttemptService->recordFailedAttempt($phone, $ip);
            
            if ($result['banned']) {
                throw new DomainException("تم حظرك مؤقتاً لمدة {$result['ban_duration_minutes']} دقيقة بسبب محاولات دخول فاشلة متعددة.");
            }
            
            throw new DomainException("بيانات الدخول غير صحيحة. المحاولات المتبقية: {$result['attempts_remaining']}");
        }

        // Check device limit
        $deviceCheck = $this->deviceLimitService->checkAndManageDevices($guardian);
        if (!$deviceCheck['allowed']) {
            throw new DomainException('تم الوصول للحد الأقصى من الأجهزة المسموح بها');
        }

        $this->loginAttemptService->clearAttempts($phone, $ip);

        // Generate tokens using TokenService
        $tokens = $this->tokenService->generateTokens($guardian, $remember);

        return [
            'guardian' => $guardian,
            'token' => $tokens['access_token'],
            'refresh_token' => $tokens['refresh_token'],
            'children' => $this->getChildrenData($guardian->phone)
        ];
    }

    public function createGuardianFromLegacy(Collection $students, string $password): Guardian
    {
        return DB::transaction(function () use ($students, $password) {
            // Use the name of the parent from the first student if available, or generic
            // Actually students table usually doesn't have parent name, just phone.
            // We can use "ولي أمر [Student Name]"
            $firstStudent = $students->first();
            $name = 'ولي أمر ' . $firstStudent->name;

            $guardian = Guardian::create([
                'name' => $name,
                'phone' => $firstStudent->parent_phone,
                'password' => $password, // Use the same password they used to login
            ]);

            return $guardian;
        });
    }

    public function getChildrenData($studentsOrPhone): Collection
    {
        $students = $studentsOrPhone instanceof Collection ? $studentsOrPhone : Student::where('parent_phone', $studentsOrPhone)->get();

        return $students->map(function ($student) {
            // Get active enrollments with teachers
            $enrollments = $student->enrollments()
                ->where('is_active', true)
                ->with(['teacher' => function ($q) {
                    $q->where('status', '!=', 'suspended');
                }, 'grade', 'group'])
                ->get();

            $teachers = $enrollments
                ->filter(fn($e) => $e->teacher !== null)
                ->map(function ($enrollment) {
                    // Use a service or helper for image URL if possible, or just return key
                    // For now returning key, controller can format or we can inject ImageService here
                    return [
                        'id' => $enrollment->teacher->id,
                        'name' => $enrollment->teacher->name,
                        'avatar_key' => $enrollment->teacher->avatar_key,
                        'grade' => $enrollment->grade?->name,
                        'group' => $enrollment->group?->name,
                    ];
                })->values();

            return [
                'id' => $student->id,
                'name' => $student->name,
                'phone' => $student->phone,
                'avatar_key' => $student->avatar_key,
                'teachers' => $teachers,
            ];
        });
    }

    public function updateProfile(Guardian $guardian, array $data): Guardian
    {
        $updateData = [
            'name' => $data['name'] ?? $guardian->name,
            'phone' => $data['phone'] ?? $guardian->phone,
        ];

        if (!empty($data['password'])) {
            $updateData['password'] = $data['password'];
        }

        $guardian->update($updateData);

        return $guardian;
    }
}
