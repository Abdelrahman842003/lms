<?php

namespace App\Http\Requests\Teacher\Notification;

use Illuminate\Foundation\Http\FormRequest;

class SendNotificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'recipient_type' => 'required|in:all,grade,group,admin',
            'grade_id' => 'required_if:recipient_type,grade|exists:grades,id',
            'group_id' => 'required_if:recipient_type,group|exists:groups,id',
        ];
    }

    public function prepareForValidation()
    {
        $this->merge([
            'title' => strip_tags($this->input('title')),
            'message' => strip_tags($this->input('message')),
        ]);
    }
}
