<?php

namespace App\Domains\Support\Rules;

use App\Domains\Support\Services\FileUploadValidator;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;

class SecureFileUpload implements ValidationRule
{
    protected FileUploadValidator $validator;
    protected string $fileType;

    public function __construct(string $fileType = 'image')
    {
        $this->validator = app(FileUploadValidator::class);
        $this->fileType = $fileType;
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!($value instanceof UploadedFile)) {
            return;
        }

        $errors = $this->validator->validate($value, $this->fileType);
        
        foreach ($errors as $error) {
            $fail($error);
        }
    }
}
