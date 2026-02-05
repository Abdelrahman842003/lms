<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Enrollment;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function index(Request $request)
    {
        $limit = $request->get('limit', 10);
        $search = $request->get('search');
        $status = $request->get('status');
        $type = $request->get('type'); // plan type filter
        $recordType = $request->get('record_type'); // student/teacher filter

        $results = collect();

        // Get teachers with subscription plans
        $teachers = \App\Models\Teacher::whereNotNull('plan_type')
            ->select([
                'id',
                'name',
                'phone',
                'plan_type',
                'plan_expires_at',
                'plan_max_students',
                'is_unlimited_students',
                'subscription_fee',
                'created_at'
            ])
            ->get()
            ->map(function ($teacher) {
                return (object)[
                    'id' => $teacher->id,
                    'name' => $teacher->name,
                    'phone' => $teacher->phone,
                    'teacher_name' => $teacher->name,
                    'teacher_id' => $teacher->id,
                    'academy_name' => null,
                    'plan_type' => $teacher->plan_type,
                    'plan_expires_at' => $teacher->plan_expires_at,
                    'plan_max_students' => $teacher->plan_max_students,
                    'is_unlimited_students' => $teacher->is_unlimited_students,
                    'teacher_created_at' => $teacher->created_at,
                    'subscription_start' => $teacher->created_at,
                    'subscription_end' => $teacher->plan_expires_at,
                    'subscription_fee' => $this->calculateSubscriptionFee($teacher),
                    'teacher_notes' => null,
                    'created_at' => $teacher->created_at,
                    'record_type' => 'teacher'
                ];
            });

        // Use only teachers (no students)
        $results = $teachers;

        // Apply search filter
        if ($search) {
            $results = $results->filter(function($record) use ($search) {
                return stripos($record->name, $search) !== false ||
                       stripos($record->phone, $search) !== false ||
                       stripos($record->teacher_name, $search) !== false;
            });
        }

        // Apply status filter based on subscription plan
        if ($status && $status !== 'all') {
            $results = $results->filter(function($record) use ($status) {
                switch ($status) {
                    case 'trial':
                        return $record->plan_type === 'trial';
                    case 'active':
                        return in_array($record->plan_type, ['term', 'custom']) && 
                               $record->plan_expires_at && 
                               now()->lt($record->plan_expires_at);
                    case 'expired':
                        return $record->plan_expires_at && now()->gt($record->plan_expires_at);
                    default:
                        return true;
                }
            });
        }

        // Apply entity type filter (teacher only for now)
        if ($type && $type !== 'all') {
            $results = $results->filter(function($record) use ($type) {
                return $type === 'teacher' && $record->record_type === 'teacher';
            });
        }

        // Sort and paginate
        $totalCount = $results->count();
        $currentPage = (int)$request->get('page', 1);
        $paginatedResults = $results->sortByDesc('created_at')
                                   ->forPage($currentPage, $limit)
                                   ->values();

        // Transform data for frontend
        $subscriptions = $paginatedResults->map(function ($record) {
            return [
                'id' => $record->id,
                'name' => $record->record_type === 'teacher' ? $record->teacher_name : $record->name,
                'phone' => $record->phone,
                'teacher_name' => $record->teacher_name,
                'academy_name' => $record->academy_name,
                'subscription_plan' => $this->getSubscriptionPlanLabel(
                    $record->plan_type, 
                    $record->plan_expires_at,
                    $record->teacher_created_at,
                    $record->plan_max_students,
                    $record->is_unlimited_students
                ),
                'status' => $this->calculateStatus($record),
                'subscription_start' => $record->subscription_start,
                'subscription_end' => $record->subscription_end,
                'plan_expires_at' => $record->plan_expires_at,
                'subscription_fee' => $this->calculateSubscriptionFee($record),
                'notes' => $record->teacher_notes,
                'created_at' => $record->created_at,
                'is_trial' => $record->plan_type === 'trial',
                'record_type' => $record->record_type,
            ];
        });

        // Calculate stats
        $allRecords = $results;
        
        $stats = [
            'total' => $allRecords->count(),
            'active' => $allRecords->filter(function($r) {
                return in_array($r->plan_type, ['term', 'custom']) && 
                       $r->plan_expires_at && 
                       now()->lt($r->plan_expires_at);
            })->count(),
            'trial' => $allRecords->where('plan_type', 'trial')->count(),
            'expired' => $allRecords->filter(function($r) {
                return $r->plan_expires_at && now()->gt($r->plan_expires_at);
            })->count(),
        ];

        return response()->json([
            'status' => true,
            'status_code' => 200,
            'message' => 'Subscriptions fetched successfully',
            'data' => [
                'data' => $subscriptions,
                'meta' => [
                    'total' => $totalCount,
                    'current_page' => $currentPage,
                    'per_page' => $limit,
                    'last_page' => ceil($totalCount / $limit),
                ],
                'stats' => $stats
            ]
        ]);
    }

    private function getSubscriptionPlanLabel($planType, $planExpiresAt, $teacherCreatedAt, $planMaxStudents, $isUnlimitedStudents)
    {
        if (!$planType) return 'غير محدد';
        
        switch ($planType) {
            case 'trial':
                if ($planExpiresAt && $teacherCreatedAt) {
                    $durationInDays = intval(\Carbon\Carbon::parse($teacherCreatedAt)->diffInDays($planExpiresAt));
                    return "تجريبي ({$durationInDays} يوم)";
                }
                return 'تجريبي';
                
            case 'term':
                if ($planExpiresAt && $teacherCreatedAt) {
                    $durationInMonths = intval(\Carbon\Carbon::parse($teacherCreatedAt)->diffInMonths($planExpiresAt));
                    if ($durationInMonths <= 6) {
                        return '6 شهور';
                    } elseif ($durationInMonths <= 12) {
                        return '12 شهر';
                    } else {
                        return "مدة ثابتة ({$durationInMonths} شهر)";
                    }
                }
                return 'مدة ثابتة';
                
            case 'custom':
                $label = 'باقة مخصصة';
                if ($planExpiresAt && $teacherCreatedAt) {
                    $durationInDays = intval(\Carbon\Carbon::parse($teacherCreatedAt)->diffInDays($planExpiresAt));
                    if ($durationInDays < 30) {
                        $label .= " ({$durationInDays} يوم)";
                    } else {
                        $durationInMonths = intval($durationInDays / 30);
                        $label .= " ({$durationInMonths} شهر)";
                    }
                }
                
                // Add student limit info
                if ($isUnlimitedStudents) {
                    $label .= ' - لا نهائي';
                } elseif ($planMaxStudents) {
                    $label .= " - {$planMaxStudents} طالب";
                }
                
                return $label;
                
            default:
                return 'غير محدد';
        }
    }

    private function calculateStatus($record)
    {
        if ($record->plan_type === 'trial') {
            if ($record->plan_expires_at && now()->gt($record->plan_expires_at)) {
                return 'expired';
            }
            return 'trial';
        }

        if ($record->plan_expires_at && now()->gt($record->plan_expires_at)) {
            return 'expired';
        }

        if (!$record->plan_type) return 'expired';

        return 'active';
    }

    private function calculateSubscriptionFee($record)
    {
        switch ($record->plan_type) {
            case 'trial':
                return 0;
                
            case 'term':
                if ($record->plan_expires_at && $record->teacher_created_at) {
                    $durationInMonths = intval(\Carbon\Carbon::parse($record->teacher_created_at)->diffInMonths($record->plan_expires_at));
                    $maxStudents = $record->plan_max_students ?? 50;
                    
                    // الحصول على سعر الطالب من الإعدادات
                    $pricePerStudentPerMonth = (float) \App\Models\Setting::where('key', 'pricePerStudent')->value('value') ;
                    
                    return $durationInMonths * $maxStudents * $pricePerStudentPerMonth;
                }
                return $record->subscription_fee ?? 0;
                
            case 'custom':
                if ($record->plan_expires_at && $record->teacher_created_at) {
                    $durationInMonths = intval(\Carbon\Carbon::parse($record->teacher_created_at)->diffInMonths($record->plan_expires_at));
                    $maxStudents = $record->plan_max_students ?? 50;
                    
                    // الحصول على سعر الطالب من الإعدادات
                    $pricePerStudentPerMonth = (float) \App\Models\Setting::where('key', 'pricePerStudent')->value('value');
                    
                    return $durationInMonths * $maxStudents * $pricePerStudentPerMonth;
                }
                // للباقة المخصصة، استخدم القيمة المحفوظة إذا لم تكن هناك تواريخ
                return $record->subscription_fee ?? 0;
                
            default:
                return $record->subscription_fee ?? 0;
        }
    }
}
