<?php

declare(strict_types=1);

namespace App\Http\Requests\Guardian\Summary;

use Illuminate\Foundation\Http\FormRequest;
class GuardianSummaryRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'date' => 'nullable|date',
            'period' => 'nullable|in:day,month',
            'teacher_id' => 'nullable|uuid',
        ];
    }
}
