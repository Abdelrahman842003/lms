<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Academy\Student;

use App\Domains\Application\Http\Requests\BaseAuthorizedRequest;
use App\Domains\Auth\Models\Student;

/**
 * Form request for storing a new student.
 *
 * BEFORE (Insecure):
 * public function authorize(): bool
 * {
 *     return true;  // ❌ No authorization check!
 * }
 *
 * AFTER (Secure):
 * Uses BaseAuthorizedRequest with policy-based authorization.
 * Requires 'create' ability on Student model.
 */
class StoreStudentRequest extends BaseAuthorizedRequest
{
    /**
     * The ability name for authorization.
     */
    protected string $ability = 'create';

    /**
     * The model class for policy checking.
     */
    protected string $modelClass = Student::class;

    /**
     * Whether to check against a specific model instance.
     * False for 'create' operations (no model instance exists yet).
     */
    protected bool $checkInstance = false;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'parent_phone' => ['nullable', 'string', 'max:20'],
            'password' => ['nullable', 'string', 'min:6'],
            'teacher_id' => ['required', 'exists:teachers,id'],
            'grade_id' => ['nullable', 'exists:grades,id'],
            'group_id' => ['nullable', 'exists:groups,id'],
            'gender' => ['nullable', 'in:male,female'],
            'education_type' => ['nullable', 'string'],
            'location' => ['nullable', 'string'],
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
            'name.required' => 'اسم الطالب مطلوب',
            'teacher_id.required' => 'المدرس مطلوب',
            'teacher_id.exists' => 'المدرس المختار غير موجود',
            'grade_id.exists' => 'الصف الدراسي المختار غير موجود',
            'group_id.exists' => 'المجموعة المختارة غير موجودة',
            'password.min' => 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        ];
    }
}
