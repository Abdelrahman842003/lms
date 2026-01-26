<?php

namespace App\Services\Admin;

use App\Models\Teacher;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TeacherService
{
    public function getTeachers(int $perPage = 10, array $filters = []): LengthAwarePaginator
    {
        Log::info('getTeachers filters:', $filters);
        
        DB::enableQueryLog();
        
        $result = Teacher::withCount(['students', 'secretaries'])
            ->withCount(['enrollments as independent_enrollments_count' => function ($query) {
                $query->whereNull('academy_id');
            }])
            ->with(['academies:id,name', 'subscriptions' => function($q) {
                $q->where('month', now()->startOfMonth()->format('Y-m-d'));
            }])
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
            ->when(isset($filters['type']) && $filters['type'] !== 'all', function ($query) use ($filters) {
                if ($filters['type'] === 'independent') {
                    $query->where(function($q) {
                        $q->whereDoesntHave('academies')
                          ->orWhere(function($q2) {
                              $q2->whereHas('academies')
                                 ->whereHas('enrollments', function($sub) {
                                     $sub->whereNull('academy_id');
                                 });
                          });
                    });
                } elseif ($filters['type'] === 'academy') {
                    $query->whereHas('academies')
                          ->where('subscription_fee', '<=', 0)
                          ->whereDoesntHave('enrollments', function($sub) {
                              $sub->whereNull('academy_id');
                          });
                }
            })
            ->when(isset($filters['payment_status']) && $filters['payment_status'] !== 'all', function ($query) use ($filters) {
                $status = $filters['payment_status'];
                $currentMonth = now()->startOfMonth()->format('Y-m-d');

                if ($status === 'paid') {
                    $query->whereHas('subscriptions', function($q) use ($currentMonth) {
                        $q->where('month', $currentMonth)
                          ->where('status', 'paid');
                    });
                } elseif ($status === 'partial') {
                    $query->whereHas('subscriptions', function($q) use ($currentMonth) {
                        $q->where('month', $currentMonth)
                          ->where('status', 'partial');
                    });
                } elseif ($status === 'unpaid') {
                    $query->where(function($q) use ($currentMonth) {
                        $q->whereDoesntHave('subscriptions', function($sub) use ($currentMonth) {
                            $sub->where('month', $currentMonth);
                        })->orWhereHas('subscriptions', function($sub) use ($currentMonth) {
                            $sub->where('month', $currentMonth)
                                ->where('status', 'pending'); // Assuming 'pending' means unpaid
                        });
                    });
                }
            })
            ->latest()
            ->filter($filters);
            
        \Illuminate\Support\Facades\Log::info('SQL Query:', ['sql' => $result->toSql(), 'bindings' => $result->getBindings()]);
        
        $result = $result->paginate($perPage);
            
        \Illuminate\Support\Facades\Log::info('Executed queries:', \DB::getQueryLog());
        \DB::disableQueryLog();
        
        return $result;
    }

    public function createTeacher(array $data): Teacher
    {
        $teacher = new Teacher();
        $teacher->name = $data['name'];
        $teacher->phone = $data['phone'];
        $teacher->password = $data['password']; // Will be hashed by model caster
        $teacher->subject = $data['subject'] ?? null;
        $teacher->status = 'active'; // Admin created teachers are active by default
        $teacher->save();

        return $teacher;
    }

    public function updateTeacher(string $id, array $data): Teacher
    {
        \Illuminate\Support\Facades\Log::info('TeacherService updateTeacher', ['id' => $id, 'data' => $data]);
        
        $teacher = Teacher::findOrFail($id);
        
        $teacher->name = $data['name'];
        $teacher->phone = $data['phone'];
        if (isset($data['subject'])) {
            \Illuminate\Support\Facades\Log::info('Updating subject', ['old' => $teacher->subject, 'new' => $data['subject']]);
            $teacher->subject = $data['subject'];
        } else {
            \Illuminate\Support\Facades\Log::info('Subject not present in data');
        }
        
        if (isset($data['password'])) {
            $teacher->password = $data['password'];
        }
        
        $teacher->save();

        return $teacher;
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
                'student_count' => \App\Models\PaymentLog::where('teacher_id', $teacherId)
                    ->where('status', 'confirmed')
                    ->whereBetween('confirmed_at', [$date->copy()->startOfMonth(), $date->copy()->endOfMonth()])
                    ->sum('months'),
                'amount_due' => $this->calculateAmountDue($teacher, $monthDate),
                'amount_paid' => 0,
                'status' => 'pending'
            ]
        );

        // If pending, refresh the calculation to ensure it's up to date
        if ($subscription->status === 'pending') {
            // Calculate billable months for that specific month
            $startOfMonth = \Carbon\Carbon::parse($monthDate)->startOfMonth();
            $endOfMonth = \Carbon\Carbon::parse($monthDate)->endOfMonth();
            
            $billableMonths = \App\Models\PaymentLog::where('teacher_id', $teacherId)
                ->where('status', 'confirmed')
                ->whereBetween('confirmed_at', [$startOfMonth, $endOfMonth])
                ->sum('months');
                
            $currentDue = $billableMonths * \App\Services\HelperService::getPricePerStudent();
            
            // We store 'billable months' in student_count column for now to avoid schema change
            // Ideally we should rename the column or add a new one, but this works for calculation
            if ($subscription->student_count !== $billableMonths || $subscription->amount_due !== $currentDue) {
                $subscription->student_count = $billableMonths;
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

            // Generate payment key if not exists (for manual payments tracking)
            if (!$subscription->payment_key) {
                $subscription->payment_key = \App\Models\TeacherSubscription::generatePaymentKey();
                $subscription->payment_initiated_at = now();
                $subscription->payment_method = 'manual';
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
        // New Logic: Calculate based on PaymentLog (Commission/Fee per paid month)
        // Similar to AcademyBillingService

        $query = \App\Models\PaymentLog::where('teacher_id', $teacher->id)
            ->where('status', 'confirmed');

        if ($month) {
            $startOfMonth = \Carbon\Carbon::parse($month)->startOfMonth();
            $endOfMonth = \Carbon\Carbon::parse($month)->endOfMonth();
            
            $query->whereBetween('confirmed_at', [$startOfMonth, $endOfMonth]);
        }

        $totalBillableMonths = $query->sum('months');
        $price = \App\Services\HelperService::getPricePerStudent();
        
        return $totalBillableMonths * $price;
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
