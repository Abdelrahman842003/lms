<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Notification;

use Illuminate\Foundation\Http\FormRequest;

class SendNotificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization is handled by middleware or controller
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'recipient_type' => 'required|in:all_users,all_teachers,all_students,all_secretaries',
        ];
    }

    public function prepareForValidation()
    {
        // Sanitize input if needed
        $this->merge([
            'title' => strip_tags($this->input('title')),
            'message' => strip_tags($this->input('message')),
        ]);
    }
}
