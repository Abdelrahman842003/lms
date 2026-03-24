<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Academy\Student;

use App\Domains\Application\Http\Requests\BaseAuthorizedRequest;
use App\Domains\Auth\Models\Student;

/**
 * Form request for updating an existing student.
 *
 * BEFORE (Insecure):
 * public function authorize(): bool
 * {
 *     return true;  // ❌ No authorization check - allows IDOR attacks!
 * }
 *
 * AFTER (Secure):
 * Uses BaseAuthorizedRequest with policy-based authorization.
 * Requires 'update' ability on the specific Student model instance.
 */
class UpdateStudentRequest extends BaseAuthorizedRequest
{
    /**
     * The ability name for authorization.
     */
    protected string $ability = 'update';

    /**
     * The model class for policy checking.
     */
    protected string $modelClass = Student::class;

    /**
     * Whether to check against a specific model instance.
     * True for 'update' operations (requires model instance for policy).
     */
    protected bool $checkInstance = true;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'parent_phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'password' => ['sometimes', 'nullable', 'string', 'min:6'],
            'grade_id' => ['sometimes', 'nullable', 'exists:grades,id'],
            'group_id' => ['sometimes', 'nullable', 'exists:groups,id'],
            'gender' => ['sometimes', 'nullable', 'in:male,female'],
            'education_type' => ['sometimes', 'nullable', 'string'],
            'location' => ['sometimes', 'nullable', 'string'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'grade_id.exists' => 'الصف الدراسي المختار غير موجود',
            'group_id.exists' => 'المجموعة المختارة غير موجودة',
            'password.min' => 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        ];
    }
}
