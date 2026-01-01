<?php

namespace App\Http\Controllers\Guardian;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use App\Models\Student;
use App\Services\Auth\LoginAttemptService;
use App\Services\Media\ImageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    protected $loginAttemptService;
    protected $imageService;

    public function __construct(
        LoginAttemptService $loginAttemptService,
        ImageService $imageService
    ) {
        $this->loginAttemptService = $loginAttemptService;
        $this->imageService = $imageService;
    }

    /**
     * Login with guardian phone + guardian password (separate from student)
     */
    public function login(Request $request)
    {
        $request->validate([
            'phone' => ['required', 'regex:/^01[0125][0-9]{8}$/'],
            'password' => 'required|string|min:6',
        ], [
            'phone.required' => 'رقم الهاتف مطلوب',
            'phone.regex' => 'رقم الهاتف يجب أن يكون رقم مصري صحيح',
            'password.required' => 'كلمة المرور مطلوبة',
            'password.min' => 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        ]);

        // Try to find guardian by phone
        $guardian = Guardian::where('phone', $request->phone)->first();

        if (!$guardian) {
            // Migration fallback: check if parent_phone exists in students (legacy system)
            $students = Student::where('parent_phone', $request->phone)->get();

            if ($students->isEmpty()) {
                $attemptResult = $this->loginAttemptService->recordFailedAttempt(
                    $request->phone,
                    $request->ip()
                );

                $message = 'رقم الهاتف غير مسجل كولي أمر';
                if (isset($attemptResult['attempts_remaining'])) {
                    $message .= ' - متبقي ' . $attemptResult['attempts_remaining'] . ' محاولات';
                }

                return $this->errorResponse($message, 401, null, $attemptResult);
            }

            // Migrate to new system: create guardian from first student
            $firstStudent = $students->first();
            if (Hash::check($request->password, $firstStudent->password)) {
                $guardian = Guardian::create([
                    'phone' => $request->phone,
                    'name' => $this->extractParentName($firstStudent->name),
                    'password' => Hash::make($request->password),
                ]);

                // Link all students to this guardian
                $students->each(function ($student) use ($guardian) {
                    $student->update(['guardian_id' => $guardian->id]);
                });
            } else {
                $attemptResult = $this->loginAttemptService->recordFailedAttempt(
                    $request->phone,
                    $request->ip()
                );

                $message = 'كلمة المرور غير صحيحة';
                if (isset($attemptResult['attempts_remaining'])) {
                    $message .= ' - متبقي ' . $attemptResult['attempts_remaining'] . ' محاولات';
                }

                return $this->errorResponse($message, 401, null, $attemptResult);
            }
        }

        // Authenticate with guardian password
        if (!Hash::check($request->password, $guardian->password)) {
            $attemptResult = $this->loginAttemptService->recordFailedAttempt(
                $request->phone,
                $request->ip()
            );

            $message = 'كلمة المرور غير صحيحة';
            if (isset($attemptResult['attempts_remaining'])) {
                $message .= ' - متبقي ' . $attemptResult['attempts_remaining'] . ' محاولات';
            }

            return $this->errorResponse($message, 401, null, $attemptResult);
        }

        // Clear failed attempts on successful login
        $this->loginAttemptService->clearAttempts($request->phone, $request->ip());

        // Generate tokens using guardian
        $accessToken = $guardian->createToken('guardian_access_token', ['parent-api'], now()->addMinutes(60))->plainTextToken;
        $refreshToken = $guardian->createToken('guardian_refresh_token', ['issue-access-token'], now()->addDays(30))->plainTextToken;

        return $this->successResponse([
            'token' => $accessToken,
            'refresh_token' => $refreshToken,
            'user' => [
                'id' => $guardian->id,
                'name' => $guardian->name,
                'phone' => $guardian->phone,
                'avatar' => $guardian->avatar_key ? $this->imageService->getUrl($guardian->avatar_key) : null,
            ],
            'parent_phone' => $guardian->phone,
            'children' => $this->getChildrenData($guardian->students),
            'role' => 'parent',
        ]);
    }

    /**
     * Logout
     */
    public function logout(Request $request)
    {
        // Delete FCM token if provided
        if ($request->has('fcm_token')) {
            \App\Models\ParentDeviceToken::removeToken($request->fcm_token);
        }

        // Delete current token
        if ($request->user()) {
            $request->user()->currentAccessToken()->delete();
        }

        return $this->successResponse(null, 'تم تسجيل الخروج بنجاح');
    }

    /**
     * Get current guardian info with children (FIXED PROFILE)
     */
    public function me(Request $request)
    {
        $guardian = $request->user(); // Now returns Guardian model
        
        if (!$guardian) {
            return $this->errorResponse('غير مصرح', 401);
        }

        return $this->successResponse([
            'user' => [
                'id' => $guardian->id,
                'name' => $guardian->name,
                'phone' => $guardian->phone,
                'avatar' => $guardian->avatar_key ? $this->imageService->getUrl($guardian->avatar_key) : null,
            ],
            'parent_phone' => $guardian->phone,
            'children' => $this->getChildrenData($guardian->students),
            'role' => 'parent',
        ]);
    }

    /**
     * Update guardian profile
     */
    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $guardian = $request->user();
        $guardian->update(['name' => $request->name]);

        return $this->successResponse([
            'user' => [
                'id' => $guardian->id,
                'name' => $guardian->name,
                'phone' => $guardian->phone,
                'avatar' => $guardian->avatar_key ? $this->imageService->getUrl($guardian->avatar_key) : null,
            ]
        ], 'تم تحديث الملف الشخصي بنجاح');
    }

    /**
     * Change guardian password (independent from students)
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ], [
            'current_password.required' => 'كلمة المرور الحالية مطلوبة',
            'new_password.required' => 'كلمة المرور الجديدة مطلوبة',
            'new_password.min' => 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
            'new_password.confirmed' => 'كلمة المرور الجديدة غير متطابقة',
        ]);

        $guardian = $request->user();

        if (!Hash::check($request->current_password, $guardian->password)) {
            return $this->errorResponse('كلمة المرور الحالية غير صحيحة', 422);
        }

        $guardian->update(['password' => Hash::make($request->new_password)]);

        return $this->successResponse(null, 'تم تغيير كلمة المرور بنجاح');
    }

    /**
     * Get all children for the guardian
     */
    public function children(Request $request)
    {
        $guardian = $request->user();
        
        if (!$guardian) {
            return $this->errorResponse('غير مصرح', 401);
        }

        return $this->successResponse([
            'children' => $this->getChildrenData($guardian->students),
        ]);
    }

    /**
     * Format children data for response
     */
    private function getChildrenData($students)
    {
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
                    return [
                        'id' => $enrollment->teacher->id,
                        'name' => $enrollment->teacher->name,
                        'avatar' => $enrollment->teacher->avatar_key 
                            ? $this->imageService->getUrl($enrollment->teacher->avatar_key) 
                            : null,
                        'grade' => $enrollment->grade?->name,
                        'group' => $enrollment->group?->name,
                    ];
                })->values();

            return [
                'id' => $student->id,
                'name' => $student->name,
                'phone' => $student->phone,
                'avatar' => $student->avatar_key 
                    ? $this->imageService->getUrl($student->avatar_key) 
                    : null,
                'teachers' => $teachers,
            ];
        });
    }

    /**
     * Extract parent name from student name (helper for migration)
     */
    private function extractParentName(string $studentName): string
    {
        $trimmedName = trim($studentName);
        if (empty($trimmedName)) {
            return 'ولي الأمر';
        }
        
        $words = preg_split('/\s+/', $trimmedName);
        
        if (count($words) === 1) {
            return $words[0];
        }
        
        if (count($words) === 2) {
            return $words[1];
        }
        
        // Take last 2 words for names with 3+ words
        return implode(' ', array_slice($words, -2));
    }
}
