<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Teacher\Auth;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'sometimes|required|string|max:20|unique:teachers,phone,' . $this->user()->id,
            'trial_period_days' => 'sometimes|nullable|integer|min:1|max:365',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'الاسم مطلوب',
            'name.string' => 'الاسم يجب أن يكون نصاً',
            'name.max' => 'الاسم لا يمكن أن يزيد عن 255 حرفاً',
            'phone.required' => 'رقم الهاتف مطلوب',
            'phone.string' => 'رقم الهاتف يجب أن يكون نصاً',
            'phone.max' => 'رقم الهاتف لا يمكن أن يزيد عن 20 حرفاً',
            'phone.unique' => 'رقم الهاتف مستخدم من قبل',
            'trial_period_days.integer' => 'مدة الفترة التجريبية يجب أن تكون رقم صحيح',
            'trial_period_days.min' => 'مدة الفترة التجريبية يجب أن تكون يوم واحد على الأقل',
            'trial_period_days.max' => 'مدة الفترة التجريبية لا يمكن أن تزيد عن 365 يوم',
        ];
    }
}
