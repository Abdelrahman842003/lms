<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Academy;

use App\Domains\Application\Exceptions\DomainException;
use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Auth\Models\TeacherProfile;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Media\Services\ImageService;
use App\Domains\Application\Services\CacheService;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;

class TeacherService
{
    /**
     * Get paginated teachers for academy
     */
    public function getTeachers(Academy $academy, int $perPage, ?string $search = null, ?string $status = null): LengthAwarePaginator
    {
        return $academy->teachers()
            ->select('teachers.*')
            ->when($status, function ($query) use ($status) {
                if ($status === 'active') {
                    $query->where('academy_teacher.is_active', true)
                          ->where('teachers.status', 'active');
                } elseif ($status === 'pending') {
                    $query->where('teachers.status', 'pending');
                } elseif ($status === 'inactive') {
                    $query->where('academy_teacher.is_active', false);
                }
            }, function ($query) {
                // Default: show all teachers linked to academy regardless of status
                // No default filter needed as we want to see all teachers
            })
            ->when($search, function ($query) use ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('teachers.name', 'like', "%{$search}%")
                      ->orWhere('teachers.phone', 'like', "%{$search}%");
                });
            })
            ->withPivot('is_active', 'joined_at')
            ->paginate($perPage);
    }

    /**
     * Check if teacher exists by phone number
     */
    public function checkTeacherByPhone(string $phone): ?array
    {
        $teacher = Teacher::where('phone', $phone)->first();

        if (!$teacher) {
            return null;
        }

        return [
            'id' => $teacher->id,
            'name' => $teacher->name,
            'phone' => $teacher->phone,
            'is_approved' => $teacher->status !== 'pending',
        ];
    }


    /**
     * Add teacher to academy
     */
    public function addTeacher(Academy $academy, string $teacherId): Teacher
    {
        // Check if teacher already exists in academy
        $existingPivot = $academy->teachers()->where('teacher_id', $teacherId)->first();
        
        if ($existingPivot) {
            // If teacher exists but is inactive, reactivate them
            if (!$existingPivot->pivot->is_active) {
                $academy->teachers()->updateExistingPivot($teacherId, [
                    'is_active' => true,
                    'joined_at' => Carbon::now(),
                ]);
                $this->clearAcademyDashboardCache($academy);
                
                // Reload teacher with updated pivot data
                return $academy->teachers()
                    ->select('teachers.*')
                    ->withPivot('is_active', 'joined_at')
                    ->where('teacher_id', $teacherId)
                    ->first();
            }
            
            // Teacher is already active in this academy
            throw new DomainException('المدرس موجود بالفعل في الأكاديمية');
        }

        // Teacher doesn't exist in academy, add them
        $academy->teachers()->attach($teacherId, [
            'is_active' => true,
            'joined_at' => Carbon::now(),
        ]);

        // Create the academy profile for this teacher
        $teacher = Teacher::find($teacherId);
        if ($teacher) {
            TeacherProfile::firstOrCreate([
                'teacher_id' => $teacher->id,
                'academy_id' => $academy->id,
            ], [
                'type' => 'academy',
                'display_name' => $teacher->name . ' - ' . $academy->name,
                'slug' => \Illuminate\Support\Str::slug($teacher->name) . '-' . \Illuminate\Support\Str::slug($academy->name) . '-' . substr($teacher->id, 0, 4),
                'status' => 'ACTIVE'
            ]);
        }

        $this->clearAcademyDashboardCache($academy);

        // Reload teacher with pivot data and all columns
        return $academy->teachers()
            ->select('teachers.*')
            ->withPivot('is_active', 'joined_at')
            ->where('teacher_id', $teacherId)
            ->first();
    }

    /**
     * Create new teacher and add to academy
     */
    public function createTeacher(Academy $academy, \App\Domains\Auth\DTOs\TeacherData $data): Teacher
    {
        // Check if phone exists
        if (Teacher::where('phone', $data->phone)->exists()) {
            throw new DomainException('رقم الهاتف مستخدم بالفعل');
        }

        $teacher = Teacher::create([
            'name' => $data->name,
            'phone' => $data->phone,
            'password' => $data->password,
            'subject' => $data->subject ?? null,
            'status' => 'pending', // Default to pending for new teachers
        ]);

        $academy->teachers()->attach($teacher->id, [
            'is_active' => true,
            'joined_at' => Carbon::now(),
        ]);

        // Create the academy profile for this teacher
        TeacherProfile::create([
            'teacher_id' => $teacher->id,
            'academy_id' => $academy->id,
            'type' => 'academy',
            'display_name' => $teacher->name . ' - ' . $academy->name,
            'slug' => \Illuminate\Support\Str::slug($teacher->name) . '-' . \Illuminate\Support\Str::slug($academy->name) . '-' . substr($teacher->id, 0, 4),
            'status' => 'ACTIVE'
        ]);

        $this->clearAcademyDashboardCache($academy);

        // Reload teacher with pivot data and all columns
        return $academy->teachers()
            ->select('teachers.*')
            ->withPivot('is_active', 'joined_at')
            ->where('teacher_id', $teacher->id)
            ->first();
    }

    /**
     * Update teacher
     */
    public function updateTeacher(Academy $academy, string $teacherId, \App\Domains\Auth\DTOs\TeacherData $data): Teacher
    {
        // Ensure teacher is linked to this academy
        $teacher = $academy->teachers()->findOrFail($teacherId);

        // Check if phone exists for another teacher
        if (Teacher::where('phone', $data->phone)->where('id', '!=', $teacherId)->exists()) {
            throw new DomainException('رقم الهاتف مستخدم بالفعل');
        }

        $teacher->name = $data->name;
        $teacher->phone = $data->phone;
        
        if ($data->password) {
            $teacher->password = $data->password;
        }
        
        if ($data->subject !== null) {
            $teacher->subject = $data->subject;
        }

        $teacher->save();
        $this->clearAcademyDashboardCache($academy);

        return $teacher;
    }

    /**
     * Get teacher with attendance logs
     */
    public function getTeacherWithLogs(
        Academy $academy,
        string $teacherId,
        string $dateFrom,
        string $dateTo
    ): array {
        $teacher = $academy->teachers()
            ->select('teachers.*')
            ->withPivot('is_active', 'joined_at')
            ->findOrFail($teacherId);

        $groups = $teacher->groups()
            ->where('academy_id', $academy->id)
            ->with('grade:id,name')
            ->withCount([
                'enrollments as students_count' => function ($query) use ($academy) {
                    $query->where('academy_id', $academy->id)
                        ->where('is_active', true);
                },
            ])
            ->latest()
            ->get()
            ->map(function ($group) {
                return [
                    'id' => $group->id,
                    'name' => $group->name,
                    'grade_id' => $group->grade_id,
                    'grade_name' => $group->grade?->name,
                    'time' => $group->time,
                    'days' => $this->normalizeDays($group->days),
                    'type' => $group->type instanceof \BackedEnum ? $group->type->value : (string) $group->type,
                    'price' => $group->price,
                    'students_count' => (int) ($group->students_count ?? 0),
                    'created_at' => $group->created_at?->toISOString(),
                ];
            })
            ->values();

        $grades = $teacher->grades()
            ->where('academy_id', $academy->id)
            ->withCount([
                'enrollments as students_count' => function ($query) use ($academy) {
                    $query->where('academy_id', $academy->id)
                        ->where('is_active', true);
                },
            ])
            ->orderBy('name')
            ->get()
            ->map(function ($grade) {
                return [
                    'id' => $grade->id,
                    'name' => $grade->name,
                    'price' => $grade->price,
                    'students_count' => (int) ($grade->students_count ?? 0),
                    'created_at' => $grade->created_at?->toISOString(),
                ];
            })
            ->values();

        $attendanceLogs = collect();

        $studentsCount = $teacher->enrollments()
            ->where('academy_id', $academy->id)
            ->where('is_active', true)
            ->distinct('student_id')
            ->count('student_id');

        // Calculate stats
        $totalPresent = 0;
        $totalAbsent = 0;
        $totalDuration = 0;
        $imageService = app(ImageService::class);

        return [
            'teacher' => [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'phone' => $teacher->phone,
                'subject' => $teacher->subject,
                'status' => $this->normalizeEnumValue($teacher->status),
                'is_active' => (bool) ($teacher->pivot?->is_active ?? true),
                'joined_at' => $teacher->pivot?->joined_at ? \Carbon\Carbon::parse($teacher->pivot->joined_at)->toISOString() : null,
                'avatar' => $teacher->avatar_key ? $imageService->getUrl($teacher->avatar_key) : null,
                'avatar_key' => $teacher->avatar_key,
            ],
            'groups' => $groups,
            'grades' => $grades,
            'attendance_logs' => $attendanceLogs,
            'stats' => [
                'students_count' => $studentsCount,
                'groups_count' => $groups->count(),
                'grades_count' => $grades->count(),
                'total_present' => $totalPresent,
                'total_absent' => $totalAbsent,
                'total_duration_minutes' => $totalDuration,
                'total_duration_formatted' => sprintf('%dh %dm', floor($totalDuration / 60), $totalDuration % 60),
            ],
        ];
    }

    /**
     * Toggle teacher status
     */
    public function toggleStatus(Academy $academy, string $teacherId): bool
    {
        $teacher = $academy->teachers()->findOrFail($teacherId);
        $currentStatus = $teacher->pivot->is_active;

        $academy->teachers()->updateExistingPivot($teacherId, [
            'is_active' => !$currentStatus,
        ]);
        $this->clearAcademyDashboardCache($academy);

        return !$currentStatus;
    }

    /**
     * Remove teacher from academy
     */
    public function removeTeacher(Academy $academy, string $teacherId): void
    {
        $academy->teachers()->detach($teacherId);
        $this->clearAcademyDashboardCache($academy);
    }

    private function normalizeDays(?string $days): array
    {
        if ($days === null) {
            return [];
        }

        $trimmed = trim($days);
        if ($trimmed === '') {
            return [];
        }

        if (str_starts_with($trimmed, '[')) {
            $decoded = json_decode($trimmed, true);
            if (is_array($decoded)) {
                return array_values(array_filter(array_map(static fn ($day) => trim((string) $day), $decoded)));
            }
        }

        $parts = preg_split('/\s*[،,]\s*/u', $trimmed) ?: [];

        return array_values(array_filter(array_map(static fn ($day) => trim((string) $day), $parts)));
    }

    private function normalizeEnumValue(mixed $value): ?string
    {
        if ($value instanceof \BackedEnum) {
            return (string) $value->value;
        }

        if ($value === null) {
            return null;
        }

        return (string) $value;
    }

    private function clearAcademyDashboardCache(Academy $academy): void
    {
        CacheService::forgetAcademyDashboard($academy->id);
    }
}
