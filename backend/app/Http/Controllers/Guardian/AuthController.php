<?php

namespace App\Http\Controllers\Guardian;

use App\Http\Controllers\Controller;
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
     * Login with parent_phone + student password
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

        // Find all students with this parent_phone
        $students = Student::where('parent_phone', $request->phone)->get();

        if ($students->isEmpty()) {
            // Record failed attempt
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

        // Try to authenticate with any child's password
        $authenticatedStudent = null;
        foreach ($students as $student) {
            if (Hash::check($request->password, $student->password)) {
                $authenticatedStudent = $student;
                break;
            }
        }

        if (!$authenticatedStudent) {
            // Record failed attempt
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

        // Generate tokens using the authenticated student
        $accessToken = $authenticatedStudent->createToken('parent_access_token', ['parent-api'], now()->addMinutes(60))->plainTextToken;
        $refreshToken = $authenticatedStudent->createToken('parent_refresh_token', ['issue-access-token'], now()->addDays(30))->plainTextToken;

        return $this->successResponse([
            'token' => $accessToken,
            'refresh_token' => $refreshToken,
            'parent_phone' => $request->phone,
            'children' => $this->getChildrenData($students),
            'role' => 'parent',
        ]);
    }

    /**
     * Logout
     */
    public function logout(Request $request)
    {
        // Delete FCM token if provided (parent tokens are stored in parent_device_tokens)
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
     * Get current parent info with children
     */
    public function me(Request $request)
    {
        $student = $request->user();
        
        if (!$student || !$student->parent_phone) {
            return $this->errorResponse('غير مصرح', 401);
        }

        $students = Student::where('parent_phone', $student->parent_phone)->get();

        return $this->successResponse([
            'parent_phone' => $student->parent_phone,
            'children' => $this->getChildrenData($students),
            'role' => 'parent',
        ]);
    }

    /**
     * Get all children for the parent
     */
    public function children(Request $request)
    {
        $student = $request->user();
        
        if (!$student || !$student->parent_phone) {
            return $this->errorResponse('غير مصرح', 401);
        }

        $students = Student::where('parent_phone', $student->parent_phone)->get();

        return $this->successResponse([
            'children' => $this->getChildrenData($students),
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
}
