<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\Lecture\StoreLectureRequest;
use App\Http\Requests\Teacher\Lecture\UpdateLectureRequest;
use App\Http\Resources\Teacher\LectureResource;
use App\Models\Lecture;
use App\Services\Teacher\LectureService;
use Illuminate\Http\Request;

class LectureController extends Controller
{
    protected $lectureService;

    public function __construct(LectureService $lectureService)
    {
        $this->lectureService = $lectureService;
    }

    public function index(Request $request)
    {
        $teacher = $request->user();
        $perPage = $request->input('per_page', 10);
        $filters = $request->only(['search', 'date_from', 'date_to']);
        $lectures = $this->lectureService->getLectures($teacher, $perPage, $filters);
        
        return $this->successResponse(
            LectureResource::collection($lectures)->response()->getData(true)
        );
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'grade_id' => 'required|exists:grades,id',
                'date' => 'required|date',
            ]);

            $date = \Carbon\Carbon::parse($validated['date']);
            
            $lecture = $this->lectureService->createLecture($request->user(), [
                'title' => $validated['title'],
                'description' => $validated['description'],
                'grade_id' => $request->input('grade_id'),
                'start_time' => $date->copy()->startOfDay(),
                'end_time' => $date->copy()->addHours(24),
                'is_active' => false,
            ]);

            return $this->successResponse([
                'lecture' => new LectureResource($lecture),
                'message' => 'تم إضافة المحاضرة بنجاح'
            ], 201);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Lecture creation failed: ' . $e->getMessage());
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function update(UpdateLectureRequest $request, Lecture $lecture)
    {
        if ($lecture->teacher_id !== $request->user()->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $data = $request->validated();

        if (isset($data['date'])) {
            $date = \Carbon\Carbon::parse($data['date']);
            $data['start_time'] = $date->copy()->startOfDay();
            $data['end_time'] = $date->copy()->addHours(24);
            unset($data['date']);
        }

        $lecture = $this->lectureService->updateLecture($lecture, $data);

        return $this->successResponse([
            'lecture' => new LectureResource($lecture),
            'message' => 'تم تحديث المحاضرة بنجاح'
        ]);
    }

    public function destroy(Request $request, Lecture $lecture)
    {
        if ($lecture->teacher_id !== $request->user()->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $this->lectureService->deleteLecture($lecture);

        return $this->successResponse([
            'message' => 'تم حذف المحاضرة بنجاح'
        ]);
    }

    public function toggleActive(Request $request, Lecture $lecture)
    {
        if ($lecture->teacher_id !== $request->user()->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $lecture->update([
            'is_active' => !$lecture->is_active
        ]);

        if ($lecture->is_active) {
            try {
                // Get active students enrolled in this grade
                $students = $lecture->teacher->students()
                    ->wherePivot('grade_id', $lecture->grade_id)
                    ->wherePivot('is_active', true)
                    ->get();

                if ($students->count() > 0) {
                    \Illuminate\Support\Facades\Notification::send(
                        $students, 
                        new \App\Notifications\LectureActivatedNotification(
                            $lecture->title, 
                            $lecture->teacher->name, 
                            $lecture->id
                        )
                    );
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to send lecture activation notification: ' . $e->getMessage());
            }
        }

        return $this->successResponse([
            'message' => $lecture->is_active ? 'تم تفعيل المحاضرة' : 'تم إلغاء تفعيل المحاضرة',
            'is_active' => $lecture->is_active
        ]);
    }

    public function endLecture(Request $request, Lecture $lecture)
    {
        if ($lecture->teacher_id !== $request->user()->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        if (!$lecture->is_active) {
            return $this->errorResponse('المحاضرة منتهية بالفعل', 400);
        }

        $this->lectureService->endLecture($lecture);

        return $this->successResponse([
            'message' => 'تم إنهاء المحاضرة وتسجيل الغياب للطلاب المتغيبين',
            'lecture' => new LectureResource($lecture->fresh())
        ]);
    }
}
