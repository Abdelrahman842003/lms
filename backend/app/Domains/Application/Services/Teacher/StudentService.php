<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Teacher;

use App\Domains\Application\Exceptions\DomainException;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\TeacherProfile;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Enrollments\Models\StudentActivityLog;
use App\Domains\Subscriptions\Exceptions\QuotaExceededException;
use App\Domains\Application\Filters\EnrollmentFilter;
use App\Domains\Application\Traits\HasAcademyFilter;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Domains\Enrollments\Enums\StudentActivityAction;
use App\Domains\Gamification\Models\StudentPoint;

class StudentService
{
    use HasAcademyFilter;

    /**
     * Get students for a teacher (via enrollments)
     */
    public function getStudents($teacher, $perPage = 10, $search = null, $status = null, ?string $academyId = null)
    {
        $query = Enrollment::with(['student', 'grade', 'group'])
            ->where('teacher_profile_id', $teacher->id)
            ->latest();

        // Apply filters using Filter class
        $filters = array_filter(['search' => $search, 'status' => $status], fn ($v) => $v !== null);
        (new EnrollmentFilter($filters))->apply($query);

        // Apply academy filter via grade relationship
        if ($academyId === 'independent') {
            // Independent filter: only check Enrollment academy_id
            // The enrollment itself should be independent (academy_id = null)
            // Grade/Group can be anything (they might be shared across contexts)
            $query->whereNull('academy_id');
        } elseif ($academyId) {
            // Academy filter: Check Enrollment academy_id
            $query->where('academy_id', $academyId);
        }

        return $query->paginate($perPage);
    }

    /**
     * Create or attach a student to a teacher
     * Smart flow: if student exists (by phone), attach; otherwise create
     */
    public function createStudent(TeacherProfile $teacher, array $data): array
    {
        return DB::transaction(function () use ($teacher, $data) {
            $existingStudent = null;
            $isNewStudent = true;

            // Check if student exists by phone
            if (! empty($data['phone'])) {
                $existingStudent = Student::findByPhone($data['phone']);
            }

            if ($existingStudent) {
                // Get academy_id from request data (passed from controller based on X-Academy-Id header)
                // If not provided, fallback to grade's academy_id
                $academyIdFromContext = $data['academy_id'] ?? null;

                if ($academyIdFromContext === null && ! empty($data['grade_id'])) {
                    $grade = \App\Domains\Enrollments\Models\Grade::find($data['grade_id']);
                    $academyIdFromContext = $grade?->academy_id;
                }

                // Check if already enrolled with this teacher IN THE SAME CONTEXT (academy or independent)
                $existingEnrollment = Enrollment::where('student_id', $existingStudent->id)
                    ->where('teacher_profile_id', $teacher->id);

                // Filter by academy context
                if ($academyIdFromContext) {
                    $existingEnrollment->where('academy_id', $academyIdFromContext);
                } else {
                    $existingEnrollment->whereNull('academy_id');
                }

                $existingEnrollment = $existingEnrollment->first();

                if ($existingEnrollment) {
                    // Check Limits before reactivating
                    if ($existingEnrollment->trashed() || ! $existingEnrollment->is_active) {
                        // Check Expiration
                        if ($teacher->plan_expires_at && now()->gt($teacher->plan_expires_at)) {
                            throw new DomainException('عفواً، لقد انتهت صلاحية باقتك. يرجى تجديد الاشتراك.');
                        }

                        // Check Limit
                        if (! $teacher->is_unlimited_students && $teacher->plan_max_students !== null) {
                            $currentCount = $teacher->activeEnrollments()->count();
                            $maxAllowed = $teacher->plan_max_students;

                            if ($currentCount >= $maxAllowed) {
                                throw new QuotaExceededException(
                                    message: "عفواً، لقد وصلت للحد الأقصى من الطلاب ({$maxAllowed}).",
                                    currentCount: $currentCount,
                                    maxAllowed: $maxAllowed,
                                    remainingSeats: 0
                                );
                            }
                        }

                        if ($existingEnrollment->trashed()) {
                            $existingEnrollment->restore();
                        }
                        $existingEnrollment->update(['is_active' => true]);
                    }

                    return [
                        'student' => $existingStudent,
                        'enrollment' => $existingEnrollment,
                        'is_new_student' => false,
                        'was_already_enrolled' => true,
                    ];
                }

                $student = $existingStudent;
                $isNewStudent = false;
            } else {
                // Create new student
                $student = Student::create([
                    'name' => $data['name'],
                    'password' => $data['password'],
                    'phone' => $data['phone'] ?? null,
                    'parent_phone' => $data['parent_phone'] ?? null,
                    'gender' => $data['gender'] ?? 'male',
                    'education_type' => $data['education_type'] ?? null,
                    'location' => $data['location'] ?? null,
                ]);

                // Create or link guardian if parent_phone provided
                if (! empty($data['parent_phone'])) {
                    $guardian = \App\Domains\Auth\Models\Guardian::where('phone', $data['parent_phone'])->first();

                    if (! $guardian) {
                        // Create new guardian
                        $guardian = \App\Domains\Auth\Models\Guardian::create([
                            'phone' => $data['parent_phone'],
                            'name' => $data['parent_name'] ?? $this->extractParentName($data['name']),
                            'password' => $data['password'], // Same password initially
                        ]);
                    }

                    // Link student to guardian
                    $student->guardian_id = $guardian->id;
                    $student->save();
                }
            }

            // Check student limit for NEW enrollment
            if (! $teacher->is_unlimited_students && $teacher->plan_max_students !== null) {
                $currentCount = $teacher->activeEnrollments()->count();
                $maxAllowed = $teacher->plan_max_students;

                if ($currentCount >= $maxAllowed) {
                    throw new QuotaExceededException(
                        message: "عفواً، لقد وصلت للحد الأقصى من الطلاب ({$maxAllowed}).",
                        currentCount: $currentCount,
                        maxAllowed: $maxAllowed,
                        remainingSeats: 0
                    );
                }
            }

            // Get academy_id
            $academyId = $data['academy_id'] ?? null;
            if ($academyId === null && ! empty($data['grade_id'])) {
                $grade = \App\Domains\Enrollments\Models\Grade::find($data['grade_id']);
                $academyId = $grade?->academy_id;
            }

            // Create enrollment
            $enrollment = Enrollment::create([
                'student_id' => $student->id,
                'teacher_profile_id' => $teacher->id,
                'grade_id' => $data['grade_id'] ?? null,
                'group_id' => $data['group_id'] ?? null,
                'academy_id' => $academyId,
                'balance' => $data['balance'] ?? 0,
                'is_active' => true,
            ]);

            // Log activity
            StudentActivityLog::log(
                $student->id,
                StudentActivityAction::ENROLLED->value,
                $enrollment->id,
                ['teacher_profile_id' => $teacher->id, 'is_new_student' => $isNewStudent],
                'Teacher',
                $teacher->id
            );

            // Initialize gamification points
            StudentPoint::getOrCreate($student->id, $teacher->id);

            return [
                'student' => $student,
                'enrollment' => $enrollment,
                'is_new_student' => $isNewStudent,
                'was_already_enrolled' => false,
            ];
        });
    }

    /**
     * Search for existing student by phone (for smart enrollment)
     * Uses Redis cache with phone index for fast lookups
     */
    public function searchByPhone(string $phone): ?Student
    {
        // Try to get from cache first
        $cachedId = \App\Domains\Application\Services\CacheService::getStudentIdByPhone($phone);

        if ($cachedId) {
            $cachedProfile = \App\Domains\Application\Services\CacheService::getStudentProfile($cachedId);
            if ($cachedProfile) {
                // Return cached student as model
                return Student::find($cachedId);
            }
        }

        // Not in cache, get from database
        $student = Student::findByPhone($phone);

        if ($student) {
            // Cache for future lookups
            \App\Domains\Application\Services\CacheService::cacheStudent(
                $student->id,
                $student->phone,
                $student->toArray()
            );
        }

        return $student;
    }

    /**
     * Update enrollment data (teacher-specific)
     */
    public function updateEnrollment(Enrollment $enrollment, array $data): Enrollment
    {
        $oldData = $enrollment->only(['grade_id', 'group_id', 'balance', 'is_active']);

        $enrollment->update($data);

        // Log changes
        if (isset($data['grade_id']) && $data['grade_id'] !== $oldData['grade_id']) {
            StudentActivityLog::log(
                $enrollment->student_id,
                StudentActivityAction::GRADE_CHANGE->value,
                $enrollment->id,
                ['old' => $oldData['grade_id'], 'new' => $data['grade_id']]
            );
        }

        if (isset($data['group_id']) && $data['group_id'] !== $oldData['group_id']) {
            StudentActivityLog::log(
                $enrollment->student_id,
                StudentActivityAction::GROUP_CHANGE->value,
                $enrollment->id,
                ['old' => $oldData['group_id'], 'new' => $data['group_id']]
            );
        }

        return $enrollment;
    }

    /**
     * Update student profile data (shared across teachers)
     */
    public function updateStudent(Student $student, array $data): Student
    {
        // No need for Hash::make() — the model's 'hashed' cast handles it

        // Only update student-level data
        $studentData = array_intersect_key($data, array_flip([
            'name', 'phone', 'parent_phone', 'gender', 'education_type', 'location', 'password',
        ]));

        if (! empty($studentData)) {
            $student->update($studentData);
        }

        return $student;
    }

    /**
     * Soft delete enrollment (deactivate)
     */
    public function deleteEnrollment(Enrollment $enrollment): bool
    {
        StudentActivityLog::log(
            $enrollment->student_id,
            StudentActivityAction::UNENROLLED->value,
            $enrollment->id,
            ['teacher_profile_id' => $enrollment->teacher_profile_id]
        );

        return $enrollment->delete();
    }

    /**
     * Toggle enrollment status
     */
    public function toggleStatus(Enrollment $enrollment): Enrollment
    {
        $enrollment->update(['is_active' => ! $enrollment->is_active]);

        StudentActivityLog::log(
            $enrollment->student_id,
            StudentActivityAction::STATUS_CHANGE->value,
            $enrollment->id,
            ['is_active' => $enrollment->is_active]
        );

        return $enrollment;
    }

    /**
     * Get statistics for teacher dashboard
     */
    public function getStatistics(TeacherProfile $teacher): array
    {
        // Total enrolled students
        $totalStudents = $teacher->enrollments()->count();

        // Active students
        $activeStudents = $teacher->activeEnrollments()->count();

        // New enrollments this month
        $newStudentsThisMonth = $teacher->enrollments()
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        // Top Grade by enrollment count
        $topGrade = $teacher->grades()
            ->withCount(['enrollments' => function ($q) use ($teacher) {
                $q->where('teacher_profile_id', $teacher->id);
            }])
            ->orderByDesc('enrollments_count')
            ->first();

        // Top Group by enrollment count
        $topGroup = $teacher->groups()
            ->withCount(['enrollments' => function ($q) use ($teacher) {
                $q->where('teacher_profile_id', $teacher->id);
            }])
            ->orderByDesc('enrollments_count')
            ->first();

        // Total Groups
        $totalGroups = $teacher->groups()->count();

        return [
            'total_students' => $totalStudents,
            'active_students' => $activeStudents,
            'new_students_this_month' => $newStudentsThisMonth,
            'top_grade' => $topGrade?->name ?? 'N/A',
            'top_group' => $topGroup?->name ?? 'N/A',
            'total_groups' => $totalGroups,
        ];
    }

    /**
     * Get activation details (price breakdown)
     */
    /**
     * Get activation details (price breakdown)
     */
    public function getActivationDetails(Enrollment $enrollment): array
    {
        $platformFee = \App\Domains\Application\Services\HelperService::getTeacherPricePerStudent();

        $options = [];

        // Option 1: Grade Price (Always available if grade exists)
        if ($enrollment->grade) {
            $gradePrice = (float) $enrollment->grade->price;
            $options[] = [
                'key' => 'grade',
                'label' => 'سعر الصف الدراسي',
                'base_price' => $gradePrice,
                'total_price' => $gradePrice + $platformFee,
                'is_default' => true,
            ];
        }

        // Option 2: Group Price (Only if private group with price)
        if ($enrollment->group && $enrollment->group->type === 'private' && $enrollment->group->price !== null) {
            $groupPrice = (float) $enrollment->group->price;
            $options[] = [
                'key' => 'private_group',
                'label' => 'سعر المجموعة الخاصة',
                'base_price' => $groupPrice,
                'total_price' => $groupPrice + $platformFee,
                'is_default' => false,
            ];
        }

        // If no options (shouldn't happen normally), default to 0
        if (empty($options)) {
            $options[] = [
                'key' => 'default',
                'label' => 'سعر افتراضي',
                'base_price' => 0,
                'total_price' => $platformFee,
                'is_default' => true,
            ];
        }

        return [
            'student_name' => $enrollment->student->name,
            'grade_name' => $enrollment->grade?->name,
            'group_name' => $enrollment->group?->name,
            'platform_fee' => $platformFee,
            'pricing_options' => $options,
        ];
    }

    /**
     * Activate student subscription
     */
    public function activate(Enrollment $enrollment, array $data = []): array
    {
        return DB::transaction(function () use ($enrollment, $data) {
            $startDate = now();
            $endDate = now()->addDays(30);

            // Get details to validate price
            $details = $this->getActivationDetails($enrollment);
            $options = collect($details['pricing_options']);

            // Determine selected option
            $selectedKey = $data['pricing_source'] ?? 'grade';
            $selectedOption = $options->firstWhere('key', $selectedKey) ?? $options->first();

            $expectedAmount = $selectedOption['total_price'];
            $paidAmount = $data['paid_amount'] ?? $expectedAmount;

            $enrollment->update([
                'is_active' => true,
                'subscription_start' => $startDate,
                'subscription_end' => $endDate,
            ]);

            // Log payment if amount > 0
            if ($paidAmount > 0) {
                \App\Domains\Subscriptions\Models\PaymentLog::create([
                    'client_side_uuid' => \Illuminate\Support\Str::uuid(),
                    'enrollment_id' => $enrollment->id,
                    'teacher_profile_id' => $enrollment->teacher_profile_id,
                    'student_id' => $enrollment->student_id,
                    'amount' => $paidAmount,
                    'status' => 'confirmed',
                    'confirmed_at' => now(),
                    'received_by_id' => auth()->id(),
                    'received_by_type' => 'teacher',
                    'notes' => 'Subscription activation',
                    'meta' => [
                        'base_price' => $selectedOption['base_price'],
                        'platform_fee' => $details['platform_fee'],
                        'source' => $selectedOption['key'],
                        'type' => 'subscription',
                    ],
                ]);
            }

            StudentActivityLog::log(
                $enrollment->student_id,
                StudentActivityAction::STATUS_CHANGE->value,
                $enrollment->id,
                ['is_active' => true, 'subscription_end' => $endDate]
            );

            return [
                'subscription_end' => $endDate->format('Y-m-d'),
                'days_left' => 30,
                'status' => 'active',
            ];
        });
    }

    /**
     * Get subscription history for a student - Optimized to avoid N+1
     */
    public function getSubscriptionHistory(Enrollment $enrollment): array
    {
        $history = [];
        $startDate = ($enrollment->created_at ?? now())->copy()->startOfMonth();
        $endDate = now()->endOfMonth();

        // Fetch all payments in one query instead of per-month
        $payments = \App\Domains\Subscriptions\Models\PaymentLog::where('teacher_profile_id', $enrollment->teacher_profile_id)
            ->where('student_id', $enrollment->student_id)
            ->where('status', 'confirmed')
            ->whereBetween('confirmed_at', [$startDate, $endDate])
            ->selectRaw("DATE_FORMAT(confirmed_at, '%Y-%m') as month, SUM(amount) as total")
            ->groupBy('month')
            ->pluck('total', 'month');

        $currentMonth = $startDate->copy();

        while ($currentMonth <= $endDate) {
            $monthKey = $currentMonth->format('Y-m');

            // Calculate price for this month
            $price = 0;
            if ($enrollment->group && $enrollment->group->price) {
                $price = $enrollment->group->price;
            } elseif ($enrollment->grade && $enrollment->grade->price) {
                $price = $enrollment->grade->price;
            }

            // Get paid amount from pre-fetched data
            $amountPaid = (float) ($payments[$monthKey] ?? 0);

            $amountRemaining = $price - $amountPaid;

            $status = 'pending';
            if ($amountRemaining <= 0 && $amountPaid > 0) {
                $status = 'paid';
            } elseif ($amountPaid > 0) {
                $status = 'partial';
            }

            $history[] = [
                'month' => $monthKey,
                'month_name' => \App\Domains\Application\Services\HelperService::getArabicMonthName($currentMonth->month).' '.$currentMonth->year,
                'amount_due' => (float) $price,
                'amount_paid' => $amountPaid,
                'amount_remaining' => (float) max(0, $amountRemaining),
                'status' => $status,
                'status_label' => \App\Domains\Application\Services\HelperService::getStatusLabel($status),
            ];

            $currentMonth->addMonth();
        }

        // Sort by month descending (newest first)
        return array_reverse($history);
    }

    /**
     * Extract parent name from student name (last 2 words)
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
