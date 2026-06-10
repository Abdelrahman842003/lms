<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Student;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Student\GetLecturesRequest;
use App\Domains\Application\Http\Resources\Student\StudentLectureResource;
use App\Domains\Application\Services\Student\StudentLectureService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class StudentLectureController extends Controller
{
    public function __construct(
        private StudentLectureService $lectureService
    ) {}

    /**
     * Get lectures for a specific teacher
     */
    public function index(GetLecturesRequest $request): JsonResponse
    {
        $student = $request->user();
        $perPage = (int) $request->input('per_page', 10);
        
        $lectures = $this->lectureService->getLectures(
            $student,
            $request->validated('teacher_profile_id'),
            $perPage
        );

        $lockoutKey = "attendance_lockout:{$student->id}";
        $lockoutEnd = Cache::get($lockoutKey);
        $remainingSeconds = $lockoutEnd ? max(0, $lockoutEnd - now()->timestamp) : 0;

        $data = StudentLectureResource::collection($lectures)->response()->getData(true);
        $data['lockout'] = [
            'is_locked' => $remainingSeconds > 0,
            'remaining_seconds' => (int) $remainingSeconds,
        ];

        return $this->successResponse($data);
    }
}
