<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Academy;

use Illuminate\Foundation\Http\FormRequest;

class MonthlyReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'month' => 'required|integer|min:0|max:12',
            'year' => 'required|integer|min:2020',
        ];
    }

    public function messages(): array
    {
        return [
            'month.required' => 'الشهر مطلوب',
            'month.integer' => 'الشهر يجب أن يكون رقماً صحيحاً',
            'month.min' => 'الشهر غير صحيح',
            'month.max' => 'الشهر غير صحيح',
            'year.required' => 'السنة مطلوبة',
            'year.integer' => 'السنة يجب أن تكون رقماً صحيحاً',
            'year.min' => 'السنة غير صحيحة',
        ];
    }
}
