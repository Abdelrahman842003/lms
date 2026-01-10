<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\AcademyBilling;

use Illuminate\Foundation\Http\FormRequest;

class GenerateBillingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'academy_id' => ['required', 'exists:academies,id'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'year' => ['required', 'integer', 'min:2020'],
        ];
    }

    public function messages(): array
    {
        return [
            'academy_id.required' => 'الأكاديمية مطلوبة',
            'academy_id.exists' => 'الأكاديمية غير موجودة',
            'month.required' => 'الشهر مطلوب',
            'month.min' => 'الشهر يجب أن يكون بين 1 و 12',
            'month.max' => 'الشهر يجب أن يكون بين 1 و 12',
            'year.required' => 'السنة مطلوبة',
            'year.min' => 'السنة غير صحيحة',
        ];
    }
}
