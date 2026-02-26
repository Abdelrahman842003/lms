<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Student;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Student\GetLecturesRequest;
use App\Domains\Application\Http\Resources\Student\StudentLectureResource;
use App\Domains\Application\Services\Student\StudentLectureService;
use Illuminate\Http\JsonResponse;

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
            $request->validated('teacher_id'),
            $perPage
        );

        return $this->successResponse(
            StudentLectureResource::collection($lectures)->response()->getData(true)
        );
    }
}
