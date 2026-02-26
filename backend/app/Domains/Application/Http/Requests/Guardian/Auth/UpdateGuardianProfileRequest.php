<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests\Guardian\Auth;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGuardianProfileRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'name' => 'required|string|max:255',
        ];
    }
}
