<?php

namespace App\Services\Admin;

use App\Models\Teacher;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class TeacherService
{
    public function getTeachers(int $perPage = 10, array $filters = []): LengthAwarePaginator
    {
        \Illuminate\Support\Facades\Log::info('getTeachers filters:', $filters);
        
        \DB::enableQueryLog();
        
        $result = Teacher::withCount(['students', 'secretaries'])
            ->withCount(['enrollments as independent_enrollments_count' => function ($query) {
                $query->whereNull('academy_id');
            }])
            ->with(['academies:id,name'])
            ->when(isset($filters['status']) && $filters['status'] !== 'all', function ($query) use ($filters) {
                \Illuminate\Support\Facades\Log::info('Applying status filter:', ['status' => $filters['status']]);
                $query->where('status', $filters['status']);
            })
            // Backward compatibility for old filters if needed, or remove them
            ->when(isset($filters['is_approved']), function ($query) use ($filters) {
                $isApproved = filter_var($filters['is_approved'], FILTER_VALIDATE_BOOLEAN);
                if (!$isApproved) {
                    $query->where('status', 'pending');
                } else {
                    $query->where('status', '!=', 'pending');
                }
            })
            ->when(isset($filters['is_suspended']), function ($query) use ($filters) {
                $isSuspended = filter_var($filters['is_suspended'], FILTER_VALIDATE_BOOLEAN);
                if ($isSuspended) {
                    $query->where('status', 'suspended');
                } else {
                    $query->where('status', '!=', 'suspended');
                }
            })
            ->latest()
            ->filter($filters)
            ->paginate($perPage);
            
        \Illuminate\Support\Facades\Log::info('Executed queries:', \DB::getQueryLog());
        \DB::disableQueryLog();
        
        return $result;
    }

    public function toggleStatus(string $teacherId): Teacher
    {
        $teacher = Teacher::findOrFail($teacherId);
        \Illuminate\Support\Facades\Log::info("Toggling status for teacher {$teacherId}. Current status: {$teacher->status}");
        
        if ($teacher->status === 'active') {
            $teacher->status = 'suspended';
        } elseif ($teacher->status === 'suspended') {
            $teacher->status = 'active';
        }
        // If pending, maybe we shouldn't toggle? Or toggle to active?
        // Let's assume toggle is only for active/suspended.
        
        $teacher->save();
        
        \Illuminate\Support\Facades\Log::info("New status for teacher {$teacherId}: {$teacher->status}");
        
        return $teacher;
    }

    public function approveTeacher(string $teacherId): Teacher
    {
        $teacher = Teacher::findOrFail($teacherId);
        $teacher->status = 'active';
        $teacher->save();
        
        return $teacher;
    }

    public function rejectTeacher(string $teacherId): Teacher
    {
        $teacher = Teacher::findOrFail($teacherId);
        // Rejecting usually means remaining pending or deleting? 
        // Or maybe setting to 'suspended'?
        // For now, let's keep it as pending or maybe we need a 'rejected' status?
        // But user removed 'inactive'. Let's assume reject means stay pending or delete.
        // But the previous code set is_approved = false.
        $teacher->status = 'pending';
        $teacher->save();
        
        return $teacher;
    }

    public function updateSubscription(string $teacherId, array $data): Teacher
    {
        $teacher = Teacher::findOrFail($teacherId);

        if (isset($data['subscription_fee'])) {
            $teacher->subscription_fee = $data['subscription_fee'];
        }

        if (isset($data['payment_amount']) && $data['payment_amount'] > 0) {
            $teacher->paid_amount += $data['payment_amount'];
        }

        $teacher->save();

        return $teacher;
    }

    public function getSubscriptionForMonth(string $teacherId, string $month): \App\Models\TeacherSubscription
    {
        $teacher = Teacher::findOrFail($teacherId);
        // Ensure month is YYYY-MM-01
        $date = \Carbon\Carbon::parse($month)->startOfMonth();
        $monthDate = $date->format('Y-m-d');



        $subscription = $teacher->subscriptions()->firstOrCreate(
            ['month' => $monthDate],
            [
                'student_count' => $teacher->students()
                    ->wherePivot('created_at', '<=', $date->copy()->endOfMonth())
                    ->count(),
                'amount_due' => $this->calculateAmountDue($teacher, $monthDate),
                'amount_paid' => 0,
                'status' => 'pending'
            ]
        );

        // If pending, refresh the calculation to ensure it's up to date
        if ($subscription->status === 'pending') {
            // Calculate count for that specific month
            $endOfMonth = \Carbon\Carbon::parse($monthDate)->endOfMonth();
            $currentCount = $teacher->students()
                ->wherePivot('created_at', '<=', $endOfMonth)
                ->count();
                
            $currentDue = $this->calculateAmountDue($teacher, $monthDate);
            
            if ($subscription->student_count !== $currentCount || $subscription->amount_due !== $currentDue) {
                $subscription->student_count = $currentCount;
                $subscription->amount_due = $currentDue;
                $subscription->save();
            }
        }

        return $subscription;
    }

    public function paySubscription(string $teacherId, string $month, float $amount): \App\Models\TeacherSubscription
    {
        $subscription = $this->getSubscriptionForMonth($teacherId, $month);

        if ($amount > 0) {
            $subscription->amount_paid += $amount;
            
            if ($subscription->amount_paid >= $subscription->amount_due) {
                $subscription->status = 'paid';
            } else {
                $subscription->status = 'partial';
            }
            
            $subscription->save();

            \App\Models\PaymentLog::create([
                'teacher_id' => $teacherId,
                'amount' => $amount,
                'status' => 'confirmed',
                'confirmed_at' => now(),
                'client_side_uuid' => \Illuminate\Support\Str::uuid(),
                'notes' => "Subscription payment for month {$month}"
            ]);
        }

        return $subscription;
    }

    public function loginAsTeacher(string $teacherId): array
    {
        $teacher = Teacher::findOrFail($teacherId);
        
        // Create token for the teacher
        $token = $teacher->createToken('teacher_token', ['access-api'], now()->addMinutes(60))->plainTextToken;
        
        return [
            'token' => $token,
            'user' => $teacher,
            'role' => 'teacher'
        ];
    }

    private function calculateAmountDue(Teacher $teacher, ?string $month = null): float
    {
        $query = $teacher->students();
        
        if ($month) {
            $endOfMonth = \Carbon\Carbon::parse($month)->endOfMonth();
            // Count students who were enrolled BEFORE or DURING this month
            // We use the pivot table's created_at timestamp
            $query->wherePivot('created_at', '<=', $endOfMonth);
        }

        $count = $query->count();
        $price = \App\Services\HelperService::getPricePerStudent();
        
        return $count * $price;
    }

    public function enableIndependent(string $teacherId): Teacher
    {
        $teacher = Teacher::findOrFail($teacherId);
        
        // Set subscription fee to default price per student (usually 100)
        // This marks the teacher as independent in our logic
        $defaultPrice = \App\Services\HelperService::getPricePerStudent();
        $teacher->subscription_fee = $defaultPrice > 0 ? $defaultPrice : 100;
        
        $teacher->save();
        
        return $teacher;
    }

    public function disableIndependent(string $teacherId): Teacher
    {
        $teacher = Teacher::findOrFail($teacherId);
        
        // Set subscription fee to 0 to disable independent status
        $teacher->subscription_fee = 0;
        $teacher->save();
        
        return $teacher;
    }

    public function addToAcademy(string $teacherId, string $academyId): Teacher
    {
        $teacher = Teacher::findOrFail($teacherId);
        
        // Check if already attached
        if (!$teacher->academies()->where('academy_id', $academyId)->exists()) {
            $teacher->academies()->attach($academyId, ['is_active' => true, 'joined_at' => now()]);
        }
        
        return $teacher->load('academies');
    }

    public function removeFromAcademy(string $teacherId, string $academyId): Teacher
    {
        $teacher = Teacher::findOrFail($teacherId);
        
        $teacher->academies()->detach($academyId);
        
        return $teacher->load('academies');
    }

    public function deleteTeacher(string $teacherId): void
    {
        $teacher = Teacher::findOrFail($teacherId);
        $teacher->delete();
    }
}
