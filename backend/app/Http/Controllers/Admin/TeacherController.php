<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Teacher\TeacherResource;
use App\Services\Admin\TeacherService;
use App\Traits\ApiResponseTrait;
use App\Http\Requests\Admin\Teacher\UpdateSubscriptionRequest;
use App\Http\Requests\Admin\Teacher\GetSubscriptionRequest;
use Illuminate\Http\Request;

class TeacherController extends Controller
{
    use ApiResponseTrait;

    protected $teacherService;

    public function __construct(TeacherService $teacherService)
    {
        $this->teacherService = $teacherService;
    }

    public function index(Request $request)
    {
        \Illuminate\Support\Facades\Log::info('TeacherController index request:', $request->all());
        $perPage = $request->input('per_page', 10);
        $filters = $request->only(['search', 'date_from', 'date_to', 'status']);
        $teachers = $this->teacherService->getTeachers($perPage, $filters);
        
        return $this->successResponse(
            TeacherResource::collection($teachers)->response()->getData(true)
        );
    }
    public function toggleStatus($id)
    {
        $teacher = $this->teacherService->toggleStatus($id);
        
        return $this->successResponse(
            new TeacherResource($teacher),
            'تم تغيير حالة المدرس بنجاح'
        );
    }

    public function approve(Request $request, $id)
    {
        $approved = $request->input('approved', true);
        
        if ($approved) {
            $teacher = $this->teacherService->approveTeacher($id);
            $message = 'تم الموافقة على المدرس بنجاح';
        } else {
            $teacher = $this->teacherService->rejectTeacher($id);
            $message = 'تم رفض المدرس';
        }
        
        return $this->successResponse(
            new TeacherResource($teacher),
            $message
        );
    }

    public function loginAsTeacher($id)
    {
        $result = $this->teacherService->loginAsTeacher($id);
        
        return $this->successResponse([
            'token' => $result['token'],
            'user' => new TeacherResource($result['user']),
            'role' => $result['role']
        ], 'تم تسجيل الدخول بنجاح');
    }

    public function updateSubscription(UpdateSubscriptionRequest $request, $id)
    {
        $teacher = $this->teacherService->paySubscription(
            $id, 
            $request->month . '-01', 
            $request->payment_amount ?? 0
        );

        return $this->successResponse(
            $teacher, // Returns the subscription object
            'تم تحديث بيانات الاشتراك بنجاح'
        );
    }

    public function getSubscription(GetSubscriptionRequest $request, $id)
    {
        $subscription = $this->teacherService->getSubscriptionForMonth($id, $request->month . '-01');

        return $this->successResponse($subscription);
    }

    public function enableIndependent($id)
    {
        $teacher = $this->teacherService->enableIndependent($id);
        
        return $this->successResponse(
            new TeacherResource($teacher),
            'تم تفعيل حالة المستقل للمدرس بنجاح'
        );
    }

    public function disableIndependent($id)
    {
        $teacher = $this->teacherService->disableIndependent($id);
        
        return $this->successResponse(
            new TeacherResource($teacher),
            'تم إلغاء حالة المستقل للمدرس بنجاح'
        );
    }

    public function addToAcademy(Request $request, $id)
    {
        $request->validate([
            'academy_id' => 'required|exists:academies,id'
        ]);

        $teacher = $this->teacherService->addToAcademy($id, $request->academy_id);
        
        return $this->successResponse(
            new TeacherResource($teacher),
            'تم إضافة المدرس للأكاديمية بنجاح'
        );
    }

    public function removeFromAcademy($id, $academyId)
    {
        $teacher = $this->teacherService->removeFromAcademy($id, $academyId);
        
        return $this->successResponse(
            new TeacherResource($teacher),
            'تم إزالة المدرس من الأكاديمية بنجاح'
        );
    }
}
