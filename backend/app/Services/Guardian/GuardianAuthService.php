<?php

namespace App\Services\Guardian;

use App\Models\Guardian;
use App\Models\Student;
use App\Models\LoginAttempt;
use App\Services\Auth\DeviceLimitService;
use App\Services\Auth\LoginAttemptService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class GuardianAuthService
{
    protected $loginAttemptService;
    protected $deviceLimitService;

    public function __construct(
        LoginAttemptService $loginAttemptService,
        DeviceLimitService $deviceLimitService
    ) {
        $this->loginAttemptService = $loginAttemptService;
        $this->deviceLimitService = $deviceLimitService;
    }

    public function login(string $phone, string $password, string $ip, string $userAgent): array
    {
        // Check for too many attempts
        if ($this->loginAttemptService->hasTooManyAttempts($phone, $ip, 'guardian')) {
            $seconds = $this->loginAttemptService->availableIn($phone, $ip, 'guardian');
            throw new \Exception("محاولات دخول كثيرة جداً. يرجى المحاولة بعد {$seconds} ثانية.", 429);
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
            $this->loginAttemptService->incrementAttempts($phone, $ip, 'guardian');
            throw new \Exception('بيانات الدخول غير صحيحة', 401);
        }

        // Check device limit
        $deviceCheck = $this->deviceLimitService->checkDevice($guardian, $userAgent);
        if (!$deviceCheck['allowed']) {
            throw new \Exception($deviceCheck['message'], 403);
        }

        $this->loginAttemptService->clearAttempts($phone, $ip, 'guardian');

        $token = $guardian->createToken('guardian-token')->plainTextToken;

        return [
            'guardian' => $guardian,
            'token' => $token,
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
                'password' => Hash::make($password), // Use the same password they used to login
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
                    $q->where('is_suspended', false);
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
            $updateData['password'] = Hash::make($data['password']);
        }

        $guardian->update($updateData);

        return $guardian;
    }
}
