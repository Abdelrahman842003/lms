<?php

declare(strict_types=1);

namespace App\Domains\Application\Traits;

use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

trait ApiResponseTrait
{
    /**
     * 200 — بيانات أو رسالة نجاح
     */
    protected function successResponse(
        mixed $data = null,
        string $message = 'تمت العملية بنجاح',
        int $code = Response::HTTP_OK
    ): JsonResponse {
        return response()->json([
            'status' => true,
            'status_code' => $code,
            'message' => $message,
            'data' => $data,
        ], $code);
    }

    /**
     * 201 — تم الإنشاء
     */
    protected function created(
        mixed $data = null,
        string $message = 'تم الإنشاء بنجاح'
    ): JsonResponse {
        return $this->successResponse($data, $message, Response::HTTP_CREATED);
    }

    /**
     * 400/4xx — خطأ في الطلب
     */
    protected function errorResponse(
        string $message = 'حدث خطأ',
        mixed $errors = null,
        int $code = Response::HTTP_BAD_REQUEST,
        mixed $data = null
    ): JsonResponse {
        $payload = [
            'status' => false,
            'status_code' => $code,
            'message' => $message,
        ];

        if ($errors !== null) {
            $payload['errors'] = $errors;
        }

        if ($data !== null) {
            $payload['data'] = $data;
        }

        return response()->json($payload, $code);
    }

    /**
     * 401 — غير مصادق
     */
    protected function unauthorized(string $message = 'غير مصرح بالدخول'): JsonResponse
    {
        return $this->errorResponse($message, null, Response::HTTP_UNAUTHORIZED);
    }

    /**
     * 403 — ممنوع
     */
    protected function forbidden(string $message = 'ليس لديك الصلاحية'): JsonResponse
    {
        return $this->errorResponse($message, null, Response::HTTP_FORBIDDEN);
    }

    /**
     * 404 — غير موجود
     */
    protected function notFound(string $message = 'العنصر غير موجود'): JsonResponse
    {
        return $this->errorResponse($message, null, Response::HTTP_NOT_FOUND);
    }

    /**
     * 422 — بيانات غير صالحة
     */
    protected function validationError(mixed $errors, string $message = 'بيانات غير صالحة'): JsonResponse
    {
        return $this->errorResponse($message, $errors, Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    /**
     * 429 — تجاوز حد الطلبات
     */
    protected function tooManyRequests(string $message = 'تم تجاوز الحد المسموح به'): JsonResponse
    {
        return $this->errorResponse($message, null, Response::HTTP_TOO_MANY_REQUESTS);
    }

    /**
     * Paginated response مع meta pagination
     */
    protected function paginated(
        mixed $paginator,
        mixed $resource,
        string $message = 'تم الجلب بنجاح'
    ): JsonResponse {
        return response()->json([
            'status' => true,
            'status_code' => Response::HTTP_OK,
            'message' => $message,
            'data' => $resource,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
            'links' => [
                'first' => $paginator->url(1),
                'last' => $paginator->url($paginator->lastPage()),
                'prev' => $paginator->previousPageUrl(),
                'next' => $paginator->nextPageUrl(),
            ],
        ]);
    }

    /**
     * 204 — لا محتوى (حذف ناجح مثلاً)
     */
    protected function noContent(string $message = 'تمت العملية بنجاح'): JsonResponse
    {
        return response()->json([
            'status' => true,
            'status_code' => Response::HTTP_NO_CONTENT,
            'message' => $message,
        ], Response::HTTP_NO_CONTENT);
    }
}
